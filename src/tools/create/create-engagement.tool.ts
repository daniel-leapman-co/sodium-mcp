import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateEngagementTool = CreateSodiumTool(
  "create-engagement",
  "Create a new engagement (proposal/letter of engagement) for a client in SodiumHQ. IMPORTANT: the client must have at least one contact assigned before document generation will work — Sodium will fail to render the proposal PDF with 'No contacts found' if none exist. Use list-client-contacts to verify, and create-client-contact if needed, before calling this tool. Returns the created engagement's code and details.",
  {
    clientCode: z.string().describe("The client code to create the engagement for (required)"),
    date: z.string().describe("Engagement date in YYYY-MM-DD format (required)"),
    type: z
      .enum(["ProposalAndEngagementLetter", "EngagementLetter"])
      .describe("Engagement type (required)"),
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
      .describe("List of ClientBillableService codes to include in this engagement"),
  },
  async ({
    clientCode,
    date,
    type,
    recipientFirstName,
    recipientLastName,
    recipientEmail,
    proposalTemplateCode,
    lofETemplateCode,
    clientBillableServiceCodes,
  }) => {
    try {
      const sodiumClient = getSodiumClient();
      const engagement = await sodiumClient.createEngagement({
        clientCode,
        date,
        type,
        recipientFirstName,
        recipientLastName,
        recipientEmail,
        proposalTemplateCode,
        lofETemplateCode,
        clientBillableServiceCodes,
      });

      const lines = [
        `Engagement created successfully!`,
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
      if (engagement.link) lines.push(`Link: ${engagement.link}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error creating engagement: ${err.message}` }],
      };
    }
  }
);

export default CreateEngagementTool;
