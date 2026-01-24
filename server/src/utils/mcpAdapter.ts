import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  handler: (input: Record<string, unknown>) => Promise<any>;
};

export type ToolRegistrar = {
  registerTool: (tool: ToolDefinition) => void;
};

// Adapter to map our existing registerTool signature onto the MCP server API.
export function createMcpToolRegistrar(server: McpServer): ToolRegistrar {
  return {
    registerTool: (tool) => {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema as any,
          outputSchema: tool.outputSchema as any
        },
        async (args: Record<string, unknown> = {}) => tool.handler(args)
      );
    }
  };
}
