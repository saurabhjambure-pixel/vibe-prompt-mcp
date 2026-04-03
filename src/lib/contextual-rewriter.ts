import { promises as fs } from "fs";
import { join, relative } from "path";

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

const DISCOVERY_KEYWORDS = [
  "design",
  "brand",
  "color",
  "font",
  "database",
  "schema",
  "api",
  "route",
  "endpoint",
  "auth",
  "authentication",
  "state",
  "redux",
  "zustand",
  "test",
  "component",
  "config",
  "specification",
];

const SCAN_DIRECTORIES = [
  "docs",
  "design",
  "api",
  "auth",
  "schema",
  "src",
  ".",
];

export async function discoverProjectDocs(
  projectRoot: string
): Promise<string[]> {
  const docFiles: string[] = [];
  const visited = new Set<string>();

  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = join(projectRoot, dir);
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        if (
          file.isFile() &&
          file.name.endsWith(".md") &&
          !visited.has(file.name)
        ) {
          const fullPath = join(dirPath, file.name);
          const content = await fs.readFile(fullPath, "utf-8");

          // Check if file contains any discovery keywords
          if (
            DISCOVERY_KEYWORDS.some((kw) =>
              content.toLowerCase().includes(kw.toLowerCase())
            )
          ) {
            docFiles.push(fullPath);
            visited.add(file.name);

            // Limit to 10 files to avoid massive reads
            if (docFiles.length >= 10) break;
          }
        }
      }
      if (docFiles.length >= 10) break;
    } catch {
      // Directory doesn't exist or unreadable, continue
    }
  }

  return docFiles;
}

export async function extractContextTokens(
  mdContent: string
): Promise<ContextTokens> {
  const tokens: ContextTokens = {};
  const lowerContent = mdContent.toLowerCase();

  // Detect domains based on keywords
  if (
    lowerContent.includes("color") ||
    lowerContent.includes("font") ||
    lowerContent.includes("design")
  ) {
    tokens.design = extractDesignContext(mdContent);
  }

  if (lowerContent.includes("database") || lowerContent.includes("schema")) {
    tokens.database = extractDatabaseContext(mdContent);
  }

  if (lowerContent.includes("api") || lowerContent.includes("endpoint")) {
    tokens.api = extractApiContext(mdContent);
  }

  if (
    lowerContent.includes("auth") ||
    lowerContent.includes("authentication")
  ) {
    tokens.auth = extractAuthContext(mdContent);
  }

  if (
    lowerContent.includes("test") ||
    lowerContent.includes("testing") ||
    lowerContent.includes("jest") ||
    lowerContent.includes("vitest")
  ) {
    tokens.testing = extractTestingContext(mdContent);
  }

  if (
    lowerContent.includes("redux") ||
    lowerContent.includes("zustand") ||
    lowerContent.includes("state")
  ) {
    tokens.state = extractStateContext(mdContent);
  }

  return tokens;
}

function extractDesignContext(
  content: string
): ContextTokens["design"] {
  const colors: Record<string, string> = {};
  const fonts: Record<string, string> = {};
  const spacing: string[] = [];
  const components: string[] = [];

  // Extract colors: pattern like "primary: #3B82F6" or "primary-color: #3B82F6"
  const colorPattern = /(primary|secondary|accent|bg|background|text)\s*:\s*(#[0-9a-fA-F]{6}|rgb\([^)]+\)|hsl\([^)]+\))/gi;
  let match;
  while ((match = colorPattern.exec(content)) !== null) {
    colors[match[1].toLowerCase()] = match[2];
  }

  // Extract fonts: pattern like "body-font: Inter" or "font: Inter, sans-serif"
  const fontPattern = /(body|heading|title|font)\s*:\s*([^;\n,]+)/gi;
  while ((match = fontPattern.exec(content)) !== null) {
    const fontName = match[2].trim().split(",")[0];
    fonts[match[1].toLowerCase()] = fontName;
  }

  // Extract spacing: 8px, 16px, 4px, etc.
  const spacingPattern = /\b(\d+px)\b/g;
  const spacingSet = new Set<string>();
  while ((match = spacingPattern.exec(content)) !== null) {
    spacingSet.add(match[1]);
  }
  spacing.push(...Array.from(spacingSet));

  // Extract components: markdown headers like "## Button"
  const componentPattern = /^##\s+([A-Z][a-zA-Z0-9]*)/gm;
  while ((match = componentPattern.exec(content)) !== null) {
    components.push(match[1]);
  }

  return { colors, fonts, spacing, components };
}

function extractDatabaseContext(
  content: string
): ContextTokens["database"] {
  const tables: Record<string, string[]> = {};
  const relations: string[] = [];

  // Extract tables and fields
  // Pattern: "## users" or "### users table"
  const tablePattern = /^#{2,3}\s+(\w+)(?:\s+table)?/gm;
  let match;
  while ((match = tablePattern.exec(content)) !== null) {
    const tableName = match[1];
    tables[tableName] = [];

    // Find fields after this table header until next header
    const tableContentEnd = content.indexOf(
      "\n##",
      match.index + match[0].length
    );
    const tableContent = content.substring(
      match.index + match[0].length,
      tableContentEnd === -1 ? undefined : tableContentEnd
    );

    // Extract field names: "id:", "email:", "created_at: timestamp"
    const fieldPattern = /^\s*(\w+)\s*:?\s*([a-z]+)?/gm;
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(tableContent)) !== null) {
      if (fieldMatch[1] && fieldMatch[1] !== "table") {
        tables[tableName].push(fieldMatch[1]);
      }
    }
  }

  // Extract relations
  const relationPattern =
    /(foreign key|references|belongs to|has many|one-to-many|many-to-one)/gi;
  while ((match = relationPattern.exec(content)) !== null) {
    relations.push(match[1]);
  }

  return { tables, relations };
}

