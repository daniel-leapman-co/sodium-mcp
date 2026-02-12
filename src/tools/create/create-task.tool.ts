import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const CreateTaskTool = CreateSodiumTool(
  "create-task",
  "Create a new task in SodiumHQ. Returns the created task's code and details.",
  {
    name: z.string().describe("The task name (required)"),
    description: z.string().optional().describe("Task description"),
    dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD)"),
    clientCode: z.string().optional().describe("Client code to associate the task with"),
    assignedTo: z.string().optional().describe("User code to assign the task to"),
    category: z.string().optional().describe("Task category"),
  },
  async ({ name, description, dueDate, clientCode, assignedTo, category }) => {
    try {
      const client = getSodiumClient();
      const task = await client.createTask({ name, description, dueDate, clientCode, assignedTo, category });

      const lines = [
        `Task created successfully!`,
        ``,
        `Code: ${task.code}`,
        `Name: ${task.name}`,
      ];
      if (task.dueDate) lines.push(`Due: ${task.dueDate}`);
      if (task.clientCode) lines.push(`Client: ${task.clientCode}`);
      if (task.assignedTo) lines.push(`Assigned to: ${task.assignedTo}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error creating task: ${err.message}` }],
      };
    }
  }
);

export default CreateTaskTool;
