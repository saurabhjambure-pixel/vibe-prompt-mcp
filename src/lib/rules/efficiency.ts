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
