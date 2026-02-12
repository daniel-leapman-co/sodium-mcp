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
  if (task.createdAt) lines.push(`Created: ${task.createdAt}`);
  if (task.updatedAt) lines.push(`Updated: ${task.updatedAt}`);
  return lines.join("\n");
}

const GetTaskTool = CreateSodiumTool(
  "get-task",
  "Get detailed information about a specific task by its code.",
  {
    code: z.string().describe("The task code to retrieve"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      const task = await client.getTask(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Task Details:\n\n${formatTask(task)}`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error getting task: ${err.message}` }],
      };
    }
  }
);

export default GetTaskTool;
