const { ChatTogetherAI } = require('@langchain/community/chat_models/togetherai');
const { HumanMessage } = require('@langchain/core/messages');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { MemorySaver } = require('@langchain/langgraph');
const { DynamicTool } = require('@langchain/core/tools');

// Create a single agent instance with memory that persists across requests
let globalAgent = null;
const globalMemory = new MemorySaver();

/**
 * GET /ai/langgraph
 * LangGraph Agentic AI Customer Service Demo
 */
exports.getLangGraph = (req, res) => {
  res.render('ai/langgraph', {
    title: 'LangGraph Customer Service Agent',
    messages: [],
    sessionId: generateSessionId(),
  });
};

/**
 * GET /ai/langgraph/chat
 * Handle chat messages with the LangGraph agent via EventSource
 */
exports.getLangGraphChat = async (req, res) => {
  const { message, sessionId } = req.query;

  console.log('=== LangGraph Chat Request ===');
  console.log('Message:', message);
  console.log('Session ID:', sessionId);
  console.log('Request body:', req.body);

  if (!message || !message.trim()) {
    console.log('ERROR: Message is required');
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set headers first before any potential errors
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    // Use global agent instance to maintain memory across requests
    if (!globalAgent) {
      console.log('Creating customer service agent...');
      globalAgent = await createCustomerServiceAgent();
      console.log('Agent created successfully');
    } else {
      console.log('Using existing agent instance');
    }
    const agent = globalAgent;

    const config = {
      configurable: {
        thread_id: sessionId || generateSessionId(),
      },
    };
    console.log('Config:', config);

    console.log('Starting agent stream...');

    // For createReactAgent with checkpointer, just pass the new message
    // The agent automatically handles conversation history via the thread_id
    const stream = await agent.stream(
      { messages: [new HumanMessage(message)] },
      {
        ...config,
        recursionLimit: 10, // Prevent infinite loops
      },
    );
    console.log('Stream created, processing chunks...');

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount += 1;
      console.log(`Chunk ${chunkCount}:`, JSON.stringify(chunk, null, 2));

      // Send progress updates for different node types with more granular status
      if (chunk.agent) {
        let message = 'Agent is analyzing your request...';

        // Check for tool calls in agent messages
        if (chunk.agent.messages) {
          chunk.agent.messages.forEach((msg) => {
            if (msg.kwargs && msg.kwargs.tool_calls && msg.kwargs.tool_calls.length > 0) {
              const toolName = msg.kwargs.tool_calls[0].name;
              const { args } = msg.kwargs.tool_calls[0];
              message = `Agent calling tool: ${toolName}`;
              if (args && args.input) {
                message += ` (${args.input.substring(0, 50)}${args.input.length > 50 ? '...' : ''})`;
              }
            } else if (msg.kwargs && msg.kwargs.content) {
              const { content } = msg.kwargs;
              if (content.includes('assistantfinal')) {
                message = 'Agent generating final response...';
              } else if (content.includes('analysis')) {
                message = 'Agent analyzing situation...';
              } else if (content.includes('assistantcommentary')) {
                message = 'Agent processing tool results...';
              } else if (content.trim() && !content.includes('json{')) {
                message = 'Agent thinking...';
              }
            }
          });
        }

        const statusData = JSON.stringify({
          type: 'status',
          message: message,
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update:', message);
      }

      if (chunk.tools) {
        let message = 'Processing tool results...';

        // Check for specific tool results
        if (chunk.tools.messages) {
          chunk.tools.messages.forEach((msg) => {
            if (msg.kwargs && msg.kwargs.name) {
              const toolName = msg.kwargs.name;
              const status = msg.kwargs.status || 'unknown';
              const { content } = msg.kwargs;

              // Try to extract meaningful info from tool response
              let details = '';
              if (content) {
                try {
                  const parsed = JSON.parse(content);
                  if (parsed.success === false) {
                    details = ' (failed)';
                  } else if (parsed.success === true) {
                    details = ' (success)';
                  }
                } catch (error) {
                  // Not JSON, check for error messages
                  console.log(error);
                  if (content.includes('Error:') || content.includes('timeout')) {
                    details = ' (error)';
                  }
                }
              }

              message = `Tool ${toolName}: ${status}${details}`;
            }
          });
        }

        const statusData = JSON.stringify({
          type: 'status',
          message: message,
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update:', message);
      }

      // Add status for other chunk types
      if (chunk.human_followup) {
        const statusData = JSON.stringify({
          type: 'status',
          message: 'Waiting for human input...',
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update: Human followup required');
      }

      const data = JSON.stringify({
        type: 'chunk',
        content: chunk,
        timestamp: new Date().toISOString(),
      });
      res.write(`data: ${data}\n\n`);
    }

    console.log(`Stream completed with ${chunkCount} chunks`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('LangGraph Agent Error:', error);
    console.error('Error stack:', error.stack);
    const errorData = JSON.stringify({
      type: 'error',
      error: error.message,
    });
    res.write(`data: ${errorData}\n\n`);
    res.end();
  }
};

/**
 * Mocked E-commerce Tools with RNG-driven failures
 */

// Tool: Get Order Status
const getOrderStatusTool = new DynamicTool({
  name: 'get_order_status',
  description: 'Fetch status and details for an order by order ID',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The order ID to look up' },
    },
    required: ['orderId'],
  },
  func: async ({ orderId }) => {
    // 20% chance of timeout
    if (Math.random() < 0.2) {
      throw new Error('API timeout - please retry');
    }

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

    return JSON.stringify(mockOrder);
  },
});

// Tool: Process Refund
const processRefundTool = new DynamicTool({
  name: 'process_refund',
  description: 'Attempt to process a refund for a specific item',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The order ID' },
      itemId: { type: 'string', description: 'The item ID to refund' },
    },
    required: ['orderId', 'itemId'],
  },
  func: async ({ orderId, itemId }) => {
    // 15% chance of API error
    if (Math.random() < 0.15) {
      throw new Error('Refund processing API error - please retry');
    }

    // 10% chance of refund blocked
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'refund_blocked',
        message: 'Refund blocked - order may need to be cancelled first',
      });
    }

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
});

