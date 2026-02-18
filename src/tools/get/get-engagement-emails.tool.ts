import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, EngagementEmail } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatEmail(email: EngagementEmail, index: number): string {
  const lines = [`Email #${index + 1}`];
  if (email.sentDate) lines.push(`Sent: ${email.sentDate}`);
  if (email.subject) lines.push(`Subject: ${email.subject}`);
  if (email.toRecipients && email.toRecipients.length > 0) {
    lines.push(`To: ${email.toRecipients.join(", ")}`);
  }
  if (email.status) lines.push(`Status: ${email.status}`);
  if (email.messageId) lines.push(`Message ID: ${email.messageId}`);
  return lines.join("\n");
}

const GetEngagementEmailsTool = CreateSodiumTool(
  "get-engagement-emails",
  "Get the history of emails sent for a specific engagement, including sent dates, recipients, subjects, and delivery status.",
  {
    code: z.string().describe("The engagement code to retrieve email history for (required)"),
  },
  async ({ code }) => {
    try {
      const sodiumClient = getSodiumClient();
      const emails = await sodiumClient.getEngagementEmails(code);

      if (!emails || emails.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No emails found for engagement ${code}.`,
            },
          ],
        };
      }

      const formatted = emails.map(formatEmail).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Email history for engagement ${code} (${emails.length} email(s)):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error retrieving engagement email history: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default GetEngagementEmailsTool;
