const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');
const { MongoDBAtlasVectorSearch, MongoDBAtlasSemanticCache } = require('@langchain/mongodb');
const { MongoDBStore } = require('@langchain/mongodb');
const { ChatTogetherAI } = require('@langchain/community/chat_models/togetherai');
const { HumanMessage } = require('@langchain/core/messages');
const { CacheBackedEmbeddings } = require('langchain/embeddings/cache_backed');
const { MongoClient } = require('mongodb');
// eslint-disable-next-line import/extensions
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * GET /ai
 * List of AI examples.
 */
exports.getAi = (req, res) => {
  res.render('ai/index', {
    title: 'AI Examples',
  });
};

/**
 * Helper function to ensure the vector search index exists for RAG Boilerplate
 */
// RAG collection names
const RAG_CHUNKS = 'rag_chunks';
const DOC_EMBEDDINGS_CACHE = 'doc_emb_cache';
const QUERY_EMBEDDINGS_CACHE = 'query_emb_cache';
const LLM_SEMANTIC_CACHE = 'llm_sem_cache';

// Initialization status flags
let ragFolderReady = false;
let ragCollectionReady = false;
let vectorIndexConfigured = false;

function prepareRagFolder() {
  const inputDir = path.join(__dirname, '../rag_input');
  const ingestedDir = path.join(inputDir, 'ingested');
  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
  }
  if (!fs.existsSync(ingestedDir)) {
    fs.mkdirSync(ingestedDir, { recursive: true });
  }
  ragFolderReady = true;
}

/*
 * Helper function to create vector search collections in MongoDB Atlas
 */
async function createCollectionForVectorSearch(db, collectionName, indexes) {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    const collection = await db.createCollection(collectionName);
    console.log(`Collection ${collectionName} created.`);
    await collection.createSearchIndex({
      name: 'default',
      definition: {
        mappings: {
          dynamic: true,
          fields: {
            embedding: { dimensions: 1024, similarity: 'cosine', type: 'knnVector' },
          },
        },
      },
    });
    console.log(`Vector search index added to ${collectionName}.`);
    await Promise.all(
      indexes.map(async (index) => {
        await collection.createIndex(index);
      }),
    );
    return collection;
  }
  return db.collection(collectionName);
}

/**
 * Initialize the MongoDB collection for RAG
 */
async function setupRagCollection(db) {
  // Setup the vector search collections if they don't exist.
  // We use fileHash to see if a file with the same hash has already been processed,
  // to avoid duplicate data in the vector DB.
  // We use fileName to list the files that have been ingested in the frontend.
  // llm_string and prompt combo is used to see if we have already processed the same LLM query.
  const ragCollection = await createCollectionForVectorSearch(db, RAG_CHUNKS, [{ fileHash: 1 }, { fileName: 1 }]); // for the RAG chunks from input documents
  await createCollectionForVectorSearch(db, LLM_SEMANTIC_CACHE, [{ llm_string: 1, prompt: 1 }]); // for the LLM semantic cache so we can reduce LLM calls and related costs

  // Create the document embedding cache collection if it doesn't exist
  const docCacheCollections = await db.listCollections({ name: DOC_EMBEDDINGS_CACHE }).toArray();
  if (docCacheCollections.length === 0) {
    await db.createCollection(DOC_EMBEDDINGS_CACHE);
    console.log(`Created collection ${DOC_EMBEDDINGS_CACHE} for permanent document embedding cache.`);
  }

  // Create the query embedding cache collection with TTL if it doesn't exist
  const queryCacheCollections = await db.listCollections({ name: QUERY_EMBEDDINGS_CACHE }).toArray();
  if (queryCacheCollections.length === 0) {
    await db.createCollection(QUERY_EMBEDDINGS_CACHE);
    console.log(`Created collection ${QUERY_EMBEDDINGS_CACHE} for query embedding cache with TTL.`);

    // Set a TTL index (60 days) for automatic expiration
    await db.collection(QUERY_EMBEDDINGS_CACHE).createIndex({ createdAt: 1 }, { expireAfterSeconds: 5184000 }); // 60 days
    console.log('Created TTL index on query embedding cache (expiration: 60 days).');
  }
  ragCollectionReady = true;
  console.log('Vector Search and Embedding Cache Collections have been set up.');
  return ragCollection;
}

