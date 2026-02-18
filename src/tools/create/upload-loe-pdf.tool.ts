import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UploadLoePdfTool = CreateSodiumTool(
  "upload-loe-pdf",
  "Upload a custom letter of engagement (LoE) PDF for an engagement. The PDF must be provided as a base64-encoded string. This replaces any previously uploaded LoE PDF.",
  {
    code: z.string().describe("The engagement code to upload the LoE PDF for (required)"),
    pdfContent: z
      .string()
      .describe("Base64-encoded PDF content (required)"),
  },
  async ({ code, pdfContent }) => {
    try {
      const sodiumClient = getSodiumClient();
      await sodiumClient.uploadEngagementLoePdf(code, pdfContent);

      return {
        content: [
          {
            type: "text" as const,
            text: `Letter of engagement PDF uploaded successfully for engagement ${code}.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error uploading letter of engagement PDF: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default UploadLoePdfTool;
