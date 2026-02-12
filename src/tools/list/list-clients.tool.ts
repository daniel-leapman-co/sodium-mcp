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
  return lines.join("\n");
}

const ListClientsTool = CreateSodiumTool(
  "list-clients",
  "List all clients in the SodiumHQ tenant. Returns client names, codes, type, status, and assigned manager/partner.",
  {
    offset: z.number().optional().describe("Number of records to skip (for pagination)"),
    limit: z.number().optional().describe("Maximum number of results to return"),
    search: z.string().optional().describe("Search term to filter clients by name"),
  },
  async ({ offset, limit, search }) => {
    try {
      const client = getSodiumClient();
      const clients = await client.listClients({ offset, limit, search });

      if (!clients || clients.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No clients found." }],
        };
      }

      const formatted = clients.map(formatClient).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${clients.length} client(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing clients: ${err.message}` }],
      };
    }
  }
);

export default ListClientsTool;
