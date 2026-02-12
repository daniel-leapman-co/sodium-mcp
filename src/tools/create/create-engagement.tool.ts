import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateEngagementTool = CreateSodiumTool(
  "create-engagement",
  "Create a new engagement (proposal/letter of engagement) for a client in SodiumHQ. Returns the created engagement's code and details.",
  {
    clientCode: z.string().describe("The client code to create the engagement for (required)"),
  },
  async ({ clientCode }) => {
    try {
      const sodiumClient = getSodiumClient();
      const engagement = await sodiumClient.createEngagement({ clientCode });

      const lines = [
        `Engagement created successfully!`,
        ``,
        `Code: ${engagement.code}`,
      ];
      if (engagement.client) {
        lines.push(`Client: ${engagement.client.name} (${engagement.client.code})`);
      }
      if (engagement.status) lines.push(`Status: ${engagement.status}`);
      if (engagement.link) lines.push(`Link: ${engagement.link}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error creating engagement: ${err.message}` }],
      };
    }
  }
);

export default CreateEngagementTool;
