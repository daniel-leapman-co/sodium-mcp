# sodium-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that connects Claude and other AI assistants to the [SodiumHQ](https://sodiumhq.com) practice management platform.

Exposes 25 tools covering full CRUD for clients, tasks, engagements, contacts, and notes.

## Requirements

- Node.js 18+
- A SodiumHQ account with an API key

## Installation

```bash
npm install
cp .env.example .env   # then fill in your credentials
npm run build
```

## Configuration

Set the following environment variables (see `.env.example`):

| Variable | Required | Description |
|---|---|---|
| `SODIUM_API_KEY` | Yes | Your SodiumHQ API key |
| `SODIUM_TENANT` | Yes | Your tenant code |
| `SODIUM_API_URL` | No | Override base URL (default: `https://api.sodiumhq.com`) |

## Usage with Claude Desktop

Add an entry to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sodium": {
      "command": "node",
      "args": ["/path/to/sodium-mcp/dist/index.js"],
      "env": {
        "SODIUM_API_KEY": "your_api_key",
        "SODIUM_TENANT": "your_tenant_code"
      }
    }
  }
}
```

Then restart Claude Desktop — the SodiumHQ tools will be available automatically.

## Available Tools

| Category | Tools |
|---|---|
| **List** | `list-clients`, `list-tasks`, `list-engagements`, `list-client-contacts`, `list-client-notes` |
| **Get** | `get-client`, `get-task`, `get-engagement`, `get-client-contact`, `get-client-note` |
| **Create** | `create-client`, `create-task`, `create-engagement`, `create-client-contact`, `create-client-note` |
| **Update** | `update-client`, `update-task`, `update-engagement`, `update-client-contact`, `update-client-note` |
| **Delete** | `delete-client`, `delete-task`, `delete-engagement`, `delete-client-contact`, `delete-client-note` |

For a detailed technical breakdown, see [HOW_IT_WORKS.md](HOW_IT_WORKS.md).

## License

MIT
