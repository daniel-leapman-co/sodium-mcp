import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateClientContactTool = CreateSodiumTool(
  "create-client-contact",
  "Create a new contact for a client in SodiumHQ. Returns the created contact's code and details.",
  {
    clientCode: z.string().describe("The client code to add the contact to (required)"),
    firstName: z.string().optional().describe("Contact's first name"),
    lastName: z.string().optional().describe("Contact's last name"),
    email: z.string().email().optional().describe("Contact's email address"),
    phone: z.string().optional().describe("Contact's phone number"),
    type: z.string().optional().describe("Contact type"),
    isPrimary: z.boolean().optional().describe("Whether this is the primary contact"),
  },
  async ({ clientCode, firstName, lastName, email, phone, type, isPrimary }) => {
    try {
      const client = getSodiumClient();
      const contact = await client.createClientContact(clientCode, {
        firstName,
        lastName,
        email,
        phone,
        type,
        isPrimary,
      });

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed";
      const lines = [
        `Contact created successfully!`,
        ``,
        `Code: ${contact.code}`,
        `Name: ${name}`,
      ];
      if (contact.email) lines.push(`Email: ${contact.email}`);
      if (contact.phone) lines.push(`Phone: ${contact.phone}`);
      if (contact.isPrimary) lines.push(`Primary: Yes`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error creating contact: ${err.message}` }],
      };
    }
  }
);

export default CreateClientContactTool;
