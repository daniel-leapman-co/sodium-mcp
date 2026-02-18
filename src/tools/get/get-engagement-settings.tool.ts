import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, EngagementSettings } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatSettings(s: EngagementSettings): string {
  const lines: string[] = [];

  if (s.designTheme?.name) {
    lines.push(`Design Theme: ${s.designTheme.name} (${s.designTheme.code})`);
  }
  lines.push(`Show Practice Name: ${s.showPracticeName ? "Yes" : "No"}`);
  lines.push(`Attach PDFs to Email: ${s.attachPDFs ? "Yes" : "No"}`);
  lines.push(`Request DD Mandate: ${s.requestDdMandate ? "Yes" : "No"}`);
  lines.push(`Notify Client Manager on Acceptance: ${s.notifyClientManagerOnAcceptance ? "Yes" : "No"}`);
  lines.push(`Notify Partner on Acceptance: ${s.notifyPartnerOnAcceptance ? "Yes" : "No"}`);

  if (s.introContentBlock?.name) {
    lines.push(`Intro Content Block: ${s.introContentBlock.name} (${s.introContentBlock.code})`);
  }
  if (s.emailContentBlock?.name) {
    lines.push(`Email Content Block: ${s.emailContentBlock.name} (${s.emailContentBlock.code})`);
  }
  if (s.signaturePageContentBlock?.name) {
    lines.push(
      `Signature Page Block: ${s.signaturePageContentBlock.name} (${s.signaturePageContentBlock.code})`
    );
  }
  if (s.thankYouContentBlock?.name) {
    lines.push(
      `Thank You Content Block: ${s.thankYouContentBlock.name} (${s.thankYouContentBlock.code})`
    );
  }
  if (s.thankYouEmailContentBlock?.name) {
    lines.push(
      `Thank You Email Block: ${s.thankYouEmailContentBlock.name} (${s.thankYouEmailContentBlock.code})`
    );
  }
  if (s.acceptanceTask?.name) {
    lines.push(`Acceptance Task: ${s.acceptanceTask.name} (${s.acceptanceTask.code})`);
  }

  return lines.join("\n");
}

const GetEngagementSettingsTool = CreateSodiumTool(
  "get-engagement-settings",
  "Get the tenant's engagement settings including the default design theme, content blocks (intro, email, signature, thank you), acceptance task, and notification preferences.",
  {},
  async () => {
    try {
      const client = getSodiumClient();
      const settings = await client.getEngagementSettings();

      return {
        content: [
          {
            type: "text" as const,
            text: `Engagement Settings:\n\n${formatSettings(settings)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting engagement settings: ${err.message}`,
          },
        ],
      };
    }
  }
);

export default GetEngagementSettingsTool;
