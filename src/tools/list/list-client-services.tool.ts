import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ClientBillableService } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatClientService(svc: ClientBillableService): string {
  const lines: string[] = [];
  const name = svc.billableService?.name ?? svc.code ?? "?";
  lines.push(`${name} (code: ${svc.code})`);
  if (svc.billingFrequency) lines.push(`  Billing: ${svc.billingFrequency}`);
  if (svc.calculatedPrice !== undefined) {
    lines.push(`  Price: £${svc.calculatedPrice.toFixed(2)}`);
  }
  if (svc.priceAdjustmentPercentage) {
    lines.push(`  Adjustment: ${svc.priceAdjustmentPercentage}%`);
  }
  if (svc.startDate) lines.push(`  Start: ${svc.startDate}`);
  if (svc.endDate) lines.push(`  End: ${svc.endDate}`);
  if (svc.status) lines.push(`  Status: ${svc.status}`);
  if (svc.pricingAnswers && Object.keys(svc.pricingAnswers).length > 0) {
    lines.push(`  Pricing answers:`);
    for (const [q, a] of Object.entries(svc.pricingAnswers)) {
      lines.push(`    ${q}: ${a}`);
    }
  }
  return lines.join("\n");
}

const ListClientServicesTool = CreateSodiumTool(
  "list-client-services",
  "List the billable services currently assigned to a specific client. Returns the service codes (used as clientBillableServiceCodes when creating engagements), billing frequencies, calculated prices, statuses, and pricing factor answers for each service.",
  {
    clientCode: z.string().describe("The client code to list services for (required)"),
  },
  async ({ clientCode }) => {
    try {
      const client = getSodiumClient();
      const services = await client.listClientServices(clientCode);

      if (!services || services.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No services found for client ${clientCode}.`,
            },
          ],
        };
      }

      const formatted = services.map(formatClientService).join("\n\n");
      const codes = services.map((s) => s.code).filter(Boolean).join(", ");

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Client services for ${clientCode} (${services.length} service(s)):`,
              ``,
              formatted,
              ``,
              `Service codes for engagement creation: ${codes}`,
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing client services: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default ListClientServicesTool;
