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

const GetClientContactTool = CreateSodiumTool(
  "get-client-contact",
  "Get detailed information about a specific contact for a client.",
  {
    clientCode: z.string().describe("The client code"),
    contactCode: z.string().describe("The contact code to retrieve"),
  },
  async ({ clientCode, contactCode }) => {
    try {
      const client = getSodiumClient();
      const contact = await client.getClientContact(clientCode, contactCode);

      return {
        content: [
          {
            type: "text" as const,
            text: `Contact Details:\n\n${formatContact(contact)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting contact: ${err.message}` }],
      };
    }
  }
);

export default GetClientContactTool;
