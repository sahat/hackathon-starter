const { ChatGroq } = require('@langchain/groq');
const { HumanMessage } = require('@langchain/core/messages');
const { createAgent, tool, toolRetryMiddleware, summarizationMiddleware } = require('langchain');
const { MemorySaver } = require('@langchain/langgraph');
const z = require('zod');

/**
 * Built-in middleware handles:
 * - toolRetryMiddleware: Automatic retry with exponential backoff for failed tools
 * - summarizationMiddleware: Condenses long conversations to stay within context limits
 *
 * Tools emit progress via config.writer for real-time UI feedback.
 */

// Create a single agent instance with memory that persists across requests
let globalAgent = null;
const globalMemory = new MemorySaver();

/**
 * Utility function to generate session IDs
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Helper: Send SSE event to client
 * @param {Object} res - Express response object
 * @param {string} eventType - Type of SSE event (chat, status, raw)
 * @param {Object} data - Data payload to send
 */
function sendSSE(res, eventType, data) {
  const payload = JSON.stringify({ type: eventType, ...data, timestamp: new Date().toISOString() });
  res.write(`data: ${payload}\n\n`);
}

/**
 * Helper: Extract AI chat messages from model_request node
 */
function extractAIMessages(data) {
  const messages = [];
  const modelData = data?.model_request?.messages || [];
  modelData.forEach((msg) => {
    const content = msg?.kwargs?.content ?? msg?.content ?? '';
    const toolCalls = msg?.kwargs?.tool_calls ?? msg?.tool_calls ?? [];
    // Only include messages with actual text content (not tool call requests)
    if (content && typeof content === 'string' && content.trim() && !toolCalls?.length) {
      messages.push(content);
    }
  });
  return messages;
}

/**
 * Helper: Extract status from graph node updates
 */
function extractStatus(data) {
  // Model requesting tools
  if (data.model_request?.messages?.[0]) {
    const msg = data.model_request.messages[0];
    const toolCalls = msg?.kwargs?.tool_calls ?? msg?.tool_calls;
    if (toolCalls?.length) {
      return { message: `Agent calling: ${toolCalls.map((t) => t.name).join(', ')}` };
    }
  }
  // Tool execution completed
  if (data.tools?.messages?.[0]) {
    const toolName = data.tools.messages[0]?.name ?? data.tools.messages[0]?.kwargs?.name;
    if (toolName) return { message: `Tool completed: ${toolName}` };
  }
  return null;
}

/**
 * GET /ai/ai-agent
 * AI Agent Customer Service Demo
 */
exports.getAIAgent = (req, res) => {
  res.render('ai/ai-agent', {
    title: 'AI Agent Customer Service',
    messages: [],
    sessionId: generateSessionId(),
  });
};

/**
 * POST /ai/ai-agent/chat
 * Handle chat messages with the AI agent via Server-Sent Events (SSE)
 * Streams three types of events:
 *   - 'chat': AI responses to display in chat UI
 *   - 'status': Status updates for System Status panel
 *   - 'raw': Raw stream data for debugging
 */
exports.postAIAgentChat = async (req, res) => {
  const { message, sessionId } = req.body;
  console.log('=== AI Agent Chat Request ===');
  console.log('Message:', message);
  console.log('Session ID:', sessionId);
  if (!message || !message.trim()) {
    console.log('ERROR: Message is required');
    return res.status(400).json({ error: 'Message is required' });
  }
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  try {
    // Initialize or reuse agent instance
    if (!globalAgent) {
      console.log('Creating customer service agent...');
      globalAgent = await createAiAgent();
      console.log('Agent created successfully');
    }
    const threadId = sessionId || generateSessionId();
    console.log('Thread ID:', threadId);
    // Stream with multiple modes: 'updates' for state changes, 'custom' for tool progress
    const stream = await globalAgent.stream(
      { messages: [new HumanMessage(message)] },
      {
        configurable: { thread_id: threadId },
        recursionLimit: 15, // Built-in middleware is more efficient
        streamMode: ['updates', 'custom'],
      },
    );

    for await (const chunk of stream) {
      const [streamMode, data] = Array.isArray(chunk) && chunk.length === 2 ? chunk : ['updates', chunk];

      // Always send raw data for debug panel
      sendSSE(res, 'raw', { content: data, streamMode });

      // Custom events = tool progress messages
      if (streamMode === 'custom' && data?.message) {
        sendSSE(res, 'status', { message: data.message });
        continue;
      }

      // Updates = graph state changes
      const aiMessages = extractAIMessages(data);
      aiMessages.forEach((msg) => sendSSE(res, 'chat', { message: msg }));

      const statusInfo = extractStatus(data);
      if (statusInfo) sendSSE(res, 'status', statusInfo);
    }
    sendSSE(res, 'done', {});
    res.end();
  } catch (error) {
    console.error('AI Agent Error:', error);
    console.error('Error stack:', error.stack);
    sendSSE(res, 'error', { error: error.message });
    res.end();
  }
};

