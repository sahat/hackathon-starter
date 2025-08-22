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
      emoji: '🤖',
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
      emoji: hasToolCalls ? '🔧' : '✅',
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
      emoji: '⚡',
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
        emoji: success ? '✅' : '⚠️',
        stage: 'tool_end',
        message: `Tool ${toolName}: ${resultSummary}`,
        details: { toolName, duration, success },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      request.runtime.writer?.({
        type: 'status',
        emoji: '❌',
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
 * Handle chat messages with the AI agent via EventSource
 */
exports.getAIAgentChat = async (req, res) => {
  const { message, sessionId } = req.query;

  console.log('=== AI Agent Chat Request ===');
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

    const threadId = sessionId || generateSessionId();
    console.log('Thread ID:', threadId);

    console.log('Starting agent stream...');

    // Use multiple stream modes (v1 best practice):
    // - 'updates': Get state updates after each node execution
    // - 'custom': Get custom events from middleware and config.writer in tools
    const stream = await agent.stream(
      { messages: [new HumanMessage(message)] },
      {
        configurable: { thread_id: threadId },
        recursionLimit: 10, // Prevent infinite loops
        streamMode: ['updates', 'custom'], // Multiple modes for richer status updates
      },
    );
    console.log('Stream created, processing chunks...');

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount += 1;

      // With multiple streamMode, chunks come as [mode, data] tuples
      const [streamMode, data] = Array.isArray(chunk) && chunk.length === 2 ? chunk : ['updates', chunk]; // Fallback for single mode

      console.log(`Chunk ${chunkCount} [${streamMode}]:`, JSON.stringify(data, null, 2));

      // Handle 'custom' mode events (from middleware and config.writer in tools)
      if (streamMode === 'custom') {
        // Custom events from middleware (observability) or tools (progress)
        if (data && (data.type === 'status' || data.type === 'progress')) {
          const emoji = data.emoji || '';
          const message = data.message || '';
          const stage = data.stage || '';

          // Format message with stage info if available
          let formattedMessage = emoji ? `${emoji} ${message}` : message;
          if (data.details && data.details.toolName) {
            formattedMessage += ` [${data.details.toolName}]`;
          }
          if (data.details && data.details.duration) {
            formattedMessage += ` (${data.details.duration}ms)`;
          }

          const statusData = JSON.stringify({
            type: 'status',
            message: formattedMessage,
            stage: stage,
            timestamp: new Date().toISOString(),
          });
          res.write(`data: ${statusData}\n\n`);
          console.log('Sent custom status:', formattedMessage);
        }
        continue; // Skip to next chunk for custom events
      }

      // Handle 'updates' mode (state updates from nodes)
      // Send progress updates for different node types
      // Note: createAgent uses 'model_request' node name for model outputs
      if (data.model_request) {
        let statusMessage = 'Agent is analyzing your request...';

        // Check for tool calls in model messages
        // LangChain v1 uses msg.kwargs.content and msg.kwargs.tool_calls structure
        if (data.model_request.messages) {
          data.model_request.messages.forEach((msg) => {
            // Message structure: msg.kwargs.tool_calls, msg.kwargs.content
            const toolCalls = (msg.kwargs && msg.kwargs.tool_calls) || msg.tool_calls;
            const content = (msg.kwargs && msg.kwargs.content) || msg.content || msg.text || '';

            if (toolCalls && toolCalls.length > 0) {
              const toolName = toolCalls[0].name;
              const args = toolCalls[0].args || {};
              statusMessage = `🔧 Agent calling tool: ${toolName}`;
              if (args && args.orderId) {
                statusMessage += ` (Order: ${args.orderId})`;
              } else if (args && args.input) {
                statusMessage += ` (${args.input.substring(0, 50)}${args.input.length > 50 ? '...' : ''})`;
              }
            } else if (content) {
              const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
              if (contentStr.trim() && contentStr.length > 0) {
                statusMessage = '💬 Agent generating response...';
              }
            }
          });
        }

        const statusData = JSON.stringify({
          type: 'status',
          message: statusMessage,
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update:', statusMessage);
      }

      if (data.tools) {
        let statusMessage = '⚙️ Processing tool results...';

        // Check for specific tool results
        // In LangChain v1, tool messages have .name and .content directly
        if (data.tools.messages) {
          data.tools.messages.forEach((msg) => {
            // v1 message structure: msg.name, msg.content
            // Also check msg.kwargs for backward compatibility
            const toolName = msg.name || (msg.kwargs && msg.kwargs.name);
            const content = msg.content || (msg.kwargs && msg.kwargs.content) || '';

            if (toolName) {
              // Try to extract meaningful info from tool response
              let details = '';
              const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
              if (contentStr) {
                try {
                  const parsed = JSON.parse(contentStr);
                  if (parsed.success === false) {
                    details = ' ⚠️ (needs attention)';
                  } else if (parsed.success === true) {
                    details = ' ✅';
                  }
                } catch (error) {
                  // Not JSON, check for error messages
                  console.log(error);
                  if (contentStr.includes('Error:') || contentStr.includes('timeout')) {
                    details = ' ❌ (error)';
                  }
                }
              }

              statusMessage = `📊 Tool result: ${toolName}${details}`;
            }
          });
        }

        const statusData = JSON.stringify({
          type: 'status',
          message: statusMessage,
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update:', statusMessage);
      }

      // Add status for other chunk types
      if (data.human_followup) {
        const statusData = JSON.stringify({
          type: 'status',
          message: '⏸️ Waiting for human input...',
          timestamp: new Date().toISOString(),
        });
        res.write(`data: ${statusData}\n\n`);
        console.log('Sent status update: Human followup required');
      }

      const chunkData = JSON.stringify({
        type: 'chunk',
        content: data,
        streamMode: streamMode,
        timestamp: new Date().toISOString(),
      });
      res.write(`data: ${chunkData}\n\n`);
    }

    console.log(`Stream completed with ${chunkCount} chunks`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('AI Agent Error:', error);
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
 * Using tool() function with Zod schemas for LangChain v1 createAgent
 */

// Tool: Get Order Status
const getOrderStatusTool = tool(
  async ({ orderId }, config) => {
    // Emit progress via config.writer (v1 custom streaming pattern)
    config.writer?.({
      type: 'progress',
      emoji: '📡',
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
      emoji: '📦',
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
      emoji: '✨',
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
      emoji: '💳',
      message: `Initiating refund for item ${itemId}...`,
    });

    // 15% chance of API error
    if (Math.random() < 0.15) {
      throw new Error('Refund processing API error - please retry');
    }

    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));

    config.writer?.({
      type: 'progress',
      emoji: '🔍',
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
      emoji: '💰',
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
      emoji: '📋',
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
      emoji: '📦',
      message: 'Creating replacement order...',
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    config.writer?.({
      type: 'progress',
      emoji: '🚚',
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
      emoji: '🛑',
      message: `Initiating cancellation for order ${orderId}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    config.writer?.({
      type: 'progress',
      emoji: '🔐',
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
      emoji: '💸',
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
      emoji: '🔎',
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
      emoji: '📝',
      message: 'Creating return authorization...',
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // 15% chance of label generation failure
    if (Math.random() < 0.15) {
      throw new Error('Return label generation failed - please retry');
    }

    config.writer?.({
      type: 'progress',
      emoji: '🏷️',
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
      emoji: '📞',
      message: 'Connecting to Tier 2 support system...',
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    config.writer?.({
      type: 'progress',
      emoji: '👤',
      message: 'Finding available senior specialist...',
    });

    // Simulate high latency with progress updates
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

    config.writer?.({
      type: 'progress',
      emoji: '📋',
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
      emoji: '✅',
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

/**
 * POST /ai/ai-agent/reset
 * Reset the conversation session
 */
exports.postAIAgentReset = (req, res) => {
  const newSessionId = generateSessionId();
  res.json({ sessionId: newSessionId });
};
