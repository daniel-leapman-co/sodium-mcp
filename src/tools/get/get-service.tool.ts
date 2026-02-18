import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, BillableService } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatService(svc: BillableService): string {
  const lines: string[] = [];
  lines.push(`Code: ${svc.code}`);
  if (svc.name) lines.push(`Name: ${svc.name}`);
  if (svc.category) lines.push(`Category: ${svc.category}`);
  if (svc.clientTypes && svc.clientTypes.length > 0) {
    lines.push(`Client Types: ${svc.clientTypes.join(", ")}`);
  }
  if (svc.description) lines.push(`Description: ${svc.description}`);
  if (svc.accountingCode) lines.push(`Accounting Code: ${svc.accountingCode}`);
  lines.push(`Archived: ${svc.isArchived ? "Yes" : "No"}`);

  if (svc.pricing && svc.pricing.length > 0) {
    lines.push(`\nPricing:`);
    for (const p of svc.pricing) {
      lines.push(`  ${p.frequency}: £${p.price?.toFixed(2) ?? "?"}`);
      if (p.revenueRangeOverrides && p.revenueRangeOverrides.length > 0) {
        for (const override of p.revenueRangeOverrides) {
          const price = override.overridePrice !== undefined
            ? `£${override.overridePrice.toFixed(2)}`
            : "no override";
          lines.push(`    Revenue range ${override.revenueRangeCode}: ${price}`);
          if (override.overrideDescription) {
            lines.push(`      Note: ${override.overrideDescription}`);
          }
        }
      }
    }
  }

  if (svc.pricingFactors && svc.pricingFactors.length > 0) {
    lines.push(`\nPricing Factor Questions:`);
    for (const factor of svc.pricingFactors) {
      lines.push(`  Q: ${factor.description}`);
      if (factor.options && factor.options.length > 0) {
        for (const opt of factor.options) {
          const sign = (opt.value ?? 0) >= 0 ? "+" : "";
          lines.push(`    - ${opt.name}: ${sign}${((opt.value ?? 0) * 100).toFixed(0)}%`);
        }
      }
    }
  }

  if (svc.createdDate) lines.push(`\nCreated: ${svc.createdDate}`);
  if (svc.updatedDate) lines.push(`Updated: ${svc.updatedDate}`);

  return lines.join("\n");
}

const GetServiceTool = CreateSodiumTool(
  "get-service",
  "Get full details of a billable service including all pricing options (by billing frequency), revenue range overrides, and pricing factor questions with their adjustment percentages.",
  {
    code: z.string().describe("The service code to retrieve"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      const service = await client.getService(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Service Details:\n\n${formatService(service)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting service: ${err.message}` }],
      };
    }
  }
);

export default GetServiceTool;