/**
 * Helper function to update or set a vector index in MongoDB Atlas with a new index definition
 */
async function setVectorIndex(collection, indexDefinition) {
  const existingIndexes = await collection.listSearchIndexes().toArray();
  const defaultIndex = existingIndexes.find((index) => index.name === 'default');
  if (!defaultIndex) {
    await collection.createSearchIndex({ name: 'default', definition: indexDefinition });
    console.log(`Created vector search index for ${collection.collectionName} with dimensions: ${indexDefinition.mappings.fields.embedding.dimensions}.`);
  } else if (defaultIndex.latestDefinition?.mappings?.fields?.embedding?.dimensions !== indexDefinition.mappings.fields.embedding.dimensions) {
    await collection.updateSearchIndex('default', indexDefinition);
    console.log(`Updated vector search index for ${collection.collectionName} with dimensions: ${indexDefinition.mappings.fields.embedding.dimensions}.`);
  }
}

/**
 * Configure or update the vector index dimensions based on our embedding results
 * Do this only once. If you change your embedding model to a different one,
 * you should switch to a new collection, since you need to use the same model that
 * was used to generate the embeddings when performing queries (similarity search, etc.)
 */
async function configureVectorIndex(db) {
  const collection = db.collection(RAG_CHUNKS);
  const sampleDoc = await collection.findOne({ embedding: { $exists: true } });
  if (sampleDoc?.embedding?.length) {
    const indexDefinition = {
      mappings: {
        dynamic: true,
        fields: {
          embedding: { dimensions: sampleDoc.embedding.length, similarity: 'cosine', type: 'knnVector' },
        },
      },
    };
    await setVectorIndex(db.collection(RAG_CHUNKS), indexDefinition);
    await setVectorIndex(db.collection(LLM_SEMANTIC_CACHE), indexDefinition);
    vectorIndexConfigured = true;
  } else {
    console.error('No embeddings found yet; cannot update vector index.');
  }
}

/**
 * GET /ai/rag
 * RAG dashboard: show ingested files, allow question submission, and show results.
 * The page also includes a block diagram for the RAG Boilerplate and its components.
 */
exports.getRag = async (req, res) => {
  if (!ragFolderReady) prepareRagFolder();

  // Get the list all files in the MongoDB vector DB to display in the frontend
  const client = new MongoClient(process.env.MONGODB_URI);
  let ingestedFiles = [];
  try {
    await client.connect();
    const db = client.db();
    const collection = ragCollectionReady ? db.collection(RAG_CHUNKS) : await setupRagCollection(db);
    ingestedFiles = await collection.distinct('fileName');
  } catch (err) {
    console.log(err);
    ingestedFiles = [];
  } finally {
    await client.close();
  }

  res.render('ai/rag', {
    title: 'Retrieval-Augmented Generation (RAG) Demo',
    ingestedFiles,
    ragResponse: null,
    llmResponse: null,
    question: '',
    maxInputLength: 500,
  });
};

/**
 * POST /ai/rag/ingest
 * Scan rag_input/, ingest new PDFs, update MongoDB, move files, return status.
 */
