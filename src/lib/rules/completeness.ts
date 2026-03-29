import { RuleResult } from "../types.js";

export function applyCompletenessRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  // K1: Scope creep — flag and suggest splitting
  const actionVerbs = prompt.match(/\b(build|create|add|implement|integrate|connect|fetch|display|update|delete|remove|send|generate)\b/gi) || [];
  const uniqueActions = [...new Set(actionVerbs.map(v => v.toLowerCase()))];
  if (uniqueActions.length >= 3) {
    results.push({ id: "K1", dimension: "completeness", severity: "critical",
      message: `Scope creep: ${uniqueActions.length} actions detected (${uniqueActions.join(", ")}) — split into sequential prompts for better results`,
      fix_applied: false });
  }

  // K2: Missing constraints — actively append
  const isFeature = /\b(build|create|implement|redesign|add)\b/i.test(prompt);
  const hasConstraints = /\b(mobile|responsive|accessible|keyboard|performance|a11y|WCAG)\b/i.test(prompt);
  if (isFeature && !hasConstraints) {
    text = text.trimEnd() + " Must be mobile responsive and keyboard accessible.";
    results.push({ id: "K2", dimension: "completeness", severity: "info",
      message: "Appended responsiveness and accessibility constraints", fix_applied: true });
  }

  // K3: No tech stack on short prompts — append sensible default
  const hasTechStack = /\b(react|next|vue|svelte|node|express|typescript|javascript|python|tailwind|prisma)\b/i.test(prompt);
  const wordCount = prompt.split(/\s+/).length;
  if (!hasTechStack && wordCount < 30) {
    text = "Using React and TypeScript, " + text.charAt(0).toLowerCase() + text.slice(1);
    results.push({ id: "K3", dimension: "completeness", severity: "info",
      message: "Prepended default tech stack (React + TypeScript)", fix_applied: true });
  }

  // K4: Orphaned references — flag only
  const orphanedRef = /\bthe (existing|current|previous|old)\s+\w+/gi;
  if (orphanedRef.test(prompt)) {
    results.push({ id: "K4", dimension: "completeness", severity: "warn",
      message: "References prior context not defined in this prompt — add a brief description of what exists",
      fix_applied: false });
  }

  return { text, results };
}