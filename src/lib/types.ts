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

export interface ContextTokens {
  design?: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: string[];
    components: string[];
  };
  database?: {
    tables: Record<string, string[]>;
    relations: string[];
  };
  api?: {
    endpoints: string[];
    methods: string[];
    statusCodes: string[];
  };
  auth?: {
    methods: string[];
    providers: string[];
    flows: string[];
  };
  testing?: {
    frameworks: string[];
    utilities: string[];
    patterns: string[];
  };
  state?: {
    store?: string;
    slices: string[];
    actions: string[];
  };
  [key: string]: any;
}
