import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class SodiumMcpServer {
  private static instance: McpServer | null = null;

  private constructor() {}

  public static getServer(): McpServer {
    if (SodiumMcpServer.instance === null) {
      SodiumMcpServer.instance = new McpServer({
        name: "Sodium MCP Server",
        version: "1.0.0",
      });
    }
    return SodiumMcpServer.instance;
  }
}
