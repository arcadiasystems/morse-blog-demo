#!/usr/bin/env node

/**
 * Eject a monorepo template into a standalone Next.js project.
 *
 * Usage:  node scripts/eject.mjs <template-name> [output-dir] [--force]
 *
 * Templates: demo, clean, editorial, magazine, minimal
 */

import fs from "node:fs";
import path from "node:path";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONO_ROOT = path.resolve(import.meta.dirname, "..");
const VALID_TEMPLATES = ["demo", "clean", "editorial", "magazine", "minimal"];

function die(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

function info(msg) {
  console.log(`  -> ${msg}`);
}

function heading(msg) {
  console.log(`\n== ${msg} ==`);
}

/** Recursively copy a directory tree. */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Recursively walk a directory and return all file paths. */
function walkSync(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSync(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const force = args.includes("--force");
const positional = args.filter((a) => !a.startsWith("--"));

const templateName = positional[0];
const outputDir = positional[1]
  ? path.resolve(positional[1])
  : path.resolve(MONO_ROOT, "ejected", templateName || "unknown");

if (!templateName) {
  die(
    `Missing template name.\n  Usage: node scripts/eject.mjs <template> [output-dir] [--force]\n  Templates: ${VALID_TEMPLATES.join(", ")}`,
  );
}

if (!VALID_TEMPLATES.includes(templateName)) {
  die(
    `Unknown template "${templateName}".\n  Valid templates: ${VALID_TEMPLATES.join(", ")}`,
  );
}

const appDir = path.join(MONO_ROOT, "apps", templateName);
const sharedDir = path.join(MONO_ROOT, "packages", "shared");

if (!fs.existsSync(appDir)) {
  die(`App directory not found: ${appDir}`);
}
if (!fs.existsSync(sharedDir)) {
  die(`Shared package directory not found: ${sharedDir}`);
}

// ── Output directory ─────────────────────────────────────────────────────────

if (fs.existsSync(outputDir)) {
  if (!force) {
    die(
      `Output directory already exists: ${outputDir}\n  Use --force to overwrite.`,
    );
  }
  heading("Removing existing output directory (--force)");
  fs.rmSync(outputDir, { recursive: true, force: true });
}

fs.mkdirSync(outputDir, { recursive: true });
console.log(`\nEjecting template "${templateName}" -> ${outputDir}\n`);

// ── Step 1: Copy app source ─────────────────────────────────────────────────

heading("Step 1: Copy app source");
const appSrc = path.join(appDir, "src");
const outSrc = path.join(outputDir, "src");
copyDirSync(appSrc, outSrc);
info(`Copied ${appSrc} -> ${outSrc}`);

// ── Step 2: Copy shared source ──────────────────────────────────────────────

heading("Step 2: Copy shared source into standalone project");
const sharedSrc = path.join(sharedDir, "src");
const outShared = path.join(outputDir, "src", "shared");
copyDirSync(sharedSrc, outShared);
info(`Copied ${sharedSrc} -> ${outShared}`);

// ── Step 3: Rewrite import paths ────────────────────────────────────────────

heading("Step 3: Rewrite @morse/shared imports");

/**
 * Rewrite all @morse/shared/... import paths to @/shared/... in a file.
 *
 * Handles:
 *   import { X } from "@morse/shared/lib/foo"
 *   import "@morse/shared/styles"
 *   export { X } from "@morse/shared/lib/foo"
 *   import("@morse/shared/lib/foo")
 *   ... with both single and double quotes
 */
const IMPORT_RE = /(['"])@morse\/shared\/(.*?)\1/g;

let rewriteCount = 0;
let fileCount = 0;

const srcFiles = walkSync(outSrc);
for (const filePath of srcFiles) {
  if (!/\.(ts|tsx|mts|mjs|js|jsx)$/.test(filePath)) continue;

  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes("@morse/shared")) continue;

  const updated = content.replace(IMPORT_RE, (match, quote, rest) => {
    rewriteCount++;
    return `${quote}@/shared/${rest}${quote}`;
  });

  fs.writeFileSync(filePath, updated, "utf-8");
  fileCount++;
}

info(`Rewrote ${rewriteCount} imports across ${fileCount} files`);

// ── Step 4: Generate package.json ───────────────────────────────────────────

heading("Step 4: Generate package.json");

const appPkg = JSON.parse(
  fs.readFileSync(path.join(appDir, "package.json"), "utf-8"),
);
const sharedPkg = JSON.parse(
  fs.readFileSync(path.join(sharedDir, "package.json"), "utf-8"),
);
const rootPkg = JSON.parse(
  fs.readFileSync(path.join(MONO_ROOT, "package.json"), "utf-8"),
);

// Merge dependencies: start with app, layer shared on top (shared wins for heavy deps)
const mergedDeps = { ...appPkg.dependencies, ...sharedPkg.dependencies };
// Remove the workspace reference
delete mergedDeps["@morse/shared"];

// Merge devDependencies similarly
const mergedDevDeps = {
  ...(appPkg.devDependencies || {}),
  ...(sharedPkg.devDependencies || {}),
};

// Sort dependencies alphabetically
const sortObj = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

const outputPkg = {
  name: `morse-${templateName}`,
  version: "0.1.0",
  private: true,
  scripts: { ...appPkg.scripts },
  dependencies: sortObj(mergedDeps),
  devDependencies: sortObj(mergedDevDeps),
};

if (rootPkg.packageManager) {
  outputPkg.packageManager = rootPkg.packageManager;
}

fs.writeFileSync(
  path.join(outputDir, "package.json"),
  JSON.stringify(outputPkg, null, 2) + "\n",
  "utf-8",
);

info(`Generated package.json (name: ${outputPkg.name})`);

// ── Step 5: Generate config files ───────────────────────────────────────────

heading("Step 5: Generate config files");

// --- next.config.ts ---
// Read the original and remove @morse/shared from transpilePackages
const origNextConfig = fs.readFileSync(
  path.join(appDir, "next.config.ts"),
  "utf-8",
);
// Remove the "@morse/shared" line from transpilePackages
const newNextConfig = origNextConfig
  .replace(/\s*"@morse\/shared",?\n/g, "\n")
  // Clean up potential double newlines
  .replace(/\[\n\n/g, "[\n");

fs.writeFileSync(
  path.join(outputDir, "next.config.ts"),
  newNextConfig,
  "utf-8",
);
info("Generated next.config.ts (removed @morse/shared from transpilePackages)");

// --- tsconfig.json ---
const tsconfigContent = {
  compilerOptions: {
    target: "ES2017",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "react-jsx",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: {
      "@/*": ["./src/*"],
    },
  },
  include: [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts",
  ],
  exclude: ["node_modules"],
};

fs.writeFileSync(
  path.join(outputDir, "tsconfig.json"),
  JSON.stringify(tsconfigContent, null, 2) + "\n",
  "utf-8",
);
info("Generated tsconfig.json (standalone, no extends, no @morse/shared path)");

// --- postcss.config.mjs ---
const postcssPath = path.join(appDir, "postcss.config.mjs");
if (fs.existsSync(postcssPath)) {
  fs.copyFileSync(postcssPath, path.join(outputDir, "postcss.config.mjs"));
  info("Copied postcss.config.mjs");
}

// --- eslint.config.mjs ---
const eslintPath = path.join(appDir, "eslint.config.mjs");
if (fs.existsSync(eslintPath)) {
  fs.copyFileSync(eslintPath, path.join(outputDir, "eslint.config.mjs"));
  info("Copied eslint.config.mjs");
}

// --- components.json ---
const componentsPath = path.join(appDir, "components.json");
if (fs.existsSync(componentsPath)) {
  fs.copyFileSync(componentsPath, path.join(outputDir, "components.json"));
  info("Copied components.json");
}

// --- .gitignore ---
const gitignoreContent = `# dependencies
node_modules/
/.pnp
.pnp.js

# next.js
.next/
out/
build/

# production
dist/

# env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# misc
.DS_Store
*.tsbuildinfo
`;

fs.writeFileSync(path.join(outputDir, ".gitignore"), gitignoreContent, "utf-8");
info("Generated .gitignore");

// ── Step 6: (Shared internal imports are relative — no changes needed) ──────

heading("Step 6: Verify shared package internal imports");
info("Shared package uses relative imports internally — no changes needed");

// ── Step 7: Fix Tailwind CSS @source directive ──────────────────────────────

heading("Step 7: Fix Tailwind CSS @source directive in globals.css");

const globalsCssPath = path.join(outputDir, "src", "app", "globals.css");
if (fs.existsSync(globalsCssPath)) {
  let css = fs.readFileSync(globalsCssPath, "utf-8");
  // Replace the monorepo-relative path to shared with the local path
  // From globals.css in src/app/, the shared dir is at ../shared
  const oldSource = css.match(/@source\s+"[^"]*packages\/shared\/src[^"]*"/);
  if (oldSource) {
    css = css.replace(oldSource[0], '@source "../shared"');
    fs.writeFileSync(globalsCssPath, css, "utf-8");
    info(`Updated @source: ${oldSource[0]} -> @source "../shared"`);
  } else {
    info("No @source directive referencing packages/shared found (skipping)");
  }
} else {
  info("globals.css not found at expected location (skipping)");
}

// ── Step 8: Copy seed directory ─────────────────────────────────────────────

heading("Step 8: Copy seed directory");

const seedDir = path.join(MONO_ROOT, "seed");
if (fs.existsSync(seedDir)) {
  copyDirSync(seedDir, path.join(outputDir, "seed"));
  info("Copied seed/ directory");
} else {
  info("No seed/ directory found (skipping)");
}

// ── Step 9: Copy and generate documentation files ───────────────────────────

heading("Step 9: Generate documentation files");

// Copy AGENTS.md
const agentsMdPath = path.join(MONO_ROOT, "AGENTS.md");
if (fs.existsSync(agentsMdPath)) {
  fs.copyFileSync(agentsMdPath, path.join(outputDir, "AGENTS.md"));
  info("Copied AGENTS.md");
}

// Generate CLAUDE.md
fs.writeFileSync(path.join(outputDir, "CLAUDE.md"), "@AGENTS.md\n", "utf-8");
info("Generated CLAUDE.md");

// Generate README.md
const readmeContent = `# Morse ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Template

A standalone Next.js blog template powered by the [Morse](https://morse.build) decentralized CMS on Sui.

## Setup

1. Install dependencies:

   \`\`\`bash
   npm install
   \`\`\`

2. Configure your publication ID in \`src/shared/lib/morse-config.ts\`.

3. Start the development server:

   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:${appPkg.scripts?.dev?.match(/--port\s+(\d+)/)?.[1] || "3000"}](http://localhost:${appPkg.scripts?.dev?.match(/--port\s+(\d+)/)?.[1] || "3000"}) in your browser.

## Scripts

- \`npm run dev\` — Start the development server
- \`npm run build\` — Build for production
- \`npm start\` — Start the production server
- \`npm run lint\` — Run ESLint
`;

fs.writeFileSync(path.join(outputDir, "README.md"), readmeContent, "utf-8");
info("Generated README.md");

// ── Done ────────────────────────────────────────────────────────────────────

heading("Done!");
console.log(`
  Ejected "${templateName}" to: ${outputDir}

  Next steps:
    cd ${outputDir}
    npm install
    # Edit src/shared/lib/morse-config.ts with your publication ID
    npm run dev
`);