exports.postRagIngest = async (req, res) => {
  if (!ragFolderReady) prepareRagFolder();
  const inputDir = path.join(__dirname, '../rag_input');
  const ingestedDir = path.join(inputDir, 'ingested');

  // Get the list of PDF files in the input directory
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.pdf'))
    .filter((f) => !f.includes('ingested')); // Exclude anything from the ingested directory

  if (files.length === 0) {
    req.flash('info', {
      msg: 'No PDF files found in the input directory. Add files to ./rag_input directory to process.',
    });
    return res.redirect('/ai/rag');
  }

  const skipped = [];
  const processed = [];
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const collection = ragCollectionReady ? db.collection(RAG_CHUNKS) : await setupRagCollection(db);
    const documentEmbeddingsCache = new MongoDBStore({ collection: db.collection(DOC_EMBEDDINGS_CACHE) });
    const queryEmbeddingsCache = new MongoDBStore({ collection: db.collection(QUERY_EMBEDDINGS_CACHE) });

    // Process files sequentially using reduce
    await files.reduce(async (promise, file) => {
      // Wait for the previous file to finish processing
      await promise;

      const filePath = path.join(inputDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check if this file has already been processed to avoid duplicate data in the
      // vector DB. We check for a matching hash in case the same file was processed
      // under a different name, etc.
      const hashCount = await collection.countDocuments({ fileHash: hash });
      if (hashCount > 0) {
        console.log(`File ${file} already processed (hash: ${hash}, found ${hashCount} existing chunks).`);
        skipped.push(file);
        // Move to ingested even if skipped
        fs.renameSync(filePath, path.join(ingestedDir, file));
        return promise;
      }

      // Process the PDF file
      try {
        const loader = new PDFLoader(filePath, {
          pdfjs: () => Promise.resolve(pdfjsLib),
        });
        const docs = await loader.load();
        // Split the document into chunks
        // Use RecursiveCharacterTextSplitter to split the documents into smaller chunks
        // When querying the model later, the vector search finds the most relevant chunks
        // based on text similarity and sends them to the LLM as context. The chunk size
        // and overlap can be adjusted for performance.
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const chunks = await splitter.splitDocuments(docs);
        const chunksWithMetadata = chunks.map((chunk) => ({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            fileHash: hash,
            fileName: file,
          },
        }));

        // Create embeddings and store them in MongoDB
        // Use HuggingFaceInferenceEmbeddings as the hosted embedding model provider.
        // You can also use OpenAIEmbeddings or other providers.
        // If you change your embedding model, you would need to reprocess all your
        // files and recreate the vector index if the embedding dimensions are different.
        const cacheBackedEmbeddings = CacheBackedEmbeddings.fromBytesStore(
          new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_KEY,
            model: process.env.HUGGINGFACE_EMBEDDING_MODEL,
            provider: process.env.HUGGINGFACE_PROVIDER,
          }),
          documentEmbeddingsCache,
          {
            namespace: process.env.HUGGINGFACE_EMBEDDING_MODEL,
            queryEmbeddingStore: queryEmbeddingsCache,
          },
        );

        // Create embeddings and add them to MongoDB
        await MongoDBAtlasVectorSearch.fromDocuments(chunksWithMetadata, cacheBackedEmbeddings, {
          collection,
          indexName: 'default',
          textKey: 'text',
          embeddingKey: 'embedding',
        });

        // If this is the first file processed, resize the vector index to match the output
        // dimensions of the embedding model. The vector index allows us to perform vector search
        // in MongoDB. We only need to do this resizing once, so we can skip it for subsequent files.
        if (!vectorIndexConfigured) {
          await configureVectorIndex(db);
        }
        // Move the file to the ingested directory after processing to avoid reprocessing.
        fs.renameSync(filePath, path.join(ingestedDir, file));
        processed.push(file);
        console.log(`Successfully processed ${file} (hash: ${hash})`);
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        throw err;
      }
    }, Promise.resolve());

    if (processed.length > 0 && skipped.length > 0) {
      req.flash('success', {
        msg: `Successfully ingested ${processed.length} file(s): ${processed.join(', ')}. Skipped ${skipped.length} existing file(s): ${skipped.join(', ')}`,
      });
    } else if (processed.length > 0) {
      req.flash('success', {
        msg: `Successfully ingested ${processed.length} file(s): ${processed.join(', ')}`,
      });
    } else if (skipped.length > 0) {
      req.flash('info', {
        msg: `No new files to ingest. ${skipped.length} file(s) have already been processed: ${skipped.join(', ')}`,
      });
    }
  } catch (err) {
    console.error('Error during ingestion:', err);
    req.flash('errors', {
      msg: `Error during ingestion: ${err.message}`,
    });
  } finally {
    await client.close();
  }
  res.redirect('/ai/rag');
};

/**
 * POST /ai/rag/ask
 * Accepts a question, runs RAG and non-RAG queries, and returns both responses.
 */
