import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateClientNoteTool = CreateSodiumTool(
  "create-client-note",
  "Create a new note for a client in SodiumHQ. Returns the created note's code and details.",
  {
    clientCode: z.string().describe("The client code to add the note to (required)"),
    content: z.string().describe("The note content (required)"),
    isPinned: z.boolean().optional().describe("Whether to pin the note"),
  },
  async ({ clientCode, content, isPinned }) => {
    try {
      const client = getSodiumClient();
      const note = await client.createClientNote(clientCode, { content, isPinned });

      const lines = [
        `Note created successfully!`,
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
        content: [{ type: "text" as const, text: `Error creating note: ${err.message}` }],
      };
    }
  }
);

export default CreateClientNoteTool;
