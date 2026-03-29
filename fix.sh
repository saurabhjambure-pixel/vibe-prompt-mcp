#!/bin/bash

# Fix rewriter.ts
cat > src/lib/rewriter.ts << 'INNER'
import { applyEfficiencyRules } from "./rules/efficiency.js";
import { applyClarityRules } from "./rules/clarity.js";
import { applySpecificityRules } from "./rules/specificity.js";
import { applyCompletenessRules } from "./rules/completeness.js";
import { RuleResult } from "./types.js";

export function rewrite(prompt: string): { optimized: string; rules: RuleResult[] } {
  const allRules: RuleResult[] = [];
  let text = prompt.trim();

  let r1 = applyEfficiencyRules(text); text = r1.text; allRules.push(...r1.results);
  let r2 = applyClarityRules(text);    text = r2.text; allRules.push(...r2.results);
  let r3 = applySpecificityRules(text); text = r3.text; allRules.push(...r3.results);
  let r4 = applyCompletenessRules(text); text = r4.text; allRules.push(...r4.results);

  return { optimized: text.trim(), rules: allRules };
}
INNER

# Fix scorer.ts
cat > src/lib/scorer.ts << 'INNER'
import { RuleResult, ScoreBreakdown } from "./types.js";

const RULES_PER_DIMENSION: Record<string, number> = {
  clarity: 4, specificity: 3, completeness: 3, efficiency: 6
};
const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 1.0, warn: 0.6, info: 0.2
};

export function computeScore(rules: RuleResult[]): { total: number; breakdown: ScoreBreakdown } {
  const penalties: Record<string, number> = { clarity: 0, specificity: 0, completeness: 0, efficiency: 0 };

  for (const r of rules) {
    const maxPenalty = 25 / RULES_PER_DIMENSION[r.dimension];
    penalties[r.dimension] += maxPenalty * SEVERITY_WEIGHT[r.severity];
  }

  const breakdown: ScoreBreakdown = {
    clarity: Math.round(Math.max(0, 25 - penalties.clarity)),
    specificity: Math.round(Math.max(0, 25 - penalties.specificity)),
    completeness: Math.round(Math.max(0, 25 - penalties.completeness)),
    efficiency: Math.round(Math.max(0, 25 - penalties.efficiency)),
  };

  const total = (Object.values(breakdown) as number[]).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}
INNER

# Fix rules/clarity.ts
cat > src/lib/rules/clarity.ts << 'INNER'
import { RuleResult } from "../types.js";

const VAGUE_VERBS = ["improve", "fix", "make better", "clean up", "enhance", "update", "do something with", "handle"];
const SUBJECTIVE = ["modern", "professional", "clean", "nice", "feel better", "look good", "sleek", "polished"];

export function applyClarityRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  const vagueMatch = VAGUE_VERBS.find(v => new RegExp(`\\b${v}\\b`, "i").test(text));
  if (vagueMatch) {
    results.push({ id: "C1", dimension: "clarity", severity: "warn", message: `Vague verb "${vagueMatch}" detected — specify the exact change`, fix_applied: false });
  }

  const pronounPattern = /\b(it|this|that|these|those)\b(?!\s+(is|was|are|were|should|must|will))/gi;
  const pronounMatches = text.match(pronounPattern);
  if (pronounMatches && pronounMatches.length > 2) {
    results.push({ id: "C2", dimension: "clarity", severity: "warn", message: `Ambiguous pronouns (${[...new Set(pronounMatches)].join(", ")}) — replace with explicit references`, fix_applied: false });
  }

  const contradictions = [["simple", "feature-rich"], ["minimal", "comprehensive"], ["fast", "detailed"]];
  for (const [a, b] of contradictions) {
    if (new RegExp(`\\b${a}\\b`, "i").test(text) && new RegExp(`\\b${b}\\b`, "i").test(text)) {
      results.push({ id: "C3", dimension: "clarity", severity: "critical", message: `Contradiction: "${a}" vs "${b}" — resolve before sending`, fix_applied: false });
    }
  }

  const subjectiveMatch = SUBJECTIVE.find(s => new RegExp(`\\b${s}\\b`, "i").test(text));
  if (subjectiveMatch) {
    results.push({ id: "C4", dimension: "clarity", severity: "warn", message: `Subjective descriptor "${subjectiveMatch}" — replace with concrete spec`, fix_applied: false });
  }

  return { text, results };
}
INNER

