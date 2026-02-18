import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, ClientBillableService } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatClientService(svc: ClientBillableService): string {
  const lines: string[] = [];
  const name = svc.billableService?.name ?? svc.code ?? "?";
  lines.push(`${name} (code: ${svc.code})`);
  if (svc.billingFrequency) lines.push(`Billing: ${svc.billingFrequency}`);
  if (svc.calculatedPrice !== undefined) lines.push(`Price: £${svc.calculatedPrice.toFixed(2)}`);
  if (svc.startDate) lines.push(`Start: ${svc.startDate}`);
  if (svc.endDate) lines.push(`End: ${svc.endDate}`);
  if (svc.status) lines.push(`Status: ${svc.status}`);
  return lines.join("\n");
}

const UpdateClientServiceTool = CreateSodiumTool(
  "update-client-service",
  "Update a billable service assigned to a client. This is a full replacement — all required fields must be provided. Commonly used to activate a service after engagement acceptance (set status to Active) or to end a service (set endDate).",
  {
    clientCode: z.string().describe("The client code (required)"),
    serviceCode: z
      .string()
      .describe("The client service code to update (required) — use list-client-services to find this"),
    billableServiceCode: z
      .string()
      .describe("The billable service code from the tenant catalog (required)"),
    billingFrequency: z
      .enum(["OneOff", "Annual", "Quarterly", "Monthly"])
      .describe("Billing frequency (required)"),
    startDate: z.string().describe("Service start date in YYYY-MM-DD format (required)"),
    status: z
      .enum(["Active", "Inactive", "Paused", "Proposed"])
      .describe("Service status (required) — set to Active after engagement acceptance"),
    overridePricing: z
      .boolean()
      .optional()
      .describe("Set true to use a custom price instead of the catalog price"),
    price: z
      .number()
      .optional()
      .describe("Custom price — required if overridePricing is true"),
    priceAdjustmentPercentage: z
      .number()
      .optional()
      .describe("Percentage adjustment to the base price (only when not overriding; e.g. -10 for 10% discount)"),
    endDate: z
      .string()
      .optional()
      .describe("Service end date in YYYY-MM-DD format (omit for ongoing)"),
    managedByUserCode: z
      .string()
      .optional()
      .describe("Code of the user responsible for this service"),
    pricingAnswers: z
      .record(z.string(), z.string())
      .optional()
      .describe("Pricing factor answers as key-value pairs"),
  },
  async ({
    clientCode,
    serviceCode,
    billableServiceCode,
    billingFrequency,
    startDate,
    status,
    overridePricing,
    price,
    priceAdjustmentPercentage,
    endDate,
    managedByUserCode,
    pricingAnswers,
  }) => {
    try {
      const client = getSodiumClient();
      const svc = await client.updateClientService(clientCode, serviceCode, {
        billableServiceCode,
        billingFrequency,
        startDate,
        status,
        overridePricing,
        price,
        priceAdjustmentPercentage,
        endDate,
        managedByUserCode,
        pricingAnswers,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: [`Client service updated successfully!`, ``, formatClientService(svc)].join("\n"),
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error updating client service: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default UpdateClientServiceTool;
