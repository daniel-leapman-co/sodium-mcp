import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ServicePackage } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatPackage(pkg: ServicePackage): string {
  const lines: string[] = [];
  lines.push(`Code: ${pkg.code}`);
  if (pkg.name) lines.push(`Name: ${pkg.name}`);
  if (pkg.description) lines.push(`Description: ${pkg.description}`);
  if (pkg.isArchived) lines.push(`Archived: Yes`);
  if (pkg.totalAnnualValue !== undefined) {
    lines.push(`Annual Value: £${pkg.totalAnnualValue.toFixed(2)}`);
  }
  if (pkg.numberOfServices !== undefined) {
    lines.push(`Services: ${pkg.numberOfServices}`);
  }

  if (pkg.items && pkg.items.length > 0) {
    lines.push(`Included Services:`);
    for (const item of pkg.items) {
      const name = item.billableServiceName ?? item.billableServiceCode ?? "?";
      const price = item.overridePricing && item.price !== undefined
        ? `£${item.price.toFixed(2)}`
        : "standard pricing";
      lines.push(`  - ${name} (${item.billingFrequency}, ${price})`);
    }
  }

  return lines.join("\n");
}

const ListServicePackagesTool = CreateSodiumTool(
  "list-service-packages",
  "List pre-configured service packages that bundle multiple billable services together. Each package includes service codes, billing frequencies, and optionally pre-answered pricing factors. Useful for quickly proposing a standard set of services to a client.",
  {
    search: z.string().optional().describe("Filter packages by name"),
    service: z
      .array(z.string())
      .optional()
      .describe("Filter to packages containing specific service code(s)"),
    sortBy: z.enum(["Name"]).optional().describe("Field to sort by"),
    sortDesc: z.boolean().optional().describe("Sort descending"),
    offset: z.number().optional().describe("Pagination offset"),
    limit: z.number().optional().describe("Max results to return (max 50)"),
  },
  async ({ search, service, sortBy, sortDesc, offset, limit }) => {
    try {
      const client = getSodiumClient();
      const packages = await client.listServicePackages({
        search,
        service,
        sortBy,
        sortDesc,
        offset,
        limit,
      });

      if (!packages || packages.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No service packages found." }],
        };
      }

      const formatted = packages.map(formatPackage).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${packages.length} package(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing service packages: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default ListServicePackagesTool;
