import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient, Task } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

function formatTask(task: Task): string {
  const lines = [
    `Name: ${task.name}`,
    `Code: ${task.code}`,
  ];
  if (task.status) lines.push(`Status: ${task.status}`);
  if (task.dueDate) lines.push(`Due: ${task.dueDate}`);
  if (task.clientCode) lines.push(`Client: ${task.clientCode}`);
  if (task.assignedTo) lines.push(`Assigned to: ${task.assignedTo}`);
  if (task.category) lines.push(`Category: ${task.category}`);
  if (task.description) lines.push(`Description: ${task.description}`);
  return lines.join("\n");
}

const ListTasksTool = CreateSodiumTool(
  "list-tasks",
  "List all tasks in the SodiumHQ tenant. Returns task names, statuses, due dates, and assignments.",
  {
    offset: z.number().optional().describe("Number of records to skip (for pagination)"),
    limit: z.number().optional().describe("Maximum number of results to return"),
    clientCode: z.string().optional().describe("Filter tasks by client code"),
  },
  async ({ offset, limit, clientCode }) => {
    try {
      const client = getSodiumClient();
      const tasks = await client.listTasks({ offset, limit, clientCode });

      if (!tasks || tasks.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No tasks found." }],
        };
      }

      const formatted = tasks.map(formatTask).join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${tasks.length} task(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error listing tasks: ${err.message}` }],
      };
    }
  }
);

export default ListTasksTool;
