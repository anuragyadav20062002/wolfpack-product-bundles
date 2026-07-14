#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  GENERATED_FILES,
  createCheckPlan,
  findBannedTestPatterns,
  isGraphifyConfigurationFailure,
} = require("./pre-commit-critical-core.cjs");

const GENERATED_OUTPUTS = {
  "all": [
    "extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js",
    "extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js",
    "extensions/bundle-builder/assets/wolfpack-bundles-sdk.js",
  ],
  "full-page": ["extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js"],
  "product-page": ["extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js"],
  sdk: ["extensions/bundle-builder/assets/wolfpack-bundles-sdk.js"],
};

const CSS_OUTPUTS = [
  "extensions/bundle-builder/assets/bundle-widget-full-page.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-standard.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-classic.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-compact.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css",
  "extensions/bundle-builder/assets/bundle-widget.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-modal.css",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    return {
      status: 1,
      output: result.error.message,
    };
  }

  return {
    status: result.status ?? 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function gitLines(args) {
  const result = run("git", args, { capture: true });
  if (result.status !== 0) return [];
  return result.output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function abort(message) {
  console.error(`\n[pre-commit] ${message}`);
  process.exit(1);
}

function stageFiles(files) {
  const existing = [...new Set(files)].filter((file) => existsSync(file));
  if (existing.length === 0) return;

  const result = run("git", ["add", "--", ...existing]);
  if (result.status !== 0) {
    abort(`Failed to stage generated files:\n${existing.map((file) => `  - ${file}`).join("\n")}`);
  }
}

function readTestContents(files) {
  const contents = {};
  for (const file of files) {
    if (existsSync(file)) contents[file] = readFileSync(file, "utf8");
  }
  return contents;
}

function commandLabel(command, args) {
  return [command, ...args].join(" ");
}

function mustRun(command, args) {
  console.log(`[pre-commit] ${commandLabel(command, args)}`);
  const result = run(command, args);
  if (result.status !== 0) {
    abort(`Command failed: ${commandLabel(command, args)}`);
  }
}

function runGraphify() {
  console.log("[pre-commit] npm run graphify:rebuild");
  const result = run("npm", ["run", "graphify:rebuild"], { capture: true });
  if (result.status === 0) {
    process.stdout.write(result.output);
    stageFiles(["graphify-out/GRAPH_REPORT.md", "graphify-out/graph.json"]);
    return;
  }

  if (isGraphifyConfigurationFailure(result.output)) {
    console.warn("[pre-commit] Warning: graphify rebuild skipped because local configuration failed.");
    console.warn(result.output.trim());
    return;
  }

  process.stderr.write(result.output);
  abort("Graphify rebuild failed with a non-configuration error.");
}

function runWidgetBuilds(targets) {
  const generated = new Set();
  for (const target of targets) {
    if (target === "all") {
      mustRun("npm", ["run", "build:widgets"]);
    } else if (target === "full-page") {
      mustRun("npm", ["run", "build:widgets:full-page"]);
    } else if (target === "product-page") {
      mustRun("npm", ["run", "build:widgets:product-page"]);
    } else if (target === "sdk") {
      mustRun("npm", ["run", "build:sdk"]);
    }

    for (const file of GENERATED_OUTPUTS[target] ?? []) generated.add(file);
  }

  stageFiles([...generated]);
}

function main() {
  const diffCheck = run("git", ["diff", "--cached", "--check"]);
  if (diffCheck.status !== 0) {
    abort("Staged diff has whitespace or conflict-marker errors.");
  }

  const stagedFiles = gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  if (stagedFiles.length === 0) {
    console.log("[pre-commit] No staged files to check.");
    return;
  }

  const unstagedFiles = gitLines(["diff", "--name-only", "--diff-filter=ACMR"]);
  const plan = createCheckPlan(stagedFiles, unstagedFiles);

  if (plan.partialFiles.length > 0) {
    abort([
      "Checked files have both staged and unstaged changes. Stage or stash the unstaged edits first:",
      ...plan.partialFiles.map((file) => `  - ${file}`),
    ].join("\n"));
  }

  const bannedFindings = findBannedTestPatterns(readTestContents(plan.testFiles));
  if (bannedFindings.length > 0) {
    abort([
      "Banned unit-test styling/placement patterns detected:",
      ...bannedFindings.map((finding) => `  - ${finding.file}: ${finding.reason}`),
    ].join("\n"));
  }

  if (plan.lintFiles.length > 0) {
    mustRun("npx", ["eslint", "--max-warnings", "9999", "--", ...plan.lintFiles]);
  }

  for (const file of plan.syntaxFiles) {
    mustRun("node", ["--check", file]);
  }

  if (plan.testFiles.length > 0) {
    mustRun("npx", ["jest", "--runTestsByPath", ...plan.testFiles, "--runInBand", "--coverage=false"]);
  }

  if (plan.relatedSourceFiles.length > 0) {
    mustRun("npx", ["jest", "--findRelatedTests", ...plan.relatedSourceFiles, "--runInBand", "--coverage=false", "--passWithNoTests"]);
  }

  if (plan.widgetBuildTargets.length > 0) {
    runWidgetBuilds(plan.widgetBuildTargets);
  }

  if (plan.shouldMinifyCss) {
    mustRun("npm", ["run", "minify:assets", "--", "css"]);
    stageFiles(CSS_OUTPUTS.filter((file) => GENERATED_FILES.has(file)));
  }

  if (plan.shouldRunGraphify) {
    runGraphify();
  }

  console.log("[pre-commit] Critical checks passed.");
}

main();