exports.postRagAsk = async (req, res) => {
  const question = (req.body.question || '').slice(0, 500);
  if (!question.trim()) {
    req.flash('errors', { msg: 'Please enter a question.' });
    return res.redirect('/ai/rag');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const collection = ragCollectionReady ? db.collection(RAG_CHUNKS) : await setupRagCollection(db);
    const documentEmbeddingsCache = new MongoDBStore({ collection: db.collection(DOC_EMBEDDINGS_CACHE) });
    const queryEmbeddingsCache = new MongoDBStore({ collection: db.collection(QUERY_EMBEDDINGS_CACHE) });
    const llmSemCacheCollection = db.collection(LLM_SEMANTIC_CACHE);

    // Get list of ingested files for display in the frontend
    const ingestedFiles = await collection.distinct('fileName');
    if (ingestedFiles.length === 0) {
      req.flash('errors', {
        msg: 'No files have been indexed for RAG. Please upload your relevant PDF files to the ./rag_input directory and ingest them before asking questions.',
      });
      return res.redirect('/ai/rag');
    }

    // Check and configure the vector index to address the potential edge case when
    // LLM_SEMANTIC_CACHE was recreated prior to the app restart, while RAG_CHUNKS was not.
    if (!vectorIndexConfigured) {
      await configureVectorIndex(db);
    }

    // Check if the vector search index is ready
    const ragCollectionStatus = (await collection.listSearchIndexes().toArray()).find((index) => index.name === 'default').status;
    if (ragCollectionStatus !== 'READY') {
      req.flash('errors', { msg: `RAG search index is not ready - status: ${ragCollectionStatus}. Please try again in a few minutes.` });
      return res.redirect('/ai/rag');
    }
    const llmSemCacheCollectionStatus = (await llmSemCacheCollection.listSearchIndexes().toArray()).find((index) => index.name === 'default').status;
    if (llmSemCacheCollectionStatus !== 'READY') {
      req.flash('errors', { msg: `LLM semantic cache search index is not ready - status: ${llmSemCacheCollectionStatus}. Please try again in a few minutes.` });
      return res.redirect('/ai/rag');
    }

    // Set up vector store and embeddings
    // Instantiate HuggingFaceInferenceEmbeddings for consistency with the embedding model
    // used during ingestion. We do not use the embedding model for the LLM, but we use it
    // for the vector search. The HuggingFaceInferenceEmbeddings instance converts the
    // user's question into an embedding, which is then passed to MongoDBAtlasVectorSearch.
    // This enables the system to perform a similarity search against stored document
    // embeddings, retrieving the most relevant chunks based on meaning rather than exact
    // keywords.
    const cacheBackedEmbeddings = CacheBackedEmbeddings.fromBytesStore(
      new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HUGGINGFACE_KEY,
        model: process.env.HUGGINGFACE_EMBEDDING_MODEL,
        provider: process.env.HUGGINGFACE_PROVIDER,
      }),
      documentEmbeddingsCache,
      {
        namespace: process.env.HUGGINGFACE_EMBEDDING_MODEL,
        queryEmbeddingStore: queryEmbeddingsCache,
      },
    );
    const vectorStore = new MongoDBAtlasVectorSearch(cacheBackedEmbeddings, {
      collection,
      indexName: 'default',
      textKey: 'text',
      embeddingKey: 'embedding',
    });

    const llmSemanticCache = new MongoDBAtlasSemanticCache(
      llmSemCacheCollection,
      cacheBackedEmbeddings, // Embedding model should be passed separately
      { scoreThreshold: 0.99 }, // Optional similarity threshold settings
    );
    const relevantDocs = await vectorStore.similaritySearch(question, 8); // Retrieve top 8 relevant chunks
    const context = relevantDocs.map((doc) => doc.pageContent).join('\n---\n');

    // Set up LLM
    const llm = new ChatTogetherAI({
      apiKey: process.env.TOGETHERAI_API_KEY,
      model: process.env.TOGETHERAI_MODEL,
      cache: llmSemanticCache,
    });

    // RAG prompt
    const ragPrompt = `You are an assistant. Use the following context to answer the user's question.\n\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`;
    // Non-RAG prompt
    const llmPrompt = `Answer the following question as best as you can:\n${question}\nAnswer:`;

    // Run batch LLM calls
    const results = await llm.generate([[new HumanMessage(ragPrompt)], [new HumanMessage(llmPrompt)]]);

    // Before parsing the results, check to see if we have a valid response so we don't crash
    if (!results?.generations?.length || results.generations.length < 2) {
      req.flash('errors', { msg: `Unable to get a valid response from the LLM. Please try again.` });
      return res.redirect('/ai/rag');
    }
    const ragResponse = results.generations[0][0].text;
    const llmResponse = results.generations[1][0].text;
    res.render('ai/rag', {
      title: 'Retrieval-Augmented Generation (RAG) Demo',
      ingestedFiles,
      ragResponse,
      llmResponse,
      question,
      maxInputLength: 500,
    });
  } catch (error) {
    console.error('RAG Error:', error);
    req.flash('errors', { msg: `Error: ${error.message}` });
    res.redirect('/ai/rag');
  } finally {
    await client.close();
  }
};

