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
  if (svc.status) lines.push(`Status: ${svc.status}`);
  return lines.join("\n");
}

const CreateClientServiceTool = CreateSodiumTool(
  "create-client-service",
  "Assign a billable service to a client. Use list-services to find the billableServiceCode. The service code returned can then be used as a clientBillableServiceCode when creating an engagement.",
  {
    clientCode: z.string().describe("The client to assign the service to (required)"),
    billableServiceCode: z
      .string()
      .describe("The billable service code from the tenant catalog (required) — use list-services to find this"),
    billingFrequency: z
      .enum(["OneOff", "Annual", "Quarterly", "Monthly"])
      .describe("How often the service is billed (required)"),
    startDate: z
      .string()
      .describe("Service start date in YYYY-MM-DD format (required)"),
    status: z
      .enum(["Active", "Inactive", "Paused", "Proposed"])
      .describe("Service status (required) — use Proposed if creating ahead of engagement acceptance"),
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
      .describe("Percentage adjustment to the base price (only when not overriding; e.g. 10 for +10%)"),
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
      .describe(
        "Answers to the service's pricing factor questions as key-value pairs (e.g. {\"Payroll frequency\": \"Monthly\"}). Use get-service to see available questions and options."
      ),
  },
  async ({
    clientCode,
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
      const svc = await client.createClientService(clientCode, {
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
            text: [
              `Service assigned to client ${clientCode} successfully!`,
              ``,
              formatClientService(svc),
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
            text: `Error creating client service: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default CreateClientServiceTool;
