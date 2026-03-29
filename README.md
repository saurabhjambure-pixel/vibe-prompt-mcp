# vibe-prompt-mcp

[![npm version](https://img.shields.io/npm/v/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![npm downloads](https://img.shields.io/npm/dm/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![license](https://img.shields.io/npm/l/vibe-prompt-mcp)](LICENSE)

> **Every vague prompt costs you 2–3 follow-up messages.**
> This MCP fixes your prompt before it reaches the AI — so you get the right output on the first try.

`vibe-prompt-mcp` scores your prompt across 4 quality dimensions, rewrites the weak parts, and fills in what's missing. The AI gets a precise instruction. You get fewer iterations.

No API key. No account. No server to run. Works inside Claude Code, Cursor, Windsurf, Zed, and any stdio MCP client.

---

## The problem it solves

You send a prompt. The AI produces something close but not quite right. You clarify. It tries again. You say "also add loading states." Another round. "Make it responsive." One more.

**Three iterations to get what you could have specified upfront.**

`vibe-prompt-mcp` catches the gaps before the prompt is sent — vague verbs, subjective language, missing acceptance criteria, absent style stack — and fixes them automatically. The AI gets one clear instruction instead of a guessing game.

---

## See it in action

### Example 1 — vague UI prompt

**Before:**
```
can you please improve the login page, it looks bad and i want it to feel more modern
```
*Score: 76/100 — 5 issues detected*

**After `optimize_prompt`:**
```
please redesign the login page, it looks bad and i want it to use
Inter font, neutral color palette, 8px border radius, consistent
16px grid spacing. Done when: the page renders correctly on mobile
and desktop with no console errors. Use Tailwind CSS and shadcn/ui.
```
*Score: 78/100 — filler stripped, vague terms replaced, missing specs appended*

### Example 2 — feature request with missing specs

**Before:**
```
Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read functionality
```
*Score: 79/100 — 3 issues detected*

**After `optimize_prompt`:**
```
Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read
functionality. Done when: the list renders correctly on mobile and
desktop with no console errors. Use Tailwind CSS and shadcn/ui.
Include loading, error, and empty states.
```
*Score: 84/100 — acceptance criteria, style stack, and state requirements added*

Without this, you'd have built the feature — then asked about loading states, then responsive layout, then the empty state. **Three follow-ups eliminated upfront.**

---

## How it works

`vibe-prompt-mcp` runs **entirely on your machine** as a local Node.js process. It uses no AI, makes no API calls, and sends nothing to any external service.

Under the hood it's a rule engine — 18 rules across 4 dimensions — that analyzes the structure and language of your prompt, detects patterns that consistently cause poor AI output, and applies targeted fixes. Think of it as a linter for prompts.

**What this means for you:**

- **Zero AI cost for the optimization itself.** The only tokens spent are ~130 for the tool call overhead (your message + Claude routing the request + the response).
- **Net savings come from avoiding re-iterations.** Each back-and-forth cycle with the AI costs 500–1,000+ tokens. One optimized prompt that gets it right on the first try pays for itself immediately.
- **Runs offline.** No network call is made during optimization.

This is the core difference from AI-based prompt improvers — those spend tokens to save tokens. This one doesn't.

---

## Quick start

**Step 1 — Add to your AI tool** (pick your platform below)

**Step 2 — Use it**

Ask your AI in plain language:
```
optimize this prompt: [your prompt here]
```
```
score this prompt: [your prompt here]
```
```
optimize in verbose mode: [your prompt here]
```

**Step 3 — Send the result**

Copy the rewritten prompt and use it as your actual instruction.

---

## Add to your AI tool

### Claude Code

**Option A — project-level** (recommended, checked into source control and shared with your team):

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

**Option B — global** (available in every project on your machine):

```bash
claude mcp add vibe-prompt-mcp -s user -- npx -y vibe-prompt-mcp
```

Restart Claude Code, then type `/mcp` to confirm `vibe-prompt-mcp` appears with both tools listed.

### Cursor

Settings → MCP → Add new server:
- **Name**: `vibe-prompt-mcp`
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

### Lovable / Replit / Codex (HTTP)

These platforms require a deployed remote endpoint. The package ships an HTTP server:

```bash
node node_modules/vibe-prompt-mcp/dist/http.js
# Express on port 3000 (or $PORT) — MCP endpoint: POST /mcp
```

Deploy to Railway or Render and point the platform's MCP URL to `https://YOUR_HOST/mcp`.

---

## Scoring dimensions

Each dimension is worth 25 points. Total score: **0–100**.

| Dimension | What it evaluates |
|---|---|
| **Clarity** | Vague action verbs, subjective descriptors, contradictory requirements, pronoun ambiguity |
| **Specificity** | Acceptance criteria, style framework, error/loading/empty states, data shape definitions |
| **Completeness** | Scope boundaries, responsive and accessibility constraints, tech stack, context references |
| **Efficiency** | Filler language, meta-commentary, hedge phrases, duplicate context |

**Severity:**
- 🔴 Critical — high likelihood of wrong output
- ⚠ Warn — reduces quality or causes follow-up iterations
- ✦ Info — noise with no instructional value

---

## Running locally from source

```bash
git clone https://github.com/saurabhjambure-pixel/vibe-prompt-mcp
cd vibe-prompt-mcp
npm install
npm run build        # TypeScript → dist/
npm run dev          # stdio server, hot reload
npm run start:http   # HTTP server on port 3000
```

To use your local build instead of npx:

```json
{
  "mcpServers": {
    "vibe-prompt-mcp": {
      "command": "node",
      "args": ["/path/to/vibe-prompt-mcp/dist/index.js"]
    }
  }
}
```

---

## Contributing

Issues and PRs welcome. If you have a rule idea — a pattern you keep seeing that produces poor AI output — open an issue.

---

## License

MIT
