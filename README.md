# vibe-prompt-mcp

[![npm version](https://img.shields.io/npm/v/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![npm downloads](https://img.shields.io/npm/dm/vibe-prompt-mcp)](https://www.npmjs.com/package/vibe-prompt-mcp)
[![license](https://img.shields.io/npm/l/vibe-prompt-mcp)](LICENSE)

> **Every vague prompt costs you 2–3 follow-up messages.**
> This MCP fixes your prompt before it reaches the AI — so you get the right output on the first try.

`vibe-prompt-mcp` scores your prompt across 4 quality dimensions, strips the noise, rewrites the vague parts, and fills in what's missing. The AI gets a precise instruction. You get fewer iterations.

No API key. No account. No server to run. Works inside Claude Code, Cursor, Windsurf, Zed, and any stdio MCP client.

---

## The problem it solves

You type this:
```
can you please improve the login page, it looks bad and i want it to feel more modern
```

The AI produces something. It's not quite right. You clarify. It tries again. You say "also add loading states." It adds them. You say "make it responsive." Another round.

**Three iterations to get what you could've specified upfront.**

`vibe-prompt-mcp` catches this before it happens. It sees `improve` (vague), `modern` (subjective), no acceptance criteria, no style stack — and fixes all of it automatically.

---

## See it in action

### Before / After — vague UI prompt

```
INPUT
can you please improve the login page, it looks bad and i want it to feel more modern
Score: 76/100 — 5 issues found
```

```
OUTPUT (after optimize_prompt)
please redesign the login page, it looks bad and i want it to use
Inter font, neutral color palette, 8px border radius, consistent
16px grid spacing. Done when: the page renders correctly on mobile
and desktop with no console errors. Use Tailwind CSS and shadcn/ui.

Score: 78/100  ✦ E1 · C1 · C4 · S1 · S2 applied
```

What changed:
- `improve` → `redesign` (C1 — vague verb)
- `feel more modern` → `use Inter font, neutral color palette...` (C4 — subjective word)
- Acceptance criteria appended (S1 — was missing)
- Style stack appended (S2 — was missing)
- `can you please` stripped (E1 — filler)

### Before / After — feature request with missing specs

```
INPUT
Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read functionality
Score: 79/100 — 3 issues found
```

```
OUTPUT (after optimize_prompt)
Add a notifications bell icon to the navbar that shows unread count
and a dropdown list of recent notifications with mark-as-read
functionality. Done when: the list renders correctly on mobile and
desktop with no console errors. Use Tailwind CSS and shadcn/ui.
Include loading, error, and empty states.

Score: 84/100  ✦ S1 · S2 · S3 applied
```

Without this fix, the AI would've built it — then you'd have asked about loading states. Then responsive. Then the empty state. **Three follow-ups eliminated.**

---

## Quick start

**Step 1 — Add to your AI tool** (pick one below)

**Step 2 — Use it**

Ask your AI:
```
optimize this prompt: [your prompt here]
```
or
```
score this prompt: [your prompt here]
```

**Step 3 — Send the optimized version**

Copy the rewritten prompt from the output and use it as your actual instruction. Done.

---

## Add to your AI tool

### Claude Code

**Option A — project-level** (recommended, shared with your team):

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

**Option B — global** (available in every project):

```bash
claude mcp add vibe-prompt-mcp -s user -- npx -y vibe-prompt-mcp
```

Then restart Claude Code. Type `/mcp` to confirm `vibe-prompt-mcp` appears.

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

These platforms require a deployed HTTP endpoint. The package ships an Express server:

```bash
node node_modules/vibe-prompt-mcp/dist/http.js
# Starts on port 3000 (or $PORT) — endpoint: POST /mcp
```

Deploy to Railway or Render, then point the platform's MCP URL to `https://YOUR_HOST/mcp`.

---

## How to use the tools

Once installed, use natural language inside your AI tool:

| What you want | What to type |
|---|---|
| Fix a prompt before sending | `optimize this prompt: [prompt]` |
| See what's wrong without rewriting | `score this prompt: [prompt]` |
| Get full change log | `optimize in verbose mode: [prompt]` |

The tools are named `optimize_prompt` and `score_prompt` — your AI calls them automatically when you use the phrases above.

---

## How scoring works

Each of the 4 dimensions is worth 25 points. Total score: **0–100**.

| Dimension | What gets flagged or auto-fixed |
|---|---|
| **Clarity** | Vague verbs (`improve`, `fix`, `enhance`, `update`) → concrete replacements; subjective words (`modern`, `clean`, `professional`, `sleek`) → design specs; pronoun ambiguity; contradictions (`simple` vs `feature-rich`) |
| **Specificity** | Missing acceptance criteria; no style framework; absent error/loading/empty states; undefined field types on forms |
| **Completeness** | 3+ actions in one prompt (scope creep); missing responsive/a11y constraints; no tech stack on short prompts; undefined references to "existing" components |
| **Efficiency** | Filler openers (`can you please`, `I want you to`); meta-commentary (`as an AI`, `feel free to`); hedge phrases (`if possible`, `maybe`, `sort of`, `try to`) |

**Severity levels:**
- 🔴 Critical — will likely cause the AI to produce the wrong output
- ⚠ Warn — reduces output quality or causes follow-up iterations
- ✦ Info — minor noise that adds no value

---

## Running locally (no npx)

```bash
git clone https://github.com/saurabhjambure-pixel/vibe-prompt-mcp
cd vibe-prompt-mcp
npm install
npm run build        # compiles TypeScript → dist/
npm run dev          # stdio server with hot reload
npm run start:http   # HTTP server on port 3000
```

Point your MCP config at `dist/index.js` instead of using `npx`:

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

## Project structure

```
src/
├── index.ts              # Stdio MCP entry point
├── http.ts               # HTTP/Express server (POST /mcp)
├── tools/
│   ├── optimize.ts       # optimize_prompt — rewrite + score delta
│   └── score.ts          # score_prompt — breakdown + issue list
└── lib/
    ├── rewriter.ts        # Orchestrates all 18 rule passes
    ├── scorer.ts          # Penalty-based scoring engine (0–100)
    ├── tokenizer.ts       # Token counting via tiktoken (cl100k_base)
    ├── types.ts           # RuleResult, ScoreBreakdown, Severity, Dimension
    └── rules/
        ├── clarity.ts     # C1–C4
        ├── specificity.ts # S1–S4
        ├── completeness.ts# K1–K4
        └── efficiency.ts  # E1–E6
```

---

## Contributing

Issues and PRs welcome. If you have a rule idea — a pattern you keep seeing in bad prompts — open an issue describing it.

---

## License

MIT
