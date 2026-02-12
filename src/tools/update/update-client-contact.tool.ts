import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateClientContactTool = CreateSodiumTool(
  "update-client-contact",
  "Update an existing contact for a client in SodiumHQ. Only provided fields will be updated.",
  {
    clientCode: z.string().describe("The client code (required)"),
    contactCode: z.string().describe("The contact code to update (required)"),
    firstName: z.string().optional().describe("New first name"),
    lastName: z.string().optional().describe("New last name"),
    email: z.string().email().optional().describe("New email address"),
    phone: z.string().optional().describe("New phone number"),
    type: z.string().optional().describe("New contact type"),
    isPrimary: z.boolean().optional().describe("Whether this is the primary contact"),
  },
  async ({ clientCode, contactCode, firstName, lastName, email, phone, type, isPrimary }) => {
    try {
      const client = getSodiumClient();
      const contact = await client.updateClientContact(clientCode, contactCode, {
        firstName,
        lastName,
        email,
        phone,
        type,
        isPrimary,
      });

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed";
      const lines = [
        `Contact updated successfully!`,
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
        content: [{ type: "text" as const, text: `Error updating contact: ${err.message}` }],
      };
    }
  }
);

export default UpdateClientContactTool;
