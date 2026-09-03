import { NextRequest, NextResponse } from 'next/server';
import { MCP_TOOLS, executeMcpTool } from '@/lib/integrations/mcp-server';

export async function GET() {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: {
      serverInfo: {
        name: 'nahalabs-video-engine-mcp',
        version: '3.0.0',
        protocolVersion: '2024-11-05'
      },
      capabilities: {
        tools: {
          listChanged: true,
        }
      },
      tools: MCP_TOOLS,
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params, id = 'mcp-req-1' } = body;

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'nahalabs-video-engine-mcp',
            version: '3.0.0'
          }
        }
      });
    }

    if (method === 'tools/list' || method === 'list_tools') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS
        }
      });
    }

    if (method === 'tools/call' || method === 'call_tool') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      if (!toolName) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name in params' }
        }, { status: 400 });
      }

      try {
        const toolResult = await executeMcpTool(toolName, toolArgs);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
              }
            ],
            isError: false,
            data: toolResult
          }
        });
      } catch (toolError: any) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Tool execution error: ${toolError.message}`
              }
            ],
            isError: true
          }
        });
      }
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32700, message: `Parse error: ${err.message}` }
    }, { status: 400 });
  }
}
