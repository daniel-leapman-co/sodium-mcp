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
  if (svc.isArchived) lines.push(`Archived: Yes`);

  if (svc.pricing && svc.pricing.length > 0) {
    const priceSummary = svc.pricing
      .map((p) => `£${p.price?.toFixed(2) ?? "?"} (${p.frequency})`)
      .join(", ");
    lines.push(`Pricing: ${priceSummary}`);
  }

  if (svc.pricingFactors && svc.pricingFactors.length > 0) {
    lines.push(`Pricing Factors: ${svc.pricingFactors.length} question(s)`);
  }

  return lines.join("\n");
}

const ListServicesTool = CreateSodiumTool(
  "list-services",
  "List the tenant's billable services catalog. Returns service codes, names, categories, applicable client types, and pricing. Use service codes as clientBillableServiceCodes when creating engagements.",
  {
    search: z
      .string()
      .optional()
      .describe("Search across service code and name (minimum 3 characters)"),
    category: z
      .enum([
        "Other",
        "CoreAccounting",
        "Tax",
        "Payroll",
        "CompanySecretarial",
        "Advisory",
        "SoftwareAndTraining",
      ])
      .optional()
      .describe("Filter by service category"),
    clientType: z
      .enum([
        "PrivateLimitedCompany",
        "PublicLimitedCompany",
        "LimitedLiabilityPartnership",
        "Partnership",
        "Individual",
        "Trust",
      ])
      .optional()
      .describe("Filter by applicable client type"),
    isArchived: z.boolean().optional().describe("Filter by archived status (default: active only)"),
    sortBy: z
      .enum(["Name", "Category", "AccountingCode"])
      .optional()
      .describe("Field to sort by"),
    sortDesc: z.boolean().optional().describe("Sort descending"),
    offset: z.number().optional().describe("Pagination offset"),
    limit: z.number().optional().describe("Max results to return (max 50)"),
  },
  async ({ search, category, clientType, isArchived, sortBy, sortDesc, offset, limit }) => {
    try {
      const client = getSodiumClient();
      const services = await client.listServices({
        search,
        category,
        clientType,
        isArchived,
        sortBy,
        sortDesc,
        offset,
        limit,
      });

      if (!services || services.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No services found." }],
        };
      }

      const formatted = services.map(formatService).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${services.length} service(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing services: ${err.message}` }],
      };
    }
  }
);

export default ListServicesTool;
