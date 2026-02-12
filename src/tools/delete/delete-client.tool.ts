import { z } from "zod";
import { CreateSodiumTool } from "../../helpers/create-sodium-tool.js";
import { getSodiumClient } from "../../clients/sodium-client.js";
import { ensureError } from "../../helpers/ensure-error.js";

const DeleteClientTool = CreateSodiumTool(
  "delete-client",
  "Delete a client from SodiumHQ. This action cannot be undone.",
  {
    code: z.string().describe("The client code to delete (required)"),
  },
  async ({ code }) => {
    try {
      const client = getSodiumClient();
      await client.deleteClient(code);

      return {
        content: [
          {
            type: "text" as const,
            text: `Client ${code} deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      const err = ensureError(error);
      return {
        content: [{ type: "text" as const, text: `Error deleting client: ${err.message}` }],
      };
    }
  }
);

export default DeleteClientTool;
