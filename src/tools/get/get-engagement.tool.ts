import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, Engagement, ProposalService } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatService(svc: ProposalService): string {
  const lines: string[] = [];
  const name = svc.billableService?.name ?? svc.code;
  lines.push(`  - ${name}`);
  if (svc.billingFrequency) lines.push(`    Billing: ${svc.billingFrequency}`);
  if (svc.calculatedPrice !== undefined) {
    lines.push(`    Price: £${svc.calculatedPrice.toFixed(2)}`);
  }
  if (svc.priceAdjustmentPercentage) {
    lines.push(`    Adjustment: ${svc.priceAdjustmentPercentage}%`);
  }
  if (svc.startDate) lines.push(`    Start: ${svc.startDate}`);
  if (svc.status) lines.push(`    Status: ${svc.status}`);
  if (svc.pricingAnswers && Object.keys(svc.pricingAnswers).length > 0) {
    lines.push(`    Pricing Q&A:`);
    for (const [q, a] of Object.entries(svc.pricingAnswers)) {
      lines.push(`      ${q}: ${a}`);
    }
  }
  return lines.join("\n");
}

function formatEngagement(engagement: Engagement): string {
  const lines = [`Code: ${engagement.code}`];

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
  if (engagement.numberOfServices !== undefined) {
    lines.push(`Services: ${engagement.numberOfServices}`);
  }

  if (engagement.proposalTemplate) {
    lines.push(`Proposal Template: ${engagement.proposalTemplate.name}`);
  }
  if (engagement.lofETemplate) {
    lines.push(`Engagement Letter: ${engagement.lofETemplate.name}`);
  }

  lines.push(`Has Proposal PDF: ${engagement.hasProposalPdf ? "Yes" : "No"}`);
  lines.push(`Has LoE PDF: ${engagement.hasLofEPdf ? "Yes" : "No"}`);

  if (engagement.lastViewed) {
    lines.push(`Last Viewed: ${engagement.lastViewed}`);
  }
  if (engagement.acceptance?.acceptedDate) {
    lines.push(`Accepted: ${engagement.acceptance.acceptedDate}`);
    if (engagement.acceptance.acceptedIpAddress) {
      lines.push(`Accepted IP: ${engagement.acceptance.acceptedIpAddress}`);
    }
    if (engagement.acceptance.manuallyAccepted) {
      lines.push(`Manually Accepted: Yes`);
    }
  }

  if (engagement.proposalServices && engagement.proposalServices.length > 0) {
    lines.push(`\nServices included:`);
    for (const svc of engagement.proposalServices) {
      lines.push(formatService(svc));
    }
  }

  if (engagement.link) {
    lines.push(`\nAcceptance Link: ${engagement.link}`);
  }

  return lines.join("\n");
}

const GetEngagementTool = CreateSodiumTool(
  "get-engagement",
  "Get detailed information about a specific engagement by its code, including all services, pricing, billing frequency, and pricing Q&A answers.",
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
