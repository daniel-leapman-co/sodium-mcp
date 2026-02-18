import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, DocumentTemplate } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatTemplate(t: DocumentTemplate): string {
  const lines: string[] = [];
  lines.push(`Code: ${t.code}`);
  if (t.name) lines.push(`Name: ${t.name}`);
  if (t.type) lines.push(`Type: ${t.type}`);
  if (t.description) lines.push(`Description: ${t.description}`);
  lines.push(`Active: ${t.isActive ? "Yes" : "No"}`);
  if (t.defaultDesignTheme?.name) {
    lines.push(`Theme: ${t.defaultDesignTheme.name} (${t.defaultDesignTheme.code})`);
  }
  return lines.join("\n");
}

const ListDocumentTemplatesTool = CreateSodiumTool(
  "list-document-templates",
  "List document templates available in the tenant. Filter by type to find proposal templates (type=Proposal) or letter of engagement templates (type=EngagementLetter). Returns codes needed for proposalTemplateCode and lofETemplateCode when creating engagements.",
  {
    type: z
      .enum(["Proposal", "EngagementLetter", "ProfessionalClearanceLetter"])
      .optional()
      .describe("Filter by template type"),
    search: z
      .string()
      .optional()
      .describe("Search across template code and name (minimum 3 characters)"),
    isActive: z
      .boolean()
      .optional()
      .describe("Filter by active status (omit to return all)"),
    sortBy: z.enum(["Name", "UpdatedDate"]).optional().describe("Field to sort by"),
    sortDesc: z.boolean().optional().describe("Sort descending"),
    offset: z.number().optional().describe("Pagination offset"),
    limit: z.number().optional().describe("Max results to return (max 50)"),
  },
  async ({ type, search, isActive, sortBy, sortDesc, offset, limit }) => {
    try {
      const client = getSodiumClient();
      const templates = await client.listDocumentTemplates({
        type,
        search,
        isActive,
        sortBy,
        sortDesc,
        offset,
        limit,
      });

      if (!templates || templates.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No document templates found." }],
        };
      }

      const formatted = templates.map(formatTemplate).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${templates.length} template(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing document templates: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default ListDocumentTemplatesTool;
