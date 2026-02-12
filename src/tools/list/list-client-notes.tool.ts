import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ClientNote } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatNote(note: ClientNote): string {
  const lines = [
    `Code: ${note.code}`,
    `Content: ${note.content}`,
  ];
  if (note.isPinned) lines.push(`Pinned: Yes`);
  if (note.createdAt) lines.push(`Created: ${note.createdAt}`);
  if (note.createdBy) lines.push(`Created by: ${note.createdBy}`);
  return lines.join("\n");
}

const ListClientNotesTool = CreateSodiumTool(
  "list-client-notes",
  "List all notes for a specific client. Returns note content, creation dates, and pinned status.",
  {
    clientCode: z.string().describe("The client code to list notes for"),
  },
  async ({ clientCode }) => {
    try {
      const client = getSodiumClient();
      const notes = await client.listClientNotes(clientCode);

      if (!notes || notes.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No notes found for client ${clientCode}.` }],
        };
      }

      const formatted = notes.map(formatNote).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${notes.length} note(s) for client ${clientCode}:\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing notes: ${err.message}` }],
      };
    }
  }
);

export default ListClientNotesTool;
