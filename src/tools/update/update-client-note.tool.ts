import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateClientNoteTool = CreateSodiumTool(
  "update-client-note",
  "Update an existing note for a client in SodiumHQ. Only provided fields will be updated.",
  {
    clientCode: z.string().describe("The client code (required)"),
    noteCode: z.string().describe("The note code to update (required)"),
    content: z.string().optional().describe("New note content"),
    isPinned: z.boolean().optional().describe("Whether to pin the note"),
  },
  async ({ clientCode, noteCode, content, isPinned }) => {
    try {
      const client = getSodiumClient();
      const note = await client.updateClientNote(clientCode, noteCode, { content, isPinned });

      const lines = [
        `Note updated successfully!`,
        ``,
        `Code: ${note.code}`,
        `Content: ${note.content}`,
      ];
      if (note.isPinned) lines.push(`Pinned: Yes`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error updating note: ${err.message}` }],
      };
    }
  }
);

export default UpdateClientNoteTool;
