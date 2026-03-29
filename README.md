# vibe-prompt-mcp

[![npm version](https://img.shields.io/npm/v/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![license](https://img.shields.io/npm/l/vibe-prompt-mcp)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)

MCP server that scores and optimizes vibe coding prompts. It analyzes your prompts across 4 dimensions and rewrites them to be clearer, more specific, and more token-efficient — exposing two tools: `optimize_prompt` and `score_prompt`.

---

## Tools

| Tool | Description | Parameters |
|---|---|---|
| `optimize_prompt` | Rewrites a prompt for clarity and token efficiency | `raw_prompt` (string), `mode` ("compact" \| "verbose", default "compact") |
| `score_prompt` | Scores a prompt without rewriting it | `raw_prompt` (string) |

---

## Scoring Dimensions

Each dimension is scored 0–25; total score is 0–100.

| Dimension | What It Checks |
|---|---|
| **Clarity** | Vague action verbs, pronoun ambiguity, contradictory descriptors, subjective language |
| **Specificity** | Missing acceptance criteria, absent style stack, no error/loading/empty states, undefined data shapes |
| **Completeness** | Scope creep, missing constraints (mobile, a11y), no tech stack on short prompts, orphaned references |
| **Efficiency** | Filler openers, meta-commentary, hedge phrases, over-structured formatting, duplicate context |

---

## Installation & Usage

### Local / stdio (Claude Code, Cursor, Antigravity, etc.)

No install required — just run via `npx`:

```bash
npx vibe-prompt-mcp
```

Or install globally:

```bash
npm install -g vibe-prompt-mcp
vibe-prompt-mcp
```

### HTTP server (Codex, Lovable, Replit, and any HTTP-based MCP client)

```bash
npm install vibe-prompt-mcp
node node_modules/vibe-prompt-mcp/dist/http.js
# Starts Express on port 3000 (or $PORT), endpoint: POST /mcp
```

---

## Platform Configuration

### Claude Code

Create `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "vibe-prompt-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "vibe-prompt-mcp"]
    }
  }
}
```

Or via CLI:
```bash
claude mcp add vibe-prompt -s project -- npx -y vibe-prompt-mcp
```

### OpenAI Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.vibe-prompt-mcp]
url = "https://YOUR_DEPLOYED_URL/mcp"
enabled = true
```

### Lovable

Settings → Connectors → Personal connectors → New MCP server:
- **Server URL**: `https://YOUR_DEPLOYED_URL/mcp`
- **Authentication**: None

### Replit

Integrations pane → MCP Servers → Add MCP server:
- **Server URL**: `https://YOUR_DEPLOYED_URL/mcp`
- Click "Test & Save"

### Antigravity

Edit `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "vibe-prompt-mcp": {
      "command": "npx",
      "args": ["-y", "vibe-prompt-mcp"]
    }
  }
}
```

---

## Development

```bash
# Install dependencies
npm install

# Build TypeScript → dist/
npm run build

# Run stdio server with hot reload (dev mode)
npm run dev

# Run HTTP server (dev mode, port 3000)
npm run start:http
```

### Project structure

```
src/
├── index.ts          # Stdio MCP entry point
├── http.ts           # HTTP/Express MCP server (POST /mcp)
├── tools/
│   ├── optimize.ts   # optimize_prompt handler
│   └── score.ts      # score_prompt handler
└── lib/
    ├── scorer.ts      # Aggregates rule scores
    ├── rewriter.ts    # Applies rule fixes
    ├── tokenizer.ts   # Token counting (tiktoken)
    ├── types.ts       # Shared types
    └── rules/
        ├── clarity.ts
        ├── specificity.ts
        ├── completeness.ts
        └── efficiency.ts
```

---

## License

MIT
