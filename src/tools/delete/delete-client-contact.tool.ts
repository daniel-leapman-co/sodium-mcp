import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const DeleteClientContactTool = CreateSodiumTool(
  "delete-client-contact",
  "Delete a contact from a client in SodiumHQ. This action cannot be undone.",
  {
    clientCode: z.string().describe("The client code (required)"),
    contactCode: z.string().describe("The contact code to delete (required)"),
  },
  async ({ clientCode, contactCode }) => {
    try {
      const client = getSodiumClient();
      await client.deleteClientContact(clientCode, contactCode);

      return {
        content: [
          {
            type: "text" as const,
            text: `Contact ${contactCode} deleted from client ${clientCode} successfully.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error deleting contact: ${err.message}` }],
      };
    }
  }
);

export default DeleteClientContactTool;
