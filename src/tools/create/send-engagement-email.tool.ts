import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const SendEngagementEmailTool = CreateSodiumTool(
  "send-engagement-email",
  "Send an email for an engagement using the tenant's configured email template. This delivers the proposal/letter of engagement link to the recipient and moves the engagement status to Sent.",
  {
    code: z.string().describe("The engagement code to send the email for (required)"),
  },
  async ({ code }) => {
    try {
      const sodiumClient = getSodiumClient();
      await sodiumClient.sendEngagementEmail(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Email sent successfully for engagement ${code}.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error sending engagement email: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default SendEngagementEmailTool;