/**
 * Mocked E-commerce Tools with RNG-driven failures
 * Using tool() function with Zod schemas for LangChain v1 createAgent
 */

// Tool: Get Order Status
const getOrderStatusTool = tool(
  async ({ orderId }, config) => {
    config.writer?.({ message: `Looking up order ${orderId}...` });

    // 20% chance of timeout (toolRetryMiddleware will handle retry)
    if (Math.random() < 0.2) {
      throw new Error('API timeout - please retry');
    }

    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

    // Mock order data with potential partial shipments
    const isPartialShipment = Math.random() < 0.3;
    const orderStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

    return JSON.stringify({
      orderId,
      status,
      items: isPartialShipment
        ? [
            { itemId: 'item1', name: 'Wireless Headphones', status: 'shipped' },
            { itemId: 'item2', name: 'Phone Case', status: 'processing' },
            { itemId: 'item3', name: 'Screen Protector', status: 'delivered' },
          ]
        : [{ itemId: 'item1', name: 'Wireless Headphones', status }],
      trackingNumber: status === 'shipped' ? `TRK${Math.random().toString(36).slice(2, 11).toUpperCase()}` : null,
      estimatedDelivery: status === 'shipped' ? '2-3 business days' : null,
    });
  },
  {
    name: 'get_order_status',
    description: 'Fetch status and details for an order by order ID',
    schema: z.object({
      orderId: z.string().describe('The order ID to look up'),
    }),
  },
);

