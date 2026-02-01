const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, ToolMessage } = require('@langchain/core/messages');
const { createAgent, tool, createMiddleware } = require('langchain');
const { MemorySaver } = require('@langchain/langgraph');
const z = require('zod');

/**
 * Observability Middleware - The v1 way to add detailed status updates
 * This middleware intercepts agent execution at key points and emits
 * status updates via the stream writer for real-time UI feedback.
 */
const observabilityMiddleware = createMiddleware({
  name: 'ObservabilityMiddleware',

  // Called before each model (LLM) invocation
  beforeModel: (state, runtime) => {
    const messageCount = state.messages?.length || 0;
    runtime.writer?.({
      type: 'status',
      emoji: '[LLM]',
      stage: 'before_model',
      message: messageCount > 1 ? 'Model analyzing conversation...' : 'Model analyzing your request...',
      details: { messageCount },
    });
    return undefined; // Don't modify state
  },

  // Called after each model response
  afterModel: (state, runtime) => {
    const lastMessage = state.messages?.[state.messages.length - 1];
    const hasToolCalls = lastMessage?.tool_calls?.length > 0;

    runtime.writer?.({
      type: 'status',
      emoji: hasToolCalls ? '[TOOL]' : '[LLM]',
      stage: 'after_model',
      message: hasToolCalls ? `Model requesting ${lastMessage.tool_calls.length} tool(s)...` : 'Response ready',
      details: {
        hasToolCalls,
        toolNames: hasToolCalls ? lastMessage.tool_calls.map((tc) => tc.name) : [],
      },
    });
    return undefined;
  },

  // Wraps each tool call for detailed tracking
  wrapToolCall: async (request, handler) => {
    const toolName = request.toolCall?.name || 'unknown';
    const toolArgs = request.toolCall?.args || {};

    // Emit "starting tool" status
    request.runtime.writer?.({
      type: 'status',
      emoji: '[TOOL:START]',
      stage: 'tool_start',
      message: `Executing tool: ${toolName}`,
      details: { toolName, args: toolArgs },
    });

    const startTime = Date.now();

    try {
      const result = await handler(request);
      const duration = Date.now() - startTime;

      // Parse result to determine success/failure
      let success = true;
      let resultSummary = 'completed';
      try {
        const parsed = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
        if (parsed.success === false) {
          success = false;
          resultSummary = parsed.reason || parsed.message || 'failed';
        } else if (parsed.success === true) {
          resultSummary = 'success';
        }
      } catch {
        // Not JSON, that's okay
      }

      request.runtime.writer?.({
        type: 'status',
        emoji: success ? '[TOOL]' : '[WARN]',
        stage: 'tool_end',
        message: `Tool ${toolName}: ${resultSummary}`,
        details: { toolName, duration, success },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      request.runtime.writer?.({
        type: 'status',
        emoji: '[ERROR]',
        stage: 'tool_error',
        message: `Tool ${toolName} failed: ${error.message}`,
        details: { toolName, duration, error: error.message },
      });

      // Return error as ToolMessage so agent can retry or handle gracefully
      return new ToolMessage({
        content: `Error: ${error.message}. Please retry or try an alternative approach.`,
        tool_call_id: request.toolCall.id,
      });
    }
  },
});

// Create a single agent instance with memory that persists across requests
let globalAgent = null;
const globalMemory = new MemorySaver();

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
 * @param {Object} modelRequestData - The model_request chunk from stream
 * @returns {Array<string>} Array of AI messages to display
 */
function extractAIMessages(modelRequestData) {
  const messages = [];
  if (modelRequestData?.messages) {
    modelRequestData.messages.forEach((msg) => {
      const content = msg?.kwargs?.content ?? msg?.content ?? msg?.text ?? '';
      const toolCalls = msg?.kwargs?.tool_calls ?? msg?.tool_calls ?? [];
      const textOut = typeof content === 'string' ? content : JSON.stringify(content);

      // Only include messages with actual content (not tool call requests)
      if (textOut && textOut.trim() && (!toolCalls || toolCalls.length === 0)) {
        messages.push(textOut);
      }
    });
  }
  return messages;
}

/**
 * Helper: Process custom stream events (from middleware and config.writer)
 * @param {Object} data - Custom event data
 * @returns {string|null} Formatted status message or null
 */
function processCustomEvent(data) {
  if (!data || (data.type !== 'status' && data.type !== 'progress')) {
    return null;
  }
  const emoji = data.emoji || '';
  const message = data.message || '';
  let formattedMessage = emoji ? `${emoji} ${message}` : message;
  if (data.details?.toolName) {
    formattedMessage += ` [${data.details.toolName}]`;
  }
  if (data.details?.duration) {
    formattedMessage += ` (${data.details.duration}ms)`;
  }
  return formattedMessage;
}

/**
 * Helper: Process updates stream events (state changes from graph nodes)
 * @param {Object} data - Update event data
 * @returns {Object|null} Status info or null
 */
function processUpdateEvent(data) {
  // Handle model_request node (LLM invocation)
  if (data.model_request?.messages) {
    const msg = data.model_request.messages[0];
    const toolCalls = msg?.kwargs?.tool_calls ?? msg?.tool_calls;
    const content = msg?.kwargs?.content ?? msg?.content ?? msg?.text ?? '';
    if (toolCalls && toolCalls.length > 0) {
      const toolName = toolCalls[0].name;
      const args = toolCalls[0].args || {};
      let statusMsg = `[DECODE] Agent calling tool: ${toolName}`;
      if (args.orderId) statusMsg += ` (Order: ${args.orderId})`;
      return { message: statusMsg };
    }
    if (content && String(content).trim()) {
      return { message: '[LLM] Agent generating response...' };
    }
  }

  // Handle tools node (tool execution results)
  if (data.tools?.messages) {
    const msg = data.tools.messages[0];
    const toolName = msg?.name ?? msg?.kwargs?.name;
    const content = msg?.content ?? msg?.kwargs?.content ?? '';
    if (toolName) {
      let detail = '';
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      try {
        const parsed = JSON.parse(contentStr);
        if (parsed.success === false) detail = ' [DECODE:WARN] (needs attention)';
        else if (parsed.success === true) detail = ' [DECODE:SUCCESS]';
      } catch {
        if (contentStr.includes('Error:') || contentStr.includes('timeout')) {
          detail = ' [DECODE:ERROR]';
        }
      }
      return { message: `[DECODE] Tool result: ${toolName}${detail}` };
    }
  }
  // Handle human_followup node
  if (data.human_followup) {
    return { message: '[DISPATCH] Waiting for human input...' };
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
 * GET /ai/ai-agent/chat
 * Handle chat messages with the AI agent via Server-Sent Events (SSE)
 * Streams three types of events:
 *   - 'chat': AI responses to display in chat UI
 *   - 'status': Status updates for System Status panel
 *   - 'raw': Raw stream data for debugging
 */
exports.getAIAgentChat = async (req, res) => {
  const { message, sessionId } = req.query;
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
      globalAgent = await createCustomerServiceAgent();
      console.log('Agent created successfully');
    }
    const threadId = sessionId || generateSessionId();
    console.log('Thread ID:', threadId);
    // Start streaming with multiple modes (v1 best practice)
    // - 'updates': State changes from graph nodes
    // - 'custom': Custom events from middleware and tool config.writer
    const stream = await globalAgent.stream(
      { messages: [new HumanMessage(message)] },
      {
        configurable: { thread_id: threadId },
        // Higher limit to account for middleware overhead
        // Middleware adds ~2 extra steps per model invocation (beforeModel + afterModel)
        // With retries, we need: 3 model calls × 3 steps each + 2 tool calls = ~11 steps
        recursionLimit: 25,
        streamMode: ['updates', 'custom'],
      },
    );

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount += 1;
      // Parse stream mode and data
      const [streamMode, data] = Array.isArray(chunk) && chunk.length === 2 ? chunk : ['updates', chunk];
      console.log(`Chunk ${chunkCount} [${streamMode}] received`);
      // Send raw debug data
      sendSSE(res, 'raw', { content: data, streamMode });
      // Process custom events (middleware & tool progress)
      if (streamMode === 'custom') {
        const statusMsg = processCustomEvent(data);
        if (statusMsg) {
          sendSSE(res, 'status', { message: statusMsg, stage: data.stage });
          console.log('Custom status:', statusMsg);
        }
        continue;
      }
      // Process updates events (node state changes)
      if (streamMode === 'updates') {
        // Extract and send AI chat messages
        if (data.model_request) {
          const aiMessages = extractAIMessages(data.model_request);
          aiMessages.forEach((msg) => {
            sendSSE(res, 'chat', { message: msg });
            console.log('AI message:', msg.substring(0, 50));
          });
        }
        // Extract and send status updates
        const statusInfo = processUpdateEvent(data);
        if (statusInfo) {
          sendSSE(res, 'status', statusInfo);
          console.log('Status update:', statusInfo.message);
        }
      }
    }
    console.log(`Stream completed with ${chunkCount} chunks`);
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
    // Emit progress via config.writer (v1 custom streaming pattern)
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ORDER_STATUS]',
      message: `Looking up order ${orderId} in database...`,
    });

    // 20% chance of timeout
    if (Math.random() < 0.2) {
      throw new Error('API timeout - please retry');
    }

    // Simulate database lookup delay
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ORDER_STATUS]',
      message: `Found order ${orderId}, checking shipment status...`,
    });

    // Mock order data with potential partial shipments
    const isPartialShipment = Math.random() < 0.3;
    const orderStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

    const mockOrder = {
      orderId,
      status,
      items: isPartialShipment
        ? [
            { itemId: 'item1', name: 'Wireless Headphones', status: 'shipped' },
            { itemId: 'item2', name: 'Phone Case', status: 'processing' },
            { itemId: 'item3', name: 'Screen Protector', status: 'delivered' },
          ]
        : [{ itemId: 'item1', name: 'Wireless Headphones', status }],
      trackingNumber: status === 'shipped' ? `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
      estimatedDelivery: status === 'shipped' ? '2-3 business days' : null,
    };

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ORDER_STATUS]',
      message: `Order ${orderId}: ${status}${isPartialShipment ? ' (partial shipment)' : ''}`,
    });

    return JSON.stringify(mockOrder);
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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REFUND]',
      message: `Initiating refund for item ${itemId}...`,
    });

    // 15% chance of API error
    if (Math.random() < 0.15) {
      throw new Error('Refund processing API error - please retry');
    }

    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REFUND]',
      message: 'Verifying refund eligibility...',
    });

    // 10% chance of refund blocked
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'refund_blocked',
        message: 'Refund blocked - order may need to be cancelled first',
      });
    }

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REFUND]',
      message: 'Processing payment reversal...',
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const refundId = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REPLACE]',
      message: 'Checking inventory for replacement item...',
    });

    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

    // 10% chance of out-of-stock
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'out_of_stock',
        message: 'Item currently out of stock. Would you prefer a refund or different color/model?',
      });
    }

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REPLACE]',
      message: 'Creating replacement order...',
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REPLACE]',
      message: 'Scheduling shipment...',
    });

    const replacementOrderId = `RPL${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return JSON.stringify({
      success: true,
      replacementOrderId,
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:CANCEL_ORDER]',
      message: `Initiating cancellation for order ${orderId}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:CANCEL_ORDER]',
      message: 'Verifying cancellation eligibility...',
    });

    // 20% chance of "pending" status requiring verification
    if (Math.random() < 0.2) {
      return JSON.stringify({
        success: false,
        status: 'pending_verification',
        message: `Order cancellation requires additional verification. Please confirm you want to cancel order ${orderId}`,
      });
    }

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:CANCEL_ORDER]',
      message: 'Processing automatic refund...',
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:REFUND_VERIFY]',
      message: `Looking up refund ${refundId}...`,
    });

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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:RETURN]',
      message: 'Creating return authorization...',
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // 15% chance of label generation failure
    if (Math.random() < 0.15) {
      throw new Error('Return label generation failed - please retry');
    }

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:RETURN]',
      message: 'Generating shipping label...',
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const returnId = `RET${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ESCALATE]',
      message: 'Connecting to Tier 2 support system...',
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ESCALATE]',
      message: 'Finding available senior specialist...',
    });

    // Simulate high latency with progress updates
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ESCALATE]',
      message: 'Creating escalation ticket...',
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    // 10% chance of needing more info
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        status: 'needs_more_info',
        message: 'Tier 2 support needs additional details about the issue. Please provide more context.',
      });
    }

    config.writer?.({
      type: 'progress',
      emoji: '[TOOL:ESCALATE]',
      message: 'Escalation confirmed, assigning priority...',
    });

    const ticketId = `T2-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
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
 * Create the Customer Service Agent using createAgent
 */
async function createCustomerServiceAgent() {
  console.log('Creating customer service agent...');
  console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
  console.log('GROQ_MODEL:', process.env.GROQ_MODEL);

  const chatModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.1,
    timeout: 30000,
    maxRetries: 1,
  });

  const tools = [getOrderStatusTool, processRefundTool, sendReplacementTool, cancelOrderTool, verifyRefundTool, processReturnTool, tier2EscalationTool];

  // Use the new createAgent API from langchain v1
  // Include observabilityMiddleware for detailed status updates (v1 best practice)
  const agent = createAgent({
    model: chatModel,
    tools: tools,
    checkpointer: globalMemory, // Use shared memory instance
    middleware: [observabilityMiddleware], // v1 middleware for observability
    systemPrompt: `You are a helpful customer service agent for an e-commerce platform.

Your responsibilities:
1. Understand customer inquiries and provide helpful responses
2. Use the available tools to check order status, process requests, and resolve issues
3. Handle multiple issues in a single conversation
4. Retry failed operations when appropriate
5. Escalate complex issues to Tier 2 support when needed
6. Always be polite, professional, and solution-oriented

Available tools:
- get_order_status: Check order details and status
- process_refund: Process refunds for items
- send_replacement: Send replacement items
- cancel_order: Cancel entire orders
- verify_refund: Check refund status
- process_return: Process item returns
- tier2_support_escalation: Escalate complex issues

When tools fail, try them again up to 2 times before considering alternatives.
If a customer has multiple issues, handle them systematically one by one.
Always confirm successful actions and provide relevant details like tracking numbers, refund IDs, etc.`,
  });

  return agent;
}

/**
 * Utility function to generate session IDs
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Reset endpoint removed; opening the page creates a fresh sessionId
