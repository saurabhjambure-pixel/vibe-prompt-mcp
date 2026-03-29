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
