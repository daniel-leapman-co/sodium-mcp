import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const GetProposalPdfTool = CreateSodiumTool(
  "get-proposal-pdf",
  "Download the proposal PDF for an engagement. Returns the PDF as a base64-encoded string. Use the hasProposalPdf field from get-engagement to check if one exists before calling this.",
  {
    code: z.string().describe("The engagement code to download the proposal PDF for (required)"),
  },
  async ({ code }) => {
    try {
      const sodiumClient = getSodiumClient();
      const base64Pdf = await sodiumClient.downloadEngagementProposalPdf(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Proposal PDF for engagement ${code} (base64-encoded):\n\n${base64Pdf}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error downloading proposal PDF: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default GetProposalPdfTool;
