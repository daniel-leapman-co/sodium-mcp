import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const DeleteEngagementTool = CreateSodiumTool(
  "delete-engagement",
  "Delete an engagement from SodiumHQ. This action cannot be undone.",
  {
    code: z.string().describe("The engagement code to delete (required)"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      await client.deleteEngagement(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Engagement ${code} deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error deleting engagement: ${err.message}` }],
      };
    }
  }
);

export default DeleteEngagementTool;
