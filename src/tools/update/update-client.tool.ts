import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateClientTool = CreateSodiumTool(
  "update-client",
  "Update an existing client in SodiumHQ. Only provided fields will be updated.",
  {
    code: z.string().describe("The client code to update (required)"),
    name: z.string().optional().describe("New client name"),
    type: z.string().optional().describe("New client type"),
    status: z.string().optional().describe("New client status"),
  },
  async ({ code, name, type, status }) => {
    try {
      const sodiumClient = getSodiumClient();
      const client = await sodiumClient.updateClient(code, { name, type, status });

      const lines = [
        `Client updated successfully!`,
        ``,
        `Code: ${client.code}`,
        `Name: ${client.name}`,
      ];
      if (client.type) lines.push(`Type: ${client.type}`);
      if (client.status) lines.push(`Status: ${client.status}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error updating client: ${err.message}` }],
      };
    }
  }
);

export default UpdateClientTool;
