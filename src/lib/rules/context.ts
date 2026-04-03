import { RuleResult } from "../types.js";
import { ContextTokens } from "../contextual-rewriter.js";

export function applyContextRules(
  prompt: string,
  tokens: ContextTokens
): { text: string; results: RuleResult[] } {
  let text = prompt;
  const results: RuleResult[] = [];

  if (!tokens || Object.keys(tokens).length === 0) {
    return { text, results };
  }

  // Detect domain based on prompt keywords
  const domain = detectDomain(prompt);

  // Apply context injection based on domain
  if (domain === "design" && tokens.design) {
    const { injected, rule } = injectDesignContext(text, tokens.design, prompt);
    text = injected;
    if (rule) results.push(rule);
  } else if (domain === "database" && tokens.database) {
    const { injected, rule } = injectDatabaseContext(
      text,
      tokens.database,
      prompt
    );
    text = injected;
    if (rule) results.push(rule);
  } else if (domain === "api" && tokens.api) {
    const { injected, rule } = injectApiContext(text, tokens.api, prompt);
    text = injected;
    if (rule) results.push(rule);
  } else if (domain === "auth" && tokens.auth) {
    const { injected, rule } = injectAuthContext(text, tokens.auth, prompt);
    text = injected;
    if (rule) results.push(rule);
  } else if (domain === "testing" && tokens.testing) {
    const { injected, rule } = injectTestingContext(
      text,
      tokens.testing,
      prompt
    );
    text = injected;
    if (rule) results.push(rule);
  } else if (domain === "state" && tokens.state) {
    const { injected, rule } = injectStateContext(text, tokens.state, prompt);
    text = injected;
    if (rule) results.push(rule);
  }

  return { text, results };
}

function detectDomain(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();

  if (
    lowerPrompt.includes("color") ||
    lowerPrompt.includes("font") ||
    lowerPrompt.includes("design") ||
    lowerPrompt.includes("button") ||
    lowerPrompt.includes("ui") ||
    lowerPrompt.includes("style")
  ) {
    return "design";
  }

  if (
    lowerPrompt.includes("database") ||
    lowerPrompt.includes("query") ||
    lowerPrompt.includes("schema") ||
    lowerPrompt.includes("table") ||
    lowerPrompt.includes("field")
  ) {
    return "database";
  }

  if (
    lowerPrompt.includes("api") ||
    lowerPrompt.includes("endpoint") ||
    lowerPrompt.includes("route") ||
    lowerPrompt.includes("request") ||
    lowerPrompt.includes("response")
  ) {
    return "api";
  }

  if (
    lowerPrompt.includes("auth") ||
    lowerPrompt.includes("login") ||
    lowerPrompt.includes("jwt") ||
    lowerPrompt.includes("oauth")
  ) {
    return "auth";
  }

  if (
    lowerPrompt.includes("test") ||
    lowerPrompt.includes("unit") ||
    lowerPrompt.includes("jest") ||
    lowerPrompt.includes("vitest")
  ) {
    return "testing";
  }

  if (
    lowerPrompt.includes("state") ||
    lowerPrompt.includes("redux") ||
    lowerPrompt.includes("zustand") ||
    lowerPrompt.includes("action") ||
    lowerPrompt.includes("store")
  ) {
    return "state";
  }

  return null;
}

