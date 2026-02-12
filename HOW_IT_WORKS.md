# How sodium-mcp Works

## Overview

`sodium-mcp` is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the SodiumHQ practice management API as callable tools for Claude and other MCP clients. It lets AI assistants list, create, update, and delete clients, tasks, engagements, contacts, and notes within a SodiumHQ tenant.

---

## Project Structure

```
src/
├── index.ts                     # Entry point — bootstraps the server
├── clients/
│   └── sodium-client.ts         # HTTP API client (singleton)
├── helpers/
│   ├── create-sodium-tool.ts    # Tool factory helper
│   ├── ensure-error.ts          # Normalizes any thrown value to an Error
│   └── format-error.ts          # Formats error messages for output
├── server/
│   └── sodium-mcp-server.ts     # MCP server singleton
├── tools/
│   ├── tool-factory.ts          # Registers all tools with the server
│   ├── list/                    # 5 list tools
│   ├── get/                     # 5 get tools
│   ├── create/                  # 5 create tools
│   ├── update/                  # 5 update tools
│   └── delete/                  # 5 delete tools
└── types/
    ├── tool-definition.ts       # ToolDefinition interface
    └── api-response.ts          # API response types
```

---

## Startup Flow

```
index.ts
  1. SodiumMcpServer.getServer()     → Creates McpServer singleton
  2. ToolFactory(server)             → Registers all 25 tools
  3. new StdioServerTransport()      → Attaches stdin/stdout transport
  4. server.connect(transport)       → Starts listening for MCP messages
```

The server communicates over **stdio** — standard in/out — which is the typical transport for local MCP servers used with Claude Desktop or the Claude API.

---

## Request / Response Flow

```
MCP Client (e.g. Claude)
    │  sends tool call + arguments
    ▼
Tool handler (Zod validates input)
    │
    ▼
SodiumClient.getInstance()
    │  HTTP request with x-api-key header
    ▼
SodiumHQ REST API  (https://api.sodiumhq.com)
    │
    ▼
Format response into human-readable text
    │
    ▼
Return { content: [{ type: "text", text: "..." }] }
```

---

## API Client (`sodium-client.ts`)

A singleton class that wraps all HTTP communication with SodiumHQ. It reads three environment variables at startup:

| Variable | Required | Purpose |
|---|---|---|
| `SODIUM_API_KEY` | Yes | Authentication token (sent as `x-api-key` header) |
| `SODIUM_TENANT` | Yes | Tenant code — scopes all API paths to `/tenants/{code}/` |
| `SODIUM_API_URL` | No | Override base URL (defaults to `https://api.sodiumhq.com`) |

It exposes methods for five entities, each with full CRUD:

- **Clients** — `listClients`, `getClient`, `createClient`, `updateClient`, `deleteClient`
- **Tasks** — `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`
- **Engagements** — `listEngagements`, `getEngagement`, `createEngagement`, `updateEngagement`, `deleteEngagement`, `sendEngagementEmail`
- **Client Contacts** — `listClientContacts`, `getClientContact`, `createClientContact`, `updateClientContact`, `deleteClientContact`
- **Client Notes** — `listClientNotes`, `getClientNote`, `createClientNote`, `updateClientNote`, `deleteClientNote`

---

## Tools (25 total)

All tools follow the same pattern: defined with `CreateSodiumTool`, validated with a [Zod](https://zod.dev/) schema, and registered by `ToolFactory`.

### List Tools
| Tool | Description |
|---|---|
| `list-clients` | List clients with optional pagination and search |
| `list-tasks` | List tasks with optional client filter |
| `list-engagements` | List engagement letters / proposals |
| `list-client-contacts` | List contacts for a specific client |
| `list-client-notes` | List notes for a specific client |

### Get Tools
| Tool | Description |
|---|---|
| `get-client` | Fetch full details for a single client |
| `get-task` | Fetch task details |
| `get-engagement` | Fetch engagement details |
| `get-client-contact` | Fetch a single contact |
| `get-client-note` | Fetch a single note |

### Create Tools
| Tool | Description |
|---|---|
| `create-client` | Create a new client (name required) |
| `create-task` | Create a task (name required) |
| `create-engagement` | Create an engagement letter (clientCode required) |
| `create-client-contact` | Add a contact to a client |
| `create-client-note` | Add a note to a client |

### Update Tools
| Tool | Description |
|---|---|
| `update-client` | Modify client fields |
| `update-task` | Modify task fields |
| `update-engagement` | Modify engagement / change status |
| `update-client-contact` | Modify contact details |
| `update-client-note` | Modify note content or pinned status |

### Delete Tools
| Tool | Description |
|---|---|
| `delete-client` | Permanently delete a client |
| `delete-task` | Delete a task |
| `delete-engagement` | Delete an engagement |
| `delete-client-contact` | Delete a contact |
| `delete-client-note` | Delete a note |

---

## Tool Implementation Pattern

Every tool is built with the `CreateSodiumTool` helper, which returns a factory function:

```typescript
const ListClientsTool = CreateSodiumTool(
  "list-clients",                          // tool name
  "List all clients in the tenant...",     // description shown to the LLM
  {                                        // Zod schema for input validation
    offset: z.number().optional(),
    limit:  z.number().optional(),
    search: z.string().optional(),
  },
  async ({ offset, limit, search }) => {   // handler
    try {
      const client = getSodiumClient();
      const clients = await client.listClients({ offset, limit, search });
      return { content: [{ type: "text", text: formatClients(clients) }] };
    } catch (error) {
      const err = ensureError(error);
      return { content: [{ type: "text", text: `Error: ${err.message}` }] };
    }
  }
);
```

`ToolFactory` collects all tool factories (list/get/create/update/delete) and registers each one with `server.tool(name, description, schema, handler)`.

---

## Key Architectural Decisions

| Decision | Reason |
|---|---|
| **Singleton for server and client** | Ensures a single MCP server and a single HTTP client instance |
| **Stdio transport** | Standard for local MCP servers; works out-of-the-box with Claude Desktop |
| **Zod validation on all inputs** | Catches bad arguments before hitting the API |
| **Tenant-scoped API paths** | All routes prefixed with `/tenants/{code}/` for multi-tenancy |
| **`ensureError` helper** | Normalises `unknown` thrown values so catch blocks always get a real `Error` |
| **Tool factory pattern** | Keeps each tool file focused on one operation; `ToolFactory` handles wiring |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template and fill in credentials
cp .env.example .env

# 3. Build TypeScript
npm run build

# 4. Start the server (communicates over stdio)
npm start
```

To use it with **Claude Desktop**, add an entry to your MCP config pointing to `node dist/index.js` with the required environment variables set.
