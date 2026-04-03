import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { optimizePrompt } from "./tools/optimize.js";
import { scorePrompt } from "./tools/score.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = new McpServer({ name: "vibe-prompt-mcp", version: "1.1.0" });

  server.tool("optimize_prompt",
    { raw_prompt: z.string(), mode: z.enum(["compact", "verbose"]).default("compact"), projectRoot: z.string().optional() },
    async ({ raw_prompt, mode, projectRoot }) => {
      const result = await optimizePrompt(raw_prompt, mode, projectRoot);
      return { content: [{ type: "text", text: result.content }] };
    }
  );

  server.tool("score_prompt",
    { raw_prompt: z.string() },
    async ({ raw_prompt }) => ({
      content: [{ type: "text", text: JSON.stringify(scorePrompt(raw_prompt), null, 2) }]
    })
  );

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`vibe-prompt-mcp running on http://localhost:${PORT}`));
