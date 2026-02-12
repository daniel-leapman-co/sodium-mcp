import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const DeleteTaskTool = CreateSodiumTool(
  "delete-task",
  "Delete a task from SodiumHQ. This action cannot be undone.",
  {
    code: z.string().describe("The task code to delete (required)"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      await client.deleteTask(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Task ${code} deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error deleting task: ${err.message}` }],
      };
    }
  }
);

export default DeleteTaskTool;