/**
 * GET /ai/openai-moderation
 * OpenAI Moderation API example.
 */
exports.getOpenAIModeration = (req, res) => {
  res.render('ai/openai-moderation', {
    title: 'OpenAI Input Moderation',
    result: null,
    error: null,
    input: '',
  });
};

/**
 * POST /ai/openai-moderation
 * OpenAI Moderation API example.
 */
exports.postOpenAIModeration = async (req, res) => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const inputText = req.body.inputText || '';
  let result = null;
  let error = null;

  if (!openAiKey) {
    error = 'OpenAI API key is not set in environment variables.';
  } else if (!inputText.trim()) {
    error = 'Text for input modaration check:';
  } else {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'text-moderation-latest',
          input: inputText,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        error = errData.error && errData.error.message ? errData.error.message : `API Error: ${response.status}`;
      } else {
        const data = await response.json();
        result = data.results && data.results[0];
      }
    } catch (err) {
      console.error('OpenAI Moderation API Error:', err);
      error = 'Failed to call OpenAI Moderation API.';
    }
  }

  res.render('ai/openai-moderation', {
    title: 'OpenAI Moderation API',
    result,
    error,
    input: inputText,
  });
};

/**
 * Helper functions and constants for Together AI API Example
 * We are using LLMs to classify text or analyze a picture taken by the user's camera.
 */

// Shared Together AI API caller
const callTogetherAiApi = async (apiRequestBody, apiKey) => {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(apiRequestBody),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Together AI API Error Response:', errData);
    const errorMessage = errData.error && errData.error.message ? errData.error.message : `API Error: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

// Vision-specific functions
const createVisionLLMRequestBody = (dataUrl, model) => ({
  model,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is in this image?',
        },
        {
          type: 'image_url',
          image_url: {
            url: dataUrl,
          },
        },
      ],
    },
  ],
});

const extractVisionAnalysis = (data) => {
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
    return data.choices[0].message.content;
  }
  return 'No vision analysis available';
};

// Classifier-specific functions
const createClassifierLLMRequestBody = (inputText, model, systemPrompt) => ({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: inputText },
  ],
  temperature: 0,
  max_tokens: 64,
});

const extractClassifierResponse = (content) => {
  let department = null;
  if (content) {
    try {
      // Try to extract JSON from the response
      const jsonStringMatch = content.match(/{.*}/s);
      if (jsonStringMatch) {
        const parsed = JSON.parse(jsonStringMatch[0].replace(/'/g, '"'));
        department = parsed.department;
      }
    } catch (err) {
      console.log('Failed to parse JSON from TogetherAI API response:', err);
      // fallback: try to extract department manually
      const match = content.match(/"department"\s*:\s*"([^"]+)"/);
      if (match) {
        [, department] = match;
      }
    }
  }
  return department || 'Unknown';
};

// System prompt for the classifier
// This is the system prompt that instructs the LLM on how to classify the customer message
// into the appropriate department.
const messageClassifierSystemPrompt = `You are a customer service classifier for an e-commerce platform. Your role is to identify the primary issue described by the customer and return the result in JSON format. Carefully analyze the customer's message and select one of the following departments as the classification result:

Order Tracking and Status
Returns and Refunds
Payments and Billing Issues
Account Management
Product Inquiries
Technical Support
Shipping and Delivery Issues
Promotions and Discounts
Marketplace Seller Support
Feedback and Complaints

Provide the output in this JSON structure:

{
  "department": "<selected_department>"
}
Replace <selected_department> with the name of the most relevant department from the list above. If the inquiry spans multiple categories, choose the department that is most likely to address the customer's issue promptly and effectively.`;

// Image Uploade middleware for Camera uploads
const createImageUploader = () => {
  const memoryStorage = multer.memoryStorage();
  return multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }).single('image');
};

