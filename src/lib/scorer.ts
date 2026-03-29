import { RuleResult, ScoreBreakdown } from "./types.js";

const RULES_PER_DIMENSION: Record<string, number> = {
  clarity: 4, specificity: 4, completeness: 4, efficiency: 6
};

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 1.0,
  warn: 0.75,
  info: 0.4
};

export function computeScore(rules: RuleResult[]): { total: number; breakdown: ScoreBreakdown } {
  const penalties: Record<string, number> = { clarity: 0, specificity: 0, completeness: 0, efficiency: 0 };

  for (const r of rules) {
    const maxPenalty = 25 / RULES_PER_DIMENSION[r.dimension];
    penalties[r.dimension] += maxPenalty * SEVERITY_WEIGHT[r.severity];
  }

  const breakdown: ScoreBreakdown = {
    clarity:      Math.round(Math.max(0, 25 - penalties.clarity)),
    specificity:  Math.round(Math.max(0, 25 - penalties.specificity)),
    completeness: Math.round(Math.max(0, 25 - penalties.completeness)),
    efficiency:   Math.round(Math.max(0, 25 - penalties.efficiency)),
  };

  const total = (Object.values(breakdown) as number[]).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}