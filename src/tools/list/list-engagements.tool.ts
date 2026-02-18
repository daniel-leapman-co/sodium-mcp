import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, Engagement, ProposalService } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function summariseServices(services: ProposalService[]): string {
  return services
    .map((s) => {
      const name = s.billableService?.name ?? s.code;
      const price = s.calculatedPrice !== undefined ? ` £${s.calculatedPrice.toFixed(2)}` : "";
      const freq = s.billingFrequency ? ` (${s.billingFrequency})` : "";
      return `${name}${price}${freq}`;
    })
    .join(", ");
}

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

  const recipientName = [engagement.recipientFirstName, engagement.recipientLastName]
    .filter(Boolean).join(" ");
  if (recipientName) lines.push(`Recipient: ${recipientName}`);
  if (engagement.recipientEmail) lines.push(`Email: ${engagement.recipientEmail}`);

  if (engagement.annualValue !== undefined) {
    lines.push(`Annual Value: £${engagement.annualValue.toFixed(2)}`);
  }

  if (engagement.proposalServices && engagement.proposalServices.length > 0) {
    lines.push(`Services: ${summariseServices(engagement.proposalServices)}`);
  } else if (engagement.numberOfServices !== undefined) {
    lines.push(`Services: ${engagement.numberOfServices}`);
  }

  if (engagement.proposalTemplate) {
    lines.push(`Proposal Template: ${engagement.proposalTemplate.name}`);
  }
  if (engagement.lofETemplate) {
    lines.push(`Engagement Letter: ${engagement.lofETemplate.name}`);
  }

  if (engagement.lastViewed) {
    lines.push(`Last Viewed: ${engagement.lastViewed}`);
  }
  if (engagement.acceptance?.acceptedDate) {
    lines.push(`Accepted: ${engagement.acceptance.acceptedDate}`);
  }

  if (engagement.link) {
    lines.push(`Link: ${engagement.link}`);
  }

  return lines.join("\n");
}

const ListEngagementsTool = CreateSodiumTool(
  "list-engagements",
  "List all engagements (proposals/letters of engagement) in the SodiumHQ tenant. Supports filtering by status and search term, and sorting by various fields.",
  {
    search: z
      .string()
      .optional()
      .describe("Search across engagement code, client name, and client code (minimum 3 characters)"),
    status: z
      .enum(["Unsent", "Sent", "Viewed", "Accepted", "Rejected"])
      .optional()
      .describe("Filter by engagement status"),
    sortBy: z
      .enum(["Client", "Code", "Date", "Status", "NumberOfServices", "AnnualValue"])
      .optional()
      .describe("Field to sort results by"),
    sortDesc: z.boolean().optional().describe("Sort in descending order (default: ascending)"),
    offset: z.number().optional().describe("Number of records to skip (for pagination)"),
    limit: z.number().optional().describe("Maximum number of results to return (max 50)"),
  },
  async ({ search, status, sortBy, sortDesc, offset, limit }) => {
    try {
      const client = getSodiumClient();
      const engagements = await client.listEngagements({ search, status, sortBy, sortDesc, offset, limit });

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