// Tool: Send Replacement
const sendReplacementTool = new DynamicTool({
  name: 'send_replacement',
  description: 'Issue a replacement for a wrong or damaged item',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The original order ID' },
      itemId: { type: 'string', description: 'The item ID to replace' },
    },
    required: ['orderId', 'itemId'],
  },
  func: async ({ orderId, itemId }) => {
    // 10% chance of out-of-stock
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        reason: 'out_of_stock',
        message: 'Item currently out of stock. Would you prefer a refund or different color/model?',
      });
    }

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
});

// Tool: Cancel Order
const cancelOrderTool = new DynamicTool({
  name: 'cancel_order',
  description: 'Cancel an entire order',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The order ID to cancel' },
    },
    required: ['orderId'],
  },
  func: async ({ orderId }) => {
    // 20% chance of "pending" status requiring verification
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
});

// Tool: Verify Refund
const verifyRefundTool = new DynamicTool({
  name: 'verify_refund',
  description: 'Check the status of a refund by refund ID',
  schema: {
    type: 'object',
    properties: {
      refundId: { type: 'string', description: 'The refund ID to verify' },
    },
    required: ['refundId'],
  },
  func: async ({ refundId }) => {
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
});

// Tool: Process Return
const processReturnTool = new DynamicTool({
  name: 'process_return',
  description: 'Log a return for a specific item',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The order ID' },
      itemId: { type: 'string', description: 'The item ID to return' },
    },
    required: ['orderId', 'itemId'],
  },
  func: async ({ orderId, itemId }) => {
    // 15% chance of label generation failure
    if (Math.random() < 0.15) {
      throw new Error('Return label generation failed - please retry');
    }

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
});

// Tool: Tier 2 Support Escalation (High Latency)
const tier2EscalationTool = new DynamicTool({
  name: 'tier2_support_escalation',
  description: 'Escalate complex issues to Tier 2 support (simulates high latency)',
  schema: {
    type: 'object',
    properties: {
      issueSummary: { type: 'string', description: 'Summary of the issue requiring escalation' },
    },
    required: ['issueSummary'],
  },
  func: async ({ issueSummary }) => {
    // Simulate high latency
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

    // 10% chance of needing more info
    if (Math.random() < 0.1) {
      return JSON.stringify({
        success: false,
        status: 'needs_more_info',
        message: 'Tier 2 support needs additional details about the issue. Please provide more context.',
      });
    }

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
});

/**
 * Create the Customer Service Agent using createReactAgent
 */
async function createCustomerServiceAgent() {
  console.log('Creating customer service agent...');
  console.log('TOGETHERAI_API_KEY exists:', !!process.env.TOGETHERAI_API_KEY);
  console.log('TOGETHERAI_MODEL:', process.env.TOGETHERAI_MODEL);

  const llm = new ChatTogetherAI({
    apiKey: process.env.TOGETHERAI_API_KEY,
    model: process.env.TOGETHERAI_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    temperature: 0.1,
    timeout: 30000,
    maxRetries: 1,
  });

  const tools = [getOrderStatusTool, processRefundTool, sendReplacementTool, cancelOrderTool, verifyRefundTool, processReturnTool, tier2EscalationTool];

  // Use the correct JavaScript/Node.js createReactAgent syntax
  const agent = createReactAgent({
    llm: llm, // Note: use 'llm' not 'model' for JavaScript version
    tools: tools,
    checkpointSaver: globalMemory, // Use shared memory instance
    systemMessage: `You are a helpful customer service agent for an e-commerce platform.

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

/**
 * POST /ai/langgraph/reset
 * Reset the conversation session
 */
exports.postLangGraphReset = (req, res) => {
  const newSessionId = generateSessionId();
  res.json({ sessionId: newSessionId });
};