function injectDesignContext(
  text: string,
  design: NonNullable<ContextTokens["design"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  // Inject colors if prompt mentions color-related terms
  if (
    prompt.toLowerCase().includes("color") ||
    prompt.toLowerCase().includes("accent")
  ) {
    const colorList = Object.entries(design.colors)
      .map(([name, value]) => `${name}: ${value}`)
      .join(", ");
    if (colorList) {
      injected = injected.replace(
        /color(?:s)?(?:\s+(?:should|is|was))?/i,
        `color palette (${colorList})`
      );
      hasInjection = true;
    }
  }

  // Inject fonts if prompt mentions font-related terms
  if (
    prompt.toLowerCase().includes("font") ||
    prompt.toLowerCase().includes("typography")
  ) {
    const fontList = Object.entries(design.fonts)
      .map(([name, value]) => `${name}: ${value}`)
      .join(", ");
    if (fontList) {
      injected = injected.replace(
        /font(?:s)?(?:\s+(?:should|is|was))?/i,
        `font (${fontList})`
      );
      hasInjection = true;
    }
  }

  // Inject spacing/components if mentioned
  if (design.spacing.length > 0) {
    const spacingStr = design.spacing.slice(0, 3).join(", ");
    if (
      prompt.toLowerCase().includes("spacing") ||
      prompt.toLowerCase().includes("padding")
    ) {
      injected += ` with spacing grid (${spacingStr})`;
      hasInjection = true;
    }
  }

  if (design.components.length > 0 && !hasInjection) {
    const compStr = design.components.slice(0, 3).join(", ");
    injected += ` using available components (${compStr})`;
    hasInjection = true;
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-DESIGN",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual design tokens from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}

function injectDatabaseContext(
  text: string,
  database: NonNullable<ContextTokens["database"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  if (Object.keys(database.tables).length > 0) {
    const tableList = Object.entries(database.tables)
      .map(
        ([table, fields]) =>
          `${table} (${fields.slice(0, 3).join(", ")}${fields.length > 3 ? ", ..." : ""})`
      )
      .slice(0, 3)
      .join(", ");

    if (
      prompt.toLowerCase().includes("database") ||
      prompt.toLowerCase().includes("query") ||
      prompt.toLowerCase().includes("table")
    ) {
      injected += ` for tables: ${tableList}`;
      hasInjection = true;
    }
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-DATABASE",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual database schema from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}

function injectApiContext(
  text: string,
  api: NonNullable<ContextTokens["api"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  if (api.endpoints.length > 0) {
    const endpointList = api.endpoints
      .slice(0, 5)
      .join(", ");

    if (
      prompt.toLowerCase().includes("api") ||
      prompt.toLowerCase().includes("endpoint") ||
      prompt.toLowerCase().includes("route")
    ) {
      injected += ` for endpoints: ${endpointList}`;
      hasInjection = true;
    }
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-API",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual API endpoints from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}

function injectAuthContext(
  text: string,
  auth: NonNullable<ContextTokens["auth"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  if (auth.methods.length > 0) {
    const methodStr = auth.methods.join(", ");
    injected += ` using ${methodStr}`;
    hasInjection = true;
  }

  if (auth.providers.length > 0 && hasInjection) {
    const providerStr = auth.providers.join(", ");
    injected += ` (providers: ${providerStr})`;
  } else if (auth.providers.length > 0) {
    const providerStr = auth.providers.join(", ");
    injected += ` with providers: ${providerStr}`;
    hasInjection = true;
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-AUTH",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual authentication methods from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}

function injectTestingContext(
  text: string,
  testing: NonNullable<ContextTokens["testing"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  if (testing.frameworks.length > 0) {
    const frameworkStr = testing.frameworks.join(", ");
    injected += ` using ${frameworkStr}`;
    hasInjection = true;
  }

  if (testing.utilities.length > 0 && hasInjection) {
    const utilityStr = testing.utilities.slice(0, 3).join(", ");
    injected += ` with utilities (${utilityStr})`;
  } else if (testing.utilities.length > 0) {
    const utilityStr = testing.utilities.slice(0, 3).join(", ");
    injected += ` with utilities: ${utilityStr}`;
    hasInjection = true;
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-TESTING",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual testing frameworks from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}

function injectStateContext(
  text: string,
  state: NonNullable<ContextTokens["state"]>,
  prompt: string
): { injected: string; rule: RuleResult | null } {
  let injected = text;
  let hasInjection = false;

  if (state.store) {
    injected += ` using ${state.store}`;
    hasInjection = true;
  }

  if (state.slices.length > 0) {
    const sliceStr = state.slices.slice(0, 3).join(", ");
    injected += hasInjection ? ` (slices: ${sliceStr})` : ` for slices: ${sliceStr}`;
    hasInjection = true;
  }

  const rule: RuleResult | null = hasInjection
    ? {
        id: "C0-STATE",
        dimension: "clarity",
        severity: "info",
        message: "Injected actual state management config from project documentation",
        fix_applied: true,
      }
    : null;

  return { injected, rule };
}
