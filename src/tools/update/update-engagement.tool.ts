import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateEngagementTool = CreateSodiumTool(
  "update-engagement",
  "Update an existing engagement in SodiumHQ. clientCode and date are required; all other fields are optional. NOTE: updating clientBillableServiceCodes replaces ALL existing service snapshots.",
  {
    code: z.string().describe("The engagement code to update (required)"),
    clientCode: z.string().describe("Client code this engagement belongs to (required)"),
    date: z.string().describe("Engagement date in YYYY-MM-DD format (required)"),
    status: z
      .enum(["Unsent", "Sent", "Viewed", "Accepted", "Rejected"])
      .optional()
      .describe("Engagement status"),
    type: z
      .enum(["ProposalAndEngagementLetter", "EngagementLetter"])
      .optional()
      .describe("Engagement type"),
    manuallyAccepted: z
      .boolean()
      .optional()
      .describe("Mark as manually accepted (true) instead of requiring online acceptance"),
    recipientFirstName: z.string().optional().describe("Recipient's first name"),
    recipientLastName: z.string().optional().describe("Recipient's last name"),
    recipientEmail: z.string().optional().describe("Recipient's email address"),
    proposalTemplateCode: z.string().optional().describe("Template code for the proposal document"),
    lofETemplateCode: z
      .string()
      .optional()
      .describe("Template code for the letter of engagement document"),
    clientBillableServiceCodes: z
      .array(z.string())
      .optional()
      .describe(
        "List of ClientBillableService codes to include. WARNING: replaces ALL existing service snapshots."
      ),
  },
  async ({
    code,
    clientCode,
    date,
    status,
    type,
    manuallyAccepted,
    recipientFirstName,
    recipientLastName,
    recipientEmail,
    proposalTemplateCode,
    lofETemplateCode,
    clientBillableServiceCodes,
  }) => {
    try {
      const sodiumClient = getSodiumClient();
      const engagement = await sodiumClient.updateEngagement(code, {
        clientCode,
        date,
        status,
        type,
        manuallyAccepted,
        recipientFirstName,
        recipientLastName,
        recipientEmail,
        proposalTemplateCode,
        lofETemplateCode,
        clientBillableServiceCodes,
      });

      const lines = [
        `Engagement updated successfully!`,
        ``,
        `Code: ${engagement.code}`,
      ];
      if (engagement.client) {
        lines.push(`Client: ${engagement.client.name} (${engagement.client.code})`);
      }
      if (engagement.status) lines.push(`Status: ${engagement.status}`);
      if (engagement.type) lines.push(`Type: ${engagement.typeName ?? engagement.type}`);
      if (engagement.date) lines.push(`Date: ${engagement.date}`);
      const recipientName = [engagement.recipientFirstName, engagement.recipientLastName]
        .filter(Boolean)
        .join(" ");
      if (recipientName) lines.push(`Recipient: ${recipientName}`);
      if (engagement.recipientEmail) lines.push(`Email: ${engagement.recipientEmail}`);
      if (engagement.numberOfServices !== undefined) {
        lines.push(`Services: ${engagement.numberOfServices}`);
      }
      if (engagement.annualValue !== undefined) {
        lines.push(`Annual Value: £${engagement.annualValue.toFixed(2)}`);
      }
      if (engagement.acceptance?.acceptedDate) {
        lines.push(`Accepted: ${engagement.acceptance.acceptedDate}`);
      }
      if (engagement.link) lines.push(`Link: ${engagement.link}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error updating engagement: ${err.message}` }],
      };
    }
  }
);

export default UpdateEngagementTool;
