import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UploadProposalPdfTool = CreateSodiumTool(
  "upload-proposal-pdf",
  "Upload a custom proposal PDF for an engagement. The PDF must be provided as a base64-encoded string. This replaces any previously uploaded proposal PDF.",
  {
    code: z.string().describe("The engagement code to upload the proposal PDF for (required)"),
    pdfContent: z
      .string()
      .describe("Base64-encoded PDF content (required)"),
  },
  async ({ code, pdfContent }) => {
    try {
      const sodiumClient = getSodiumClient();
      await sodiumClient.uploadEngagementProposalPdf(code, pdfContent);

      return {
        content: [
          {
            type: "text" as const,
            text: `Proposal PDF uploaded successfully for engagement ${code}.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error uploading proposal PDF: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default UploadProposalPdfTool;
