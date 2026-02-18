import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const GetLoePdfTool = CreateSodiumTool(
  "get-loe-pdf",
  "Download the letter of engagement (LoE) PDF for an engagement. Returns the PDF as a base64-encoded string. Use the hasLofEPdf field from get-engagement to check if one exists before calling this.",
  {
    code: z.string().describe("The engagement code to download the LoE PDF for (required)"),
  },
  async ({ code }) => {
    try {
      const sodiumClient = getSodiumClient();
      const base64Pdf = await sodiumClient.downloadEngagementLoePdf(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Letter of engagement PDF for engagement ${code} (base64-encoded):\n\n${base64Pdf}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error downloading letter of engagement PDF: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default GetLoePdfTool;
