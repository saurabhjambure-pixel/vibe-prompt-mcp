import { RuleResult } from "../types.js";

const VAGUE_VERBS = ["improve", "fix", "make better", "clean up", "enhance", "update", "do something with", "handle"];

const VAGUE_VERB_MAP: Record<string, string> = {
  "improve":           "redesign",
  "fix":               "debug and fix",
  "make better":       "improve",
  "clean up":          "refactor",
  "enhance":           "extend",
  "update":            "modernize",
  "do something with": "refactor",
  "handle":            "implement",
};

const SUBJECTIVE_MAP: Record<string, string> = {
  "modern":       "Inter font, neutral color palette, 8px border radius, consistent 16px grid spacing",
  "professional": "clean typography, structured layout, muted color palette",
  "clean":        "ample whitespace, minimal borders, consistent alignment",
  "sleek":        "dark background, high contrast text, smooth transitions",
  "polished":     "consistent spacing, clear visual hierarchy, no placeholder content",
  "nice":         "visually consistent with the rest of the app",
  "look good":    "visually consistent with the rest of the app",
  "feel better":  "smoother interactions, clear feedback on user actions"
};

export function applyClarityRules(prompt: string): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  // C1: Vague action verbs — swap with a concrete verb from VAGUE_VERB_MAP
  const vagueMatch = VAGUE_VERBS.find(v => new RegExp(`\\b${v}\\b`, "i").test(text));
  if (vagueMatch) {
    text = text.replace(new RegExp(`\\b${vagueMatch}\\b`, "i"), VAGUE_VERB_MAP[vagueMatch]);
    results.push({ id: "C1", dimension: "clarity", severity: "warn",
      message: `Replaced vague verb "${vagueMatch}" with specific action`, fix_applied: true });
  }

  // C2: Pronoun ambiguity — flag only
  const pronounPattern = /\b(it|this|that|these|those)\b(?!\s+(is|was|are|were|should|must|will))/gi;
  const pronounMatches = text.match(pronounPattern);
  if (pronounMatches && pronounMatches.length > 2) {
    results.push({ id: "C2", dimension: "clarity", severity: "warn",
      message: `Ambiguous pronouns (${[...new Set(pronounMatches)].join(", ")}) — replace with explicit references`,
      fix_applied: false });
  }

  // C3: Contradictory descriptors — flag only, user must resolve
  const contradictions: [string, string][] = [
    ["simple", "feature-rich"], ["minimal", "comprehensive"], ["fast", "detailed"]
  ];
  for (const [a, b] of contradictions) {
    if (new RegExp(`\\b${a}\\b`, "i").test(text) && new RegExp(`\\b${b}\\b`, "i").test(text)) {
      results.push({ id: "C3", dimension: "clarity", severity: "critical",
        message: `Contradiction: "${a}" vs "${b}" — resolve before sending`, fix_applied: false });
    }
  }

  // C4: Subjective descriptors — context-aware replacement with concrete spec
  const subjectiveMatch = Object.keys(SUBJECTIVE_MAP).find(s =>
    new RegExp(`\\b${s}\\b`, "i").test(text)
  );
  if (subjectiveMatch) {
    const spec = SUBJECTIVE_MAP[subjectiveMatch];
    const phrasePattern = new RegExp(
      `\\b(feel|look|be|seem|appear)\\s+(?:more|really|very)?\\s*${subjectiveMatch}\\b`,
      "i"
    );
    if (phrasePattern.test(text)) {
      text = text.replace(phrasePattern, `use ${spec}`);
    } else {
      text = text.replace(new RegExp(`\\b${subjectiveMatch}\\b`, "i"), spec);
    }
    results.push({ id: "C4", dimension: "clarity", severity: "warn",
      message: `Replaced subjective "${subjectiveMatch}" with concrete spec`, fix_applied: true });
  }

  return { text, results };
}