// Tool: Process Refund
const processRefundTool = tool(
  async ({ orderId, itemId }, config) => {
    config.writer?.({ message: `Processing refund for ${itemId}...` });

    // 15% chance of API error (toolRetryMiddleware handles retry)
    if (Math.random() < 0.15) {
      throw new Error('Refund processing API error - please retry');
    }

    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));

    // 10% chance of refund blocked (business logic, not retry-able)
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'refund_blocked',
        message: 'Refund blocked - order may need to be cancelled first',
      });
    }

    const refundId = `REF${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    return JSON.stringify({
      success: true,
      refundId,
      amount: `$${(Math.random() * 200 + 20).toFixed(2)}`,
      processingTime: '3-5 business days',
      orderId,
      itemId,
    });
  },
  {
    name: 'process_refund',
    description: 'Attempt to process a refund for a specific item',
    schema: z.object({
      orderId: z.string().describe('The order ID'),
      itemId: z.string().describe('The item ID to refund'),
    }),
  },
);

// Tool: Send Replacement
const sendReplacementTool = tool(
  async ({ orderId, itemId }, config) => {
    config.writer?.({ message: `Processing replacement for ${itemId}...` });

    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

    // 10% chance of out-of-stock (business logic)
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'out_of_stock',
        message: 'Item currently out of stock. Would you prefer a refund or different color/model?',
      });
    }

    const replacementOrderId = `RPL${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    return JSON.stringify({
      success: true,
      replacementOrderId,
      trackingNumber: `TRK${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      estimatedDelivery: '2-4 business days',
      originalOrderId: orderId,
      originalItemId: itemId,
    });
  },
  {
    name: 'send_replacement',
    description: 'Issue a replacement for a wrong or damaged item',
    schema: z.object({
      orderId: z.string().describe('The original order ID'),
      itemId: z.string().describe('The item ID to replace'),
    }),
  },
);

// Tool: Cancel Order
const cancelOrderTool = tool(
  async ({ orderId }, config) => {
    config.writer?.({ message: `Cancelling order ${orderId}...` });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // 20% chance of pending verification (business logic)
    if (Math.random() < 0.2) {
      return JSON.stringify({
        success: false,
        status: 'pending_verification',
        message: `Order cancellation requires additional verification. Please confirm you want to cancel order ${orderId}`,
      });
    }

    return JSON.stringify({
      success: true,
      orderId,
      status: 'cancelled',
      refundAmount: `$${(Math.random() * 300 + 50).toFixed(2)}`,
      refundProcessingTime: '3-5 business days',
    });
  },
  {
    name: 'cancel_order',
    description: 'Cancel an entire order',
    schema: z.object({
      orderId: z.string().describe('The order ID to cancel'),
    }),
  },
);

// Tool: Verify Refund
const verifyRefundTool = tool(
  async ({ refundId }, config) => {
    config.writer?.({ message: `Checking refund ${refundId}...` });

    await new Promise((resolve) => setTimeout(resolve, 250));

    const statuses = ['completed', 'in_progress', 'failed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return JSON.stringify({
      refundId,
      status,
      amount: `$${(Math.random() * 200 + 20).toFixed(2)}`,
      processedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
      expectedDate: status === 'in_progress' ? '2-3 business days' : null,
      failureReason: status === 'failed' ? 'Payment method no longer valid' : null,
    });
  },
  {
    name: 'verify_refund',
    description: 'Check the status of a refund by refund ID',
    schema: z.object({
      refundId: z.string().describe('The refund ID to verify'),
    }),
  },
);

// Tool: Process Return
const processReturnTool = tool(
  async ({ orderId, itemId }, config) => {
    config.writer?.({ message: `Creating return for ${itemId}...` });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // 15% chance of label generation failure (toolRetryMiddleware handles retry)
    if (Math.random() < 0.15) {
      throw new Error('Return label generation failed - please retry');
    }

    const returnId = `RET${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    return JSON.stringify({
      success: true,
      returnId,
      returnLabel: `https://returns.example.com/label/${returnId}`,
      returnAddress: '123 Return Center, Warehouse City, WC 12345',
      deadline: '30 days from today',
      orderId,
      itemId,
    });
  },
  {
    name: 'process_return',
    description: 'Log a return for a specific item',
    schema: z.object({
      orderId: z.string().describe('The order ID'),
      itemId: z.string().describe('The item ID to return'),
    }),
  },
);

// Tool: Tier 2 Support Escalation (High Latency)
const tier2EscalationTool = tool(
  async ({ issueSummary }, config) => {
    config.writer?.({ message: 'Escalating to Tier 2 support...' });

    // Simulate high latency for escalation
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // 10% chance of needing more info (business logic)
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        status: 'needs_more_info',
        message: 'Tier 2 support needs additional details about the issue. Please provide more context.',
      });
    }

    const ticketId = `T2-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    return JSON.stringify({
      success: true,
      ticketId,
      status: 'escalated',
      assignedAgent: 'Senior Support Specialist',
      expectedResponse: '24-48 hours',
      priority: 'high',
      issueSummary,
    });
  },
  {
    name: 'tier2_support_escalation',
    description: 'Escalate complex issues to Tier 2 support (simulates high latency)',
    schema: z.object({
      issueSummary: z.string().describe('Summary of the issue requiring escalation'),
    }),
  },
);

/**
 * Create the Customer Service Agent using createAgent with built-in middleware
 */
async function createAiAgent() {
  const chatModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    temperature: 0.1,
    timeout: 30000,
    maxRetries: 1,
  });

  const tools = [getOrderStatusTool, processRefundTool, sendReplacementTool, cancelOrderTool, verifyRefundTool, processReturnTool, tier2EscalationTool];

  // Use LangChain v1 built-in middleware for production-ready features
  const agent = createAgent({
    model: chatModel,
    tools,
    checkpointer: globalMemory,
    middleware: [
      // Automatic retry for transient tool failures (API timeouts, etc.)
      toolRetryMiddleware({
        maxRetries: 2,
        backoffFactor: 2.0,
        initialDelayMs: 500,
      }),
      // Condense long conversations to stay within context limits
      summarizationMiddleware({
        model: chatModel,
        trigger: { tokens: 4000 },
        keep: { messages: 10 },
      }),
    ],
    systemPrompt: `You are a helpful customer service agent for an e-commerce platform.

Your responsibilities:
1. Understand customer inquiries and provide helpful responses
2. Use the available tools to check order status, process requests, and resolve issues
3. Handle multiple issues in a single conversation
4. Always be polite, professional, and solution-oriented

Available tools:
- get_order_status: Check order details and status
- process_refund: Process refunds for items
- send_replacement: Send replacement items
- cancel_order: Cancel entire orders
- verify_refund: Check refund status
- process_return: Process item returns
- tier2_support_escalation: Escalate complex issues

If a customer has multiple issues, handle them systematically one by one.
Always confirm successful actions and provide relevant details like tracking numbers, refund IDs, etc.`,
  });

  return agent;
}
