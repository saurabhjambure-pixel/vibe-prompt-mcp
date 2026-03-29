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
