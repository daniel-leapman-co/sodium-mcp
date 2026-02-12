import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateClientTool = CreateSodiumTool(
  "create-client",
  "Create a new client in SodiumHQ. Returns the created client's code and details.",
  {
    name: z.string().describe("The client's name (required)"),
    type: z.string().optional().describe("The client type (e.g., PrivateLimitedCompany, SoleTrader)"),
  },
  async ({ name, type }) => {
    try {
      const sodiumClient = getSodiumClient();
      const client = await sodiumClient.createClient({ name, type });

      const lines = [
        `Client created successfully!`,
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
        content: [{ type: "text" as const, text: `Error creating client: ${err.message}` }],
      };
    }
  }
);

export default CreateClientTool;
