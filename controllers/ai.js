const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
