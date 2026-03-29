import { RuleResult } from "../types.js";

export function applySpecificityRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  // S1: Missing acceptance criteria — infer from context and construct
  const hasCriteria = /\b(done when|should|must|expected output|so that|acceptance|result should)\b/i.test(text);
  if (!hasCriteria && text.split(/\s+/).length > 10) {
    const isUI = /\b(page|dashboard|homepage|screen|modal|form|table|list|card|nav|header|footer)\b/i.exec(text);
    const subject = isUI ? isUI[0] : "feature";
    text = text.trimEnd() + ` Done when: the ${subject} renders correctly on mobile and desktop with no console errors.`;
    results.push({ id: "S1", dimension: "specificity", severity: "critical",
      message: `Inferred and appended acceptance criteria for "${subject}"`, fix_applied: true });
  }

  // S2: UI prompt without style reference — actively inject default stack
  const isUiPrompt = /\b(button|form|page|screen|modal|dashboard|table|list|card|nav|header|footer|homepage)\b/i.test(text);
  const hasStyleRef = /\b(tailwind|shadcn|mui|chakra|bootstrap|styled|css|className|dark mode|light mode)\b/i.test(text);
  if (isUiPrompt && !hasStyleRef) {
    text = text.trimEnd() + " Use Tailwind CSS and shadcn/ui components.";
    results.push({ id: "S2", dimension: "specificity", severity: "warn",
      message: "Appended default style stack: Tailwind CSS + shadcn/ui", fix_applied: true });
  }

  // S3: Missing error/loading/empty states — actively append
  const isFeaturePrompt = /\b(build|create|add|implement|show|display|fetch|load)\b/i.test(text);
  const hasStates = /\b(error|loading|empty|skeleton|fallback|spinner|no data)\b/i.test(text);
  if (isFeaturePrompt && !hasStates) {
    text = text.trimEnd() + " Include loading, error, and empty states.";
    results.push({ id: "S3", dimension: "specificity", severity: "warn",
      message: "Appended loading, error, and empty state requirements", fix_applied: true });
  }

  // S4: Missing data shape on CRUD/form prompts — flag only
  const isCrud = /\b(form|input|field|submit|save|create|edit|delete)\b/i.test(text);
  const hasDataShape = /\b(string|number|boolean|date|id|array|object|type|interface|schema)\b/i.test(text);
  if (isCrud && !hasDataShape) {
    results.push({ id: "S4", dimension: "specificity", severity: "warn",
      message: "Form/CRUD prompt missing data field definitions — specify field names and types",
      fix_applied: false });
  }

  return { text, results };
}