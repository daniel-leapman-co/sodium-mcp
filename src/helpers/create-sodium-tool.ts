import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { ZodRawShape } from "zod";

export const CreateSodiumTool = <Args extends ZodRawShape>(
  name: string,
  description: string,
  schema: Args,
  handler: ToolCallback<Args>
): (() => ToolDefinition<Args>) => {
  return () => ({
    name,
    description,
    schema,
    handler,
  });
};
