export type Severity = "info" | "warn" | "critical";
export type Dimension = "clarity" | "specificity" | "completeness" | "efficiency";

export interface RuleResult {
  id: string;
  dimension: Dimension;
  severity: Severity;
  message: string;
  fix_applied: boolean;
}

export interface ScoreBreakdown {
  clarity: number;
  specificity: number;
  completeness: number;
  efficiency: number;
}