exports.imageUploadMiddleware = (req, res, next) => {
  const uploadToMemory = createImageUploader();
  uploadToMemory(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

const createImageDataUrl = (file) => {
  const base64Image = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64Image}`;
};

/**
 * GET /ai/togetherai-camera
 * Together AI Camera Analysis Example
 */
exports.getTogetherAICamera = (req, res) => {
  res.render('ai/togetherai-camera', {
    title: 'Together.ai Camera Analysis',
    togetherAiModel: process.env.TOGETHERAI_VISION_MODEL,
  });
};

/**
 * POST /ai/togetherai-camera
 * Analyze image using Together AI Vision
 */
exports.postTogetherAICamera = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  try {
    const togetherAiKey = process.env.TOGETHERAI_API_KEY;
    const togetherAiModel = process.env.TOGETHERAI_VISION_MODEL;
    if (!togetherAiKey) {
      return res.status(500).json({ error: 'TogetherAI API key is not set' });
    }
    const dataUrl = createImageDataUrl(req.file);
    const apiRequestBody = createVisionLLMRequestBody(dataUrl, togetherAiModel);
    // console.log('Making Vision API request to Together AI...');
    const data = await callTogetherAiApi(apiRequestBody, togetherAiKey);
    const analysis = extractVisionAnalysis(data);
    // console.log('Vision analysis completed:', analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: `Error analyzing image: ${error.message}` });
  }
};

/**
 * GET /ai/togetherai-classifier
 * Together AI / LLM API Example.
 */
exports.getTogetherAIClassifier = (req, res) => {
  res.render('ai/togetherai-classifier', {
    title: 'Together.ai/LLM Department Classifier',
    result: null,
    togetherAiModel: process.env.TOGETHERAI_MODEL,
    error: null,
    input: '',
  });
};

/**
 * POST /ai/togetherai-classifier
 * Together AI API Example.
 * - Classifies customer service inquiries into departments.
 * - Uses Together AI API with a foundational LLM model to classify the input text.
 * - The systemPrompt is the instructions from the developer to the model for processing
 *   the user input.
 */
exports.postTogetherAIClassifier = async (req, res) => {
  const togetherAiKey = process.env.TOGETHERAI_API_KEY;
  const togetherAiModel = process.env.TOGETHERAI_MODEL;
  const inputText = (req.body.inputText || '').slice(0, 300);
  let result = null;
  let error = null;
  if (!togetherAiKey) {
    error = 'TogetherAI API key is not set in environment variables.';
  } else if (!togetherAiModel) {
    error = 'TogetherAI model is not set in environment variables.';
  } else if (!inputText.trim()) {
    error = 'Please enter the customer message to classify.';
  } else {
    try {
      const systemPrompt = messageClassifierSystemPrompt; // Your existing system prompt here
      const apiRequestBody = createClassifierLLMRequestBody(inputText, togetherAiModel, systemPrompt);
      const data = await callTogetherAiApi(apiRequestBody, togetherAiKey);
      const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      const department = extractClassifierResponse(content);
      result = {
        department,
        raw: content,
        systemPrompt,
      };
    } catch (err) {
      console.log('TogetherAI Classifier API Error:', err);
      error = 'Failed to call TogetherAI API.';
    }
  }

  res.render('ai/togetherai-classifier', {
    title: 'TogetherAI Department Classifier',
    result,
    error,
    input: inputText,
  });
};
