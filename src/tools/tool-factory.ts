import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTools } from "./list/index.js";
import { GetTools } from "./get/index.js";
import { CreateTools } from "./create/index.js";
import { UpdateTools } from "./update/index.js";
import { DeleteTools } from "./delete/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyToolFactory = () => { name: string; description: string; schema: any; handler: any };

export function ToolFactory(server: McpServer): void {
  const allTools: AnyToolFactory[] = [
    ...ListTools,
    ...GetTools,
    ...CreateTools,
    ...UpdateTools,
    ...DeleteTools,
  ];

  for (const toolFactory of allTools) {
    const tool = toolFactory();
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
  }
}
