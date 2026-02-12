import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ClientContact } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatContact(contact: ClientContact): string {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed";
  const lines = [
    `Name: ${name}`,
    `Code: ${contact.code}`,
  ];
  if (contact.email) lines.push(`Email: ${contact.email}`);
  if (contact.phone) lines.push(`Phone: ${contact.phone}`);
  if (contact.type) lines.push(`Type: ${contact.type}`);
  if (contact.isPrimary) lines.push(`Primary: Yes`);
  return lines.join("\n");
}

const ListClientContactsTool = CreateSodiumTool(
  "list-client-contacts",
  "List all contacts for a specific client. Returns contact names, email addresses, phone numbers, and types.",
  {
    clientCode: z.string().describe("The client code to list contacts for"),
  },
  async ({ clientCode }) => {
    try {
      const client = getSodiumClient();
      const contacts = await client.listClientContacts(clientCode);

      if (!contacts || contacts.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No contacts found for client ${clientCode}.` }],
        };
      }

      const formatted = contacts.map(formatContact).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${contacts.length} contact(s) for client ${clientCode}:\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing contacts: ${err.message}` }],
      };
    }
  }
);

export default ListClientContactsTool;
