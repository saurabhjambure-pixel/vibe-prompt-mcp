# vibe-prompt-mcp

[![npm version](https://img.shields.io/npm/v/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![npm downloads](https://img.shields.io/npm/dm/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![license](https://img.shields.io/npm/l/vibe-prompt-mcp)](LICENSE)

**Stop sending vague prompts. Get better AI output on the first try.**

`vibe-prompt-mcp` is an MCP server that intercepts your prompt before it hits the AI — scores it across 4 quality dimensions, strips the noise, rewrites the vague parts, and fills in what's missing. Higher score = fewer iterations = better code.

Works inside Claude Code, Cursor, Windsurf, Zed, and any stdio MCP client. No API key. No account. Just `npx`.

---

## See it in action

### Example 1 — vague UI prompt

**Before:**
```
can you please improve the login page, it looks bad and i want it to feel more modern
```

**After `optimize_prompt`:**
```
✦ Score 76 → 78

Changes:
  ✦ [E1] Stripped filler opener
  ⚠ [C1] Replaced vague verb "improve" → "redesign"
  ⚠ [C4] Replaced subjective "modern" → concrete design spec
  🔴 [S1] Appended acceptance criteria (was missing)
  ⚠ [S2] Appended style stack: Tailwind CSS + shadcn/ui

please redesign the login page, it looks bad and i want it to
use Inter font, neutral color palette, 8px border radius, consistent
16px grid spacing. Done when: the page renders correctly on mobile
and desktop with no console errors. Use Tailwind CSS and shadcn/ui.
```

### Example 2 — feature request with missing specs

**Before:**
```
Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read functionality
```

**After `optimize_prompt`:**
```
✦ Score 79 → 84

Changes:
  🔴 [S1] Appended acceptance criteria
  ⚠ [S2] Appended style stack: Tailwind CSS + shadcn/ui
  ⚠ [S3] Appended loading, error, and empty state requirements

Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read
functionality. Done when: the list renders correctly on mobile and
desktop with no console errors. Use Tailwind CSS and shadcn/ui.
Include loading, error, and empty states.
```

The AI now has explicit success criteria, a style framework, and state requirements — things that would've needed 2–3 follow-up prompts to surface otherwise.

---

## Install

```bash
npx vibe-prompt-mcp
```

No install required. Runs via npx, starts instantly, zero configuration.

---

## Tools

| Tool | What it does | Parameters |
|---|---|---|
| `optimize_prompt` | Rewrites the prompt — fixes vague terms, appends missing specs, strips filler | `raw_prompt` (string), `mode` ("compact" \| "verbose", default "compact") |
| `score_prompt` | Scores without rewriting — shows exactly what's wrong and why | `raw_prompt` (string) |

### Scoring

Each dimension is worth 25 points. Total: 0–100.

| Dimension | What gets flagged or fixed |
|---|---|
| **Clarity** | Vague verbs (`improve`, `fix`, `enhance`) → concrete replacements; subjective words (`modern`, `clean`, `professional`) → design specs; pronoun ambiguity; contradictions |
| **Specificity** | Missing acceptance criteria; no style stack; absent error/loading/empty states; undefined field types on forms/CRUD |
| **Completeness** | Scope creep (3+ actions in one prompt); missing responsive/a11y constraints; no tech stack on short prompts; orphaned references |
| **Efficiency** | Filler openers (`can you`, `please`, `I want you to`); meta-commentary (`as an AI`, `feel free to`); hedge phrases (`if possible`, `maybe`, `sort of`, `try to`) |

### On token savings

Efficiency rules strip filler and hedges that the AI ignores anyway. For short prompts, specificity rules add more tokens (appending acceptance criteria, style stacks, state requirements) than efficiency removes — so the net token count often increases. That's the right tradeoff: a longer, precise prompt consistently outperforms a shorter, vague one.

For verbose prompts packed with meta-commentary and hedges, you'll see meaningful token savings alongside the score improvement.

---

## Platform setup

### Claude Code

Add to `.mcp.json` at your project root:

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
claude mcp add vibe-prompt-mcp -s project -- npx -y vibe-prompt-mcp
```

### Cursor

Settings → MCP → Add new server:
- **Command**: `npx`
- **Args**: `-y vibe-prompt-mcp`

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

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

### Zed

Add to `.zed/settings.json`:

```json
{
  "context_servers": {
    "vibe-prompt-mcp": {
      "command": {
        "path": "npx",
        "args": ["-y", "vibe-prompt-mcp"]
      }
    }
  }
}
```

### Antigravity

Add to `~/.gemini/antigravity/mcp_config.json`:

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

### HTTP server (self-hosted)

The package includes an HTTP server for platforms that require a remote endpoint (Lovable, Replit, Codex):

```bash
node node_modules/vibe-prompt-mcp/dist/http.js
# Express on port 3000 (or $PORT) — MCP endpoint: POST /mcp
```

Deploy to Railway, Render, or any Node.js host and point the platform's MCP URL to `https://YOUR_HOST/mcp`.

---

## Development

```bash
git clone https://github.com/saurabhjambure-pixel/vibe-prompt-mcp
npm install
npm run build        # tsc → dist/
npm run dev          # stdio server with hot reload
npm run start:http   # HTTP server on port 3000 (dev)
```

### Project structure

```
src/
├── index.ts              # Stdio MCP entry point
├── http.ts               # HTTP/Express server (POST /mcp)
├── tools/
│   ├── optimize.ts       # optimize_prompt — rewrite + score delta
│   └── score.ts          # score_prompt — breakdown + issue list
└── lib/
    ├── rewriter.ts        # Orchestrates all rule passes
    ├── scorer.ts          # Penalty-based scoring (0–100)
    ├── tokenizer.ts       # Token counting via tiktoken (cl100k_base)
    ├── types.ts           # RuleResult, ScoreBreakdown, Severity, Dimension
    └── rules/
        ├── clarity.ts     # C1–C4
        ├── specificity.ts # S1–S4
        ├── completeness.ts# K1–K4
        └── efficiency.ts  # E1–E6
```

---

## License

MIT
