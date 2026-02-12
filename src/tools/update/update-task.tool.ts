import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const UpdateTaskTool = CreateSodiumTool(
  "update-task",
  "Update an existing task in SodiumHQ. Only provided fields will be updated.",
  {
    code: z.string().describe("The task code to update (required)"),
    name: z.string().optional().describe("New task name"),
    description: z.string().optional().describe("New task description"),
    status: z.string().optional().describe("New task status"),
    dueDate: z.string().optional().describe("New due date in ISO format (YYYY-MM-DD)"),
    assignedTo: z.string().optional().describe("New assigned user code"),
    category: z.string().optional().describe("New task category"),
  },
  async ({ code, name, description, status, dueDate, assignedTo, category }) => {
    try {
      const client = getSodiumClient();
      const task = await client.updateTask(code, { name, description, status, dueDate, assignedTo, category });

      const lines = [
        `Task updated successfully!`,
        ``,
        `Code: ${task.code}`,
        `Name: ${task.name}`,
      ];
      if (task.status) lines.push(`Status: ${task.status}`);
      if (task.dueDate) lines.push(`Due: ${task.dueDate}`);
      if (task.assignedTo) lines.push(`Assigned to: ${task.assignedTo}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error updating task: ${err.message}` }],
      };
    }
  }
);

export default UpdateTaskTool;
