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

const GetClientNoteTool = CreateSodiumTool(
  "get-client-note",
  "Get detailed information about a specific note for a client.",
  {
    clientCode: z.string().describe("The client code"),
    noteCode: z.string().describe("The note code to retrieve"),
  },
  async ({ clientCode, noteCode }) => {
    try {
      const client = getSodiumClient();
      const note = await client.getClientNote(clientCode, noteCode);

      return {
        content: [
          {
            type: "text" as const,
            text: `Note Details:\n\n${formatNote(note)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting note: ${err.message}` }],
      };
    }
  }
);

export default GetClientNoteTool;
