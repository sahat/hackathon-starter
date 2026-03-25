/**
 * Novita AI LLM Integration Controller
 * Provides LLM chat and text classification using Novita AI's OpenAI-compatible API
 * API Documentation: https://novita.ai/docs
 */

/**
 * GET /ai/novita
 * Novita AI LLM demo page
 */
exports.getNovita = (req, res) => {
  res.render('ai/novita', {
    title: 'Novita AI LLM',
    result: null,
    error: null,
    input: '',
    llmModel: process.env.NOVITA_MODEL,
  });
};

/**
 * Helper function to call Novita AI's OpenAI-compatible API
 * @param {Object} apiRequestBody - The request body for the chat completions API
 * @param {string} apiKey - Novita API key
 * @returns {Promise<Object>} - The API response
 */
const callNovitaApi = async (apiRequestBody, apiKey) => {
  const response = await fetch('https://api.novita.ai/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(apiRequestBody),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Novita API Error Response:', errData);
    const errorMessage = errData.error && errData.error.message ? errData.error.message : `API Error: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

/**
 * Helper function to create classifier LLM request body
 * @param {string} inputText - The text to classify
 * @param {string} model - The model to use
 * @param {string} systemPrompt - The system prompt
 * @returns {Object} - The request body
 */
const createClassifierLLMRequestBody = (inputText, model, systemPrompt) => ({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: inputText },
  ],
  temperature: 0,
  max_tokens: 64,
});

/**
 * Helper function to extract classifier response from LLM output
 * @param {string} content - The raw LLM response content
 * @returns {string} - The extracted department
 */
const extractClassifierResponse = (content) => {
  let department = null;
  if (content) {
    try {
      // Try to extract JSON from the response
      const jsonStringMatch = content.match(/{.*}/s);
      if (jsonStringMatch) {
        const parsed = JSON.parse(jsonStringMatch[0].replace(/'/g, '"'));
        ({ department } = parsed);
      }
    } catch (err) {
      console.log('Failed to parse JSON from Novita API response:', err);
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

/**
 * POST /ai/novita/classify
 * Text classification using Novita AI LLM
 */
exports.postNovitaClassify = async (req, res) => {
  const novitaApiKey = process.env.NOVITA_API_KEY;
  const novitaModel = process.env.NOVITA_MODEL;
  const inputText = (req.body.inputText || '').slice(0, 300);
  let result = null;
  let error = null;

  if (!novitaApiKey) {
    error = 'Novita API key is not set in environment variables.';
  } else if (!novitaModel) {
    error = 'Novita model is not set in environment variables.';
  } else if (!inputText.trim()) {
    error = 'Please enter the customer message to classify.';
  } else {
    try {
      const systemPrompt = messageClassifierSystemPrompt;
      const apiRequestBody = createClassifierLLMRequestBody(inputText, novitaModel, systemPrompt);
      const data = await callNovitaApi(apiRequestBody, novitaApiKey);
      const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      const department = extractClassifierResponse(content);
      result = {
        department,
        raw: content,
        systemPrompt,
      };
    } catch (err) {
      console.log('Novita LLM Classifier API Error:', err);
      error = 'Failed to call Novita API.';
    }
  }

  res.render('ai/novita', {
    title: 'Novita AI LLM',
    result,
    error,
    input: inputText,
    llmModel: novitaModel,
  });
};

/**
 * POST /ai/novita/chat
 * Simple chat completion using Novita AI LLM
 */
exports.postNovitaChat = async (req, res) => {
  const novitaApiKey = process.env.NOVITA_API_KEY;
  const novitaModel = process.env.NOVITA_MODEL;
  const { message } = req.body;

  if (!novitaApiKey) {
    return res.status(500).json({ error: 'Novita API key is not set' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiRequestBody = {
      model: novitaModel,
      messages: [
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 1024,
    };

    const data = await callNovitaApi(apiRequestBody, novitaApiKey);
    const content = data.choices?.[0]?.message?.content || 'No response from model';

    res.json({ response: content, model: novitaModel });
  } catch (error) {
    console.error('Novita Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response from Novita AI' });
  }
};