function extractApiContext(content: string): ContextTokens["api"] {
  const endpoints: string[] = [];
  const methods = new Set<string>();
  const statusCodes = new Set<string>();

  // Extract endpoints: GET /users, POST /auth, etc.
  const endpointPattern =
    /(GET|POST|PUT|DELETE|PATCH)\s+(\/([\w\-/]*)?)/gi;
  let match;
  while ((match = endpointPattern.exec(content)) !== null) {
    endpoints.push(`${match[1].toUpperCase()} ${match[2]}`);
    methods.add(match[1].toUpperCase());
  }

  // Extract HTTP status codes: 200, 404, 500, etc.
  const statusPattern = /\b(\d{3})\s+(ok|created|error|not\s+found|unauthorized|forbidden)/gi;
  while ((match = statusPattern.exec(content)) !== null) {
    statusCodes.add(match[1]);
  }

  return {
    endpoints,
    methods: Array.from(methods),
    statusCodes: Array.from(statusCodes),
  };
}

function extractAuthContext(content: string): ContextTokens["auth"] {
  const methods = new Set<string>();
  const providers = new Set<string>();
  const flows = new Set<string>();

  // Extract auth methods: JWT, OAuth, Session, API Key
  const methodPattern = /(JWT|OAuth|OAuth2|Session|API Key|Basic Auth|Bearer)/gi;
  let match;
  while ((match = methodPattern.exec(content)) !== null) {
    methods.add(match[1]);
  }

  // Extract providers: Google, GitHub, Auth0
  const providerPattern =
    /(Google|GitHub|Auth0|Microsoft|Facebook|Apple|Okta)/gi;
  while ((match = providerPattern.exec(content)) !== null) {
    providers.add(match[1]);
  }

  // Extract flows: login, register, logout, refresh
  const flowPattern =
    /(login|register|signup|logout|refresh|password reset|mfa|two-factor)/gi;
  while ((match = flowPattern.exec(content)) !== null) {
    flows.add(match[1].toLowerCase());
  }

  return {
    methods: Array.from(methods),
    providers: Array.from(providers),
    flows: Array.from(flows),
  };
}

function extractTestingContext(content: string): ContextTokens["testing"] {
  const frameworks = new Set<string>();
  const utilities = new Set<string>();
  const patterns = new Set<string>();

  // Extract test frameworks
  const frameworkPattern = /(Jest|Vitest|Mocha|Jasmine|Cypress|Playwright)/gi;
  let match;
  while ((match = frameworkPattern.exec(content)) !== null) {
    frameworks.add(match[1]);
  }

  // Extract utilities: render, fireEvent, screen, etc.
  const utilityPattern =
    /(render|fireEvent|screen|waitFor|userEvent|act|mount|shallow)/gi;
  while ((match = utilityPattern.exec(content)) !== null) {
    utilities.add(match[1]);
  }

  // Extract test patterns
  const patternPattern =
    /(unit test|integration test|e2e test|snapshot|mock|stub|spy)/gi;
  while ((match = patternPattern.exec(content)) !== null) {
    patterns.add(match[1].toLowerCase());
  }

  return {
    frameworks: Array.from(frameworks),
    utilities: Array.from(utilities),
    patterns: Array.from(patterns),
  };
}

function extractStateContext(content: string): ContextTokens["state"] {
  const state: ContextTokens["state"] = {
    slices: [],
    actions: [],
  };

  // Detect store type
  if (content.toLowerCase().includes("redux")) {
    state.store = "Redux";
  } else if (content.toLowerCase().includes("zustand")) {
    state.store = "Zustand";
  } else if (content.toLowerCase().includes("context api")) {
    state.store = "Context API";
  }

  // Extract slices/stores: auth, user, notifications
  const slicePattern = /(auth|user|notifications|todos|posts|comments|ui)/gi;
  const sliceSet = new Set<string>();
  let match;
  while ((match = slicePattern.exec(content)) !== null) {
    sliceSet.add(match[1].toLowerCase());
  }
  state.slices = Array.from(sliceSet);

  // Extract actions: setUser, clearAuth, addTodo
  const actionPattern = /(set[A-Z]\w*|clear[A-Z]\w*|add[A-Z]\w*|remove[A-Z]\w*|toggle[A-Z]\w*|fetch[A-Z]\w*)/g;
  const actionSet = new Set<string>();
  while ((match = actionPattern.exec(content)) !== null) {
    actionSet.add(match[1]);
  }
  state.actions = Array.from(actionSet);

  return state;
}
