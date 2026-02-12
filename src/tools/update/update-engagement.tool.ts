import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateEngagementTool = CreateSodiumTool(
  "update-engagement",
  "Update an existing engagement in SodiumHQ. Only provided fields will be updated.",
  {
    code: z.string().describe("The engagement code to update (required)"),
    status: z.string().optional().describe("New engagement status"),
  },
  async ({ code, status }) => {
    try {
      const sodiumClient = getSodiumClient();
      const engagement = await sodiumClient.updateEngagement(code, { status });

      const lines = [
        `Engagement updated successfully!`,
        ``,
        `Code: ${engagement.code}`,
      ];
      if (engagement.client) {
        lines.push(`Client: ${engagement.client.name} (${engagement.client.code})`);
      }
      if (engagement.status) lines.push(`Status: ${engagement.status}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error updating engagement: ${err.message}` }],
      };
    }
  }
);

export default UpdateEngagementTool;
