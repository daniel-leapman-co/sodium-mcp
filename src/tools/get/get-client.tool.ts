import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, Client } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatClient(client: Client): string {
  const lines = [
    `Name: ${client.name}`,
    `Code: ${client.code}`,
  ];
  if (client.type) lines.push(`Type: ${client.type}`);
  if (client.status) lines.push(`Status: ${client.status}`);
  if (client.manager) lines.push(`Manager: ${client.manager.name || client.manager.code}`);
  if (client.partner) lines.push(`Partner: ${client.partner.name || client.partner.code}`);
  if (client.createdDate) lines.push(`Created: ${client.createdDate}`);
  if (client.updatedDate) lines.push(`Updated: ${client.updatedDate}`);
  return lines.join("\n");
}

const GetClientTool = CreateSodiumTool(
  "get-client",
  "Get detailed information about a specific client by their code.",
  {
    code: z.string().describe("The client code to retrieve"),
  },
  async ({ code }) => {
    try {
      const sodiumClient = getSodiumClient();
      const client = await sodiumClient.getClient(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Client Details:\n\n${formatClient(client)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting client: ${err.message}` }],
      };
    }
  }
);

export default GetClientTool;
