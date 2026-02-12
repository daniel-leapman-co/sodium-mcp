import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const DeleteClientNoteTool = CreateSodiumTool(
  "delete-client-note",
  "Delete a note from a client in SodiumHQ. This action cannot be undone.",
  {
    clientCode: z.string().describe("The client code (required)"),
    noteCode: z.string().describe("The note code to delete (required)"),
  },
  async ({ clientCode, noteCode }) => {
    try {
      const client = getSodiumClient();
      await client.deleteClientNote(clientCode, noteCode);

      return {
        content: [
          {
            type: "text" as const,
            text: `Note ${noteCode} deleted from client ${clientCode} successfully.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error deleting note: ${err.message}` }],
      };
    }
  }
);

export default DeleteClientNoteTool;
