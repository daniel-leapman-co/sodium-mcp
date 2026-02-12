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

const ListEngagementsTool = CreateSodiumTool(
  "list-engagements",
  "List all engagements (proposals/letters of engagement) in the SodiumHQ tenant. Returns details including client, status, recipient, annual value, and acceptance status.",
  {
    offset: z.number().optional().describe("Number of records to skip (for pagination)"),
    limit: z.number().optional().describe("Maximum number of results to return"),
  },
  async ({ offset, limit }) => {
    try {
      const client = getSodiumClient();
      const engagements = await client.listEngagements({ offset, limit });

      if (!engagements || engagements.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No engagements found." }],
        };
      }

      const formatted = engagements.map(formatEngagement).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${engagements.length} engagement(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing engagements: ${err.message}` }],
      };
    }
  }
);

export default ListEngagementsTool;
