import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ServicePackage } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatPackage(pkg: ServicePackage): string {
  const lines: string[] = [];
  lines.push(`Code: ${pkg.code}`);
  if (pkg.name) lines.push(`Name: ${pkg.name}`);
  if (pkg.description) lines.push(`Description: ${pkg.description}`);
  lines.push(`Archived: ${pkg.isArchived ? "Yes" : "No"}`);
  if (pkg.totalAnnualValue !== undefined) {
    lines.push(`Total Annual Value: £${pkg.totalAnnualValue.toFixed(2)}`);
  }
  if (pkg.numberOfServices !== undefined) {
    lines.push(`Number of Services: ${pkg.numberOfServices}`);
  }

  if (pkg.items && pkg.items.length > 0) {
    lines.push(`\nIncluded Services:`);
    for (const item of pkg.items) {
      const name = item.billableServiceName ?? item.billableServiceCode ?? "?";
      lines.push(`  - ${name} (code: ${item.billableServiceCode})`);
      if (item.billingFrequency) lines.push(`    Billing: ${item.billingFrequency}`);
      if (item.overridePricing && item.price !== undefined) {
        lines.push(`    Price: £${item.price.toFixed(2)} (override)`);
      } else {
        lines.push(`    Price: Standard pricing`);
      }
      if (item.pricingAnswers && Object.keys(item.pricingAnswers).length > 0) {
        lines.push(`    Pre-answered pricing factors:`);
        for (const [q, a] of Object.entries(item.pricingAnswers)) {
          lines.push(`      ${q}: ${a}`);
        }
      }
    }
  }

  if (pkg.createdDate) lines.push(`\nCreated: ${pkg.createdDate}`);
  if (pkg.updatedDate) lines.push(`Updated: ${pkg.updatedDate}`);

  return lines.join("\n");
}

const GetServicePackageTool = CreateSodiumTool(
  "get-service-package",
  "Get full details of a service package including all included services, their billing frequencies, any pricing overrides, and pre-answered pricing factors.",
  {
    code: z.string().describe("The service package code to retrieve"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      const pkg = await client.getServicePackage(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Service Package Details:\n\n${formatPackage(pkg)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting service package: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default GetServicePackageTool;
