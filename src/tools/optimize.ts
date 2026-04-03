import { rewrite } from "../lib/rewriter.js";
import { computeScore } from "../lib/scorer.js";
import { applyClarityRules } from "../lib/rules/clarity.js";
import { applySpecificityRules } from "../lib/rules/specificity.js";
import { applyCompletenessRules } from "../lib/rules/completeness.js";
import { applyEfficiencyRules } from "../lib/rules/efficiency.js";
import { applyContextRules } from "../lib/rules/context.js";
import { countTokens, estimateCostSaved } from "../lib/tokenizer.js";
import { RuleResult } from "../lib/types.js";
import { discoverProjectDocs, extractContextTokens } from "../lib/contextual-rewriter.js";
import { cwd } from "process";

export async function optimizePrompt(rawPrompt: string, mode: "compact" | "verbose" = "compact", projectRoot?: string) {
  const root = projectRoot || cwd();
  let contextEnhancedPrompt = rawPrompt;
  let contextRules: RuleResult[] = [];

  // Try to discover and extract project context
  try {
    const docFiles = await discoverProjectDocs(root);
    if (docFiles.length > 0) {
      const { promises: fs } = await import("fs");
      let allContextTokens = {};
      for (const file of docFiles) {
        const content = await fs.readFile(file, "utf-8");
        const tokens = await extractContextTokens(content);
        allContextTokens = { ...allContextTokens, ...tokens };
      }

      // Apply context rules to enhance the prompt
      const contextResult = applyContextRules(rawPrompt, allContextTokens);
      contextEnhancedPrompt = contextResult.text;
      contextRules = contextResult.results;
    }
  } catch {
    // If context discovery fails, continue with original prompt
  }

  const { optimized, rules } = rewrite(contextEnhancedPrompt);
  const rulesBeforeOptimization = [
    ...contextRules,
    ...applyEfficiencyRules(rawPrompt).results,
    ...applyClarityRules(rawPrompt).results,
    ...applySpecificityRules(rawPrompt).results,
    ...applyCompletenessRules(rawPrompt).results,
  ];
  const scoresBefore = computeScore(rulesBeforeOptimization);
  const scoresAfter = computeScore([...contextRules, ...rules]);
  const tokensBefore = countTokens(rawPrompt);
  const tokensAfter = countTokens(optimized);
  const tokensSaved = tokensBefore - tokensAfter;
  const costSaved = estimateCostSaved(Math.max(0, tokensSaved));

const summary = `✦ Prompt optimized · Score ${scoresBefore.total} → ${scoresAfter.total} · ${Math.max(0, tokensSaved)} tokens saved\n\n${optimized}`;
  if (mode === "compact") return { content: summary, raw: { optimized, scoreBefore: scoresBefore.total, scoreAfter: scoresAfter.total, tokensBefore, tokensAfter, tokensSaved, costSaved } };

  const changelog = rules.map((r: RuleResult) => `  ${r.severity === "critical" ? "🔴" : r.severity === "warn" ? "⚠" : "✦"} [${r.id}] ${r.message}`).join("\n");
  const verbose = `✦ Score ${scoresBefore.total} → ${scoresAfter.total} · ${Math.max(0, tokensSaved)} tokens saved · ~$${costSaved}\n\nChanges:\n${changelog}\n\n${optimized}`;

  return { content: verbose, raw: { optimized, scoreBefore: scoresBefore.total, scoreAfter: scoresAfter.total, tokensBefore, tokensAfter, tokensSaved, costSaved, rules } };
}