# Fix rules/efficiency.ts
cat > src/lib/rules/efficiency.ts << 'INNER'
import { RuleResult } from "../types.js";

export function applyEfficiencyRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  const fillers = /^(can you |please |i want you to |i need you to |could you |i'd like you to )/i;
  if (fillers.test(text)) {
    text = text.replace(fillers, "");
    results.push({ id: "E1", dimension: "efficiency", severity: "info", message: "Stripped filler opener", fix_applied: true });
  }

  const meta = /\b(as an ai|feel free to|i know you('re| are) capable|you can also)\b/gi;
  if (meta.test(text)) {
    text = text.replace(meta, "").replace(/\s{2,}/g, " ").trim();
    results.push({ id: "E2", dimension: "efficiency", severity: "info", message: "Removed meta-commentary", fix_applied: true });
  }

  const hedges = /\b(if possible|maybe |sort of |kind of |try to |as much as possible)\b/gi;
  if (hedges.test(text)) {
    text = text.replace(hedges, "").replace(/\s{2,}/g, " ").trim();
    results.push({ id: "E6", dimension: "efficiency", severity: "warn", message: "Removed hedge phrases — models treat them as optional", fix_applied: true });
  }

  const hasMarkdownStructure = /^#{1,3}\s|^\s*[-*]\s/m.test(text);
  const wordCount = text.split(/\s+/).length;
  if (hasMarkdownStructure && wordCount < 60) {
    text = text.replace(/^#{1,3}\s.*/gm, "").replace(/^\s*[-*]\s/gm, "").replace(/\n{2,}/g, " ").trim();
    results.push({ id: "E4", dimension: "efficiency", severity: "info", message: "Collapsed over-structured formatting for short prompt", fix_applied: true });
  }

  const sentences = text.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const seen = new Set<string>();
  const dupes = sentences.filter(s => { if (seen.has(s)) return true; seen.add(s); return false; });
  if (dupes.length > 0) {
    results.push({ id: "E5", dimension: "efficiency", severity: "warn", message: "Duplicate context detected — deduplicate manually", fix_applied: false });
  }

  return { text, results };
}
INNER

# Fix rules/specificity.ts
cat > src/lib/rules/specificity.ts << 'INNER'
import { RuleResult } from "../types.js";

export function applySpecificityRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  const hasCriteria = /\b(done when|should|must|expected output|so that|acceptance|result should)\b/i.test(text);
  if (!hasCriteria && text.split(/\s+/).length > 10) {
    text = text.trimEnd() + " Done when: [specify expected result].";
    results.push({ id: "S1", dimension: "specificity", severity: "critical", message: "No acceptance criteria — appended placeholder", fix_applied: true });
  }

  const isUiPrompt = /\b(button|form|page|screen|modal|dashboard|table|list|card|nav|header|footer)\b/i.test(text);
  const hasStyleRef = /\b(tailwind|shadcn|mui|chakra|bootstrap|styled|css|className|dark mode|light mode)\b/i.test(text);
  if (isUiPrompt && !hasStyleRef) {
    results.push({ id: "S2", dimension: "specificity", severity: "warn", message: "UI prompt lacks component/style reference — add framework (e.g. Tailwind, shadcn)", fix_applied: false });
  }

  const isFeaturePrompt = /\b(build|create|add|implement|show|display|fetch|load)\b/i.test(text);
  const hasStates = /\b(error|loading|empty|skeleton|fallback|spinner|no data)\b/i.test(text);
  if (isFeaturePrompt && !hasStates) {
    text = text.trimEnd() + " Include loading, error, and empty states.";
    results.push({ id: "S3", dimension: "specificity", severity: "warn", message: "Missing UI states — appended loading/error/empty instruction", fix_applied: true });
  }

  return { text, results };
}
INNER

# Fix rules/completeness.ts
cat > src/lib/rules/completeness.ts << 'INNER'
import { RuleResult } from "../types.js";

export function applyCompletenessRules(prompt: string): { text: string; results: RuleResult[] } {
  const text = prompt;
  const results: RuleResult[] = [];

  const actionVerbs = prompt.match(/\b(build|create|add|implement|integrate|connect|fetch|display|update|delete|remove|send|generate)\b/gi) || [];
  const uniqueActions = [...new Set(actionVerbs.map(v => v.toLowerCase()))];
  if (uniqueActions.length >= 3) {
    results.push({ id: "K1", dimension: "completeness", severity: "critical", message: `Scope creep: ${uniqueActions.length} actions in one prompt (${uniqueActions.join(", ")}) — split into sequential prompts`, fix_applied: false });
  }

  const isFeature = /\b(build|create|implement)\b/i.test(prompt);
  const hasConstraints = /\b(mobile|responsive|accessible|keyboard|performance|a11y|WCAG)\b/i.test(prompt);
  if (isFeature && !hasConstraints) {
    results.push({ id: "K2", dimension: "completeness", severity: "info", message: "No constraints mentioned — consider adding: responsive, accessible", fix_applied: false });
  }

  const orphanedRef = /\bthe (existing|current|previous|old)\s+\w+/gi;
  if (orphanedRef.test(prompt)) {
    results.push({ id: "K4", dimension: "completeness", severity: "warn", message: "References prior context not defined in this prompt — add brief context", fix_applied: false });
  }

  return { text, results };
}
INNER

# Fix tools/optimize.ts
cat > src/tools/optimize.ts << 'INNER'
import { rewrite } from "../lib/rewriter.js";
import { computeScore } from "../lib/scorer.js";
import { countTokens, estimateCostSaved } from "../lib/tokenizer.js";
import { RuleResult } from "../lib/types.js";

export function optimizePrompt(rawPrompt: string, mode: "compact" | "verbose" = "compact") {
  const { optimized, rules } = rewrite(rawPrompt);
  const scoresBefore = computeScore([]);
  const scoresAfter = computeScore(rules);
  const tokensBefore = countTokens(rawPrompt);
  const tokensAfter = countTokens(optimized);
  const tokensSaved = tokensBefore - tokensAfter;
  const costSaved = estimateCostSaved(Math.max(0, tokensSaved));

  const summary = `✦ Score ${scoresBefore.total} → ${scoresAfter.total} · ${Math.max(0, tokensSaved)} tokens saved\n\n${optimized}`;

  if (mode === "compact") return { content: summary, raw: { optimized, scoreBefore: scoresBefore.total, scoreAfter: scoresAfter.total, tokensBefore, tokensAfter, tokensSaved, costSaved } };

  const changelog = rules.map((r: RuleResult) => `  ${r.severity === "critical" ? "🔴" : r.severity === "warn" ? "⚠" : "✦"} [${r.id}] ${r.message}`).join("\n");
  const verbose = `✦ Score ${scoresBefore.total} → ${scoresAfter.total} · ${Math.max(0, tokensSaved)} tokens saved · ~$${costSaved}\n\nChanges:\n${changelog}\n\n${optimized}`;

  return { content: verbose, raw: { optimized, scoreBefore: scoresBefore.total, scoreAfter: scoresAfter.total, tokensBefore, tokensAfter, tokensSaved, costSaved, rules } };
}
INNER

# Fix tools/score.ts
cat > src/tools/score.ts << 'INNER'
import { applyClarityRules } from "../lib/rules/clarity.js";
import { applySpecificityRules } from "../lib/rules/specificity.js";
import { applyCompletenessRules } from "../lib/rules/completeness.js";
import { applyEfficiencyRules } from "../lib/rules/efficiency.js";
import { computeScore } from "../lib/scorer.js";

export function scorePrompt(rawPrompt: string) {
  const rules = [
    ...applyEfficiencyRules(rawPrompt).results,
    ...applyClarityRules(rawPrompt).results,
    ...applySpecificityRules(rawPrompt).results,
    ...applyCompletenessRules(rawPrompt).results,
  ];
  const { total, breakdown } = computeScore(rules);
  return { total, breakdown, issues: rules };
}
INNER

echo "✅ All imports fixed. Run: npm run build"
