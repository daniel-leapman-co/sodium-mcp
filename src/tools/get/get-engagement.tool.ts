import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, Engagement } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatEngagement(engagement: Engagement): string {
  const lines = [
    `Code: ${engagement.code}`,
  ];

  if (engagement.client) {
    lines.push(`Client: ${engagement.client.name} (${engagement.client.code})`);
  }

  if (engagement.status) lines.push(`Status: ${engagement.status}`);
  if (engagement.typeName) lines.push(`Type: ${engagement.typeName}`);
  if (engagement.date) lines.push(`Date: ${engagement.date}`);

  // Recipient info
  const recipientName = [engagement.recipientFirstName, engagement.recipientLastName]
    .filter(Boolean).join(" ");
  if (recipientName) lines.push(`Recipient: ${recipientName}`);
  if (engagement.recipientEmail) lines.push(`Email: ${engagement.recipientEmail}`);

  // Financial
  if (engagement.annualValue !== undefined) {
    lines.push(`Annual Value: £${engagement.annualValue.toFixed(2)}`);
  }
  if (engagement.numberOfServices !== undefined) {
    lines.push(`Services: ${engagement.numberOfServices}`);
  }

  // Templates
  if (engagement.proposalTemplate) {
    lines.push(`Proposal Template: ${engagement.proposalTemplate.name}`);
  }
  if (engagement.lofETemplate) {
    lines.push(`Engagement Letter: ${engagement.lofETemplate.name}`);
  }

  // Status details
  if (engagement.lastViewed) {
    lines.push(`Last Viewed: ${engagement.lastViewed}`);
  }
  if (engagement.acceptance?.acceptedDate) {
    lines.push(`Accepted: ${engagement.acceptance.acceptedDate}`);
  }

  // Link
  if (engagement.link) {
    lines.push(`Link: ${engagement.link}`);
  }

  return lines.join("\n");
}

const GetEngagementTool = CreateSodiumTool(
  "get-engagement",
  "Get detailed information about a specific engagement by its code.",
  {
    code: z.string().describe("The engagement code to retrieve"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      const engagement = await client.getEngagement(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Engagement Details:\n\n${formatEngagement(engagement)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting engagement: ${err.message}` }],
      };
    }
  }
);

export default GetEngagementTool;
