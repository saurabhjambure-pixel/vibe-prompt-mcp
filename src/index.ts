import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { optimizePrompt } from "./tools/optimize.js";
import { scorePrompt } from "./tools/score.js";

const server = new McpServer({ name: "vibe-prompt-mcp", version: "1.0.0" });

server.tool("optimize_prompt",
  { raw_prompt: z.string(), mode: z.enum(["compact", "verbose"]).default("compact") },
  async ({ raw_prompt, mode }) => ({
    content: [{ type: "text", text: optimizePrompt(raw_prompt, mode).content }]
  })
);

server.tool("score_prompt",
  { raw_prompt: z.string() },
  async ({ raw_prompt }) => ({
    content: [{ type: "text", text: JSON.stringify(scorePrompt(raw_prompt), null, 2) }]
  })
);

server.prompt("vibe-optimize",
  { raw_prompt: z.string() },
  ({ raw_prompt }) => ({
    messages: [{ role: "user", content: { type: "text", text: optimizePrompt(raw_prompt, "verbose").content } }]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
