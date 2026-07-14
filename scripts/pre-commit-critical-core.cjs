const path = require("node:path");

const GENERATED_PREFIXES = [
  "build/",
  "coverage/",
  "dist/",
  "graphify-out/",
  "node_modules/",
  ".shopify/",
  "extensions/bundle-checkout-ui/dist/",
];

const GENERATED_FILES = new Set([
  "extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js",
  "extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js",
  "extensions/bundle-builder/assets/wolfpack-bundles-sdk.js",
  "extensions/bundle-builder/assets/bundle-widget-full-page.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-standard.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-classic.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-compact.css",
  "extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css",
  "extensions/bundle-builder/assets/bundle-widget.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css",
  "extensions/bundle-builder/assets/bundle-widget-product-page-modal.css",
]);

const LINT_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const SYNTAX_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;

function normalizePath(file) {
  return String(file || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

function unique(files) {
  return [...new Set(files.map(normalizePath).filter(Boolean))].sort();
}

function isGeneratedPath(file) {
  const normalized = normalizePath(file);
  return GENERATED_FILES.has(normalized)
    || GENERATED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isLintable(file) {
  const normalized = normalizePath(file);
  return LINT_EXTENSIONS.has(path.posix.extname(normalized)) && !isGeneratedPath(normalized);
}

function isSyntaxCheckable(file) {
  const normalized = normalizePath(file);
  if (!SYNTAX_EXTENSIONS.has(path.posix.extname(normalized))) return false;
  if (isGeneratedPath(normalized)) return false;

  return normalized.startsWith("scripts/")
    || normalized.startsWith("app/assets/")
    || normalized.startsWith("extensions/");
}

function isTestFile(file) {
  return TEST_FILE_RE.test(normalizePath(file));
}

function isRelatedTestSource(file) {
  const normalized = normalizePath(file);
  if (isGeneratedPath(normalized) || isTestFile(normalized)) return false;
  if (![".js", ".jsx", ".ts", ".tsx"].includes(path.posix.extname(normalized))) return false;

  return normalized.startsWith("app/")
    || normalized.startsWith("extensions/")
    || normalized.startsWith("scripts/");
}

function isCheckedForPartialStaging(file) {
  const normalized = normalizePath(file);
  return isLintable(normalized)
    || isSyntaxCheckable(normalized)
    || isRelatedTestSource(normalized)
    || normalized.startsWith("app/assets/widgets/")
    || normalized.startsWith("app/assets/sdk/")
    || normalized.startsWith("scripts/");
}

function affectsFullPageWidget(file) {
  const normalized = normalizePath(file);
  return normalized === "app/assets/bundle-widget-full-page.js"
    || normalized === "app/assets/bundle-modal-component.js"
    || normalized.startsWith("app/assets/widgets/full-page/")
    || normalized.startsWith("app/assets/widgets/shared/");
}

function affectsProductPageWidget(file) {
  const normalized = normalizePath(file);
  return normalized === "app/assets/bundle-widget-product-page.js"
    || normalized.startsWith("app/assets/widgets/product-page/")
    || normalized.startsWith("app/assets/widgets/shared/");
}

function affectsSdk(file) {
  const normalized = normalizePath(file);
  return normalized.startsWith("app/assets/sdk/");
}

function affectsWidgetBuildScript(file) {
  return normalizePath(file) === "scripts/build-widget-bundles.js";
}

function affectsWidgetCss(file) {
  const normalized = normalizePath(file);
  return normalized.startsWith("app/assets/widgets/full-page-css/")
    || normalized.startsWith("app/assets/widgets/product-page-css/")
    || normalized === "scripts/minify-assets.js"
    || normalized.startsWith("scripts/minify-assets/");
}

function shouldRunGraphifyFor(file) {
  const normalized = normalizePath(file);
  if (isGeneratedPath(normalized)) return false;
  if (normalized.startsWith(".githooks/")) return false;

  return [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".css",
    ".md",
    ".json",
    ".prisma",
    ".liquid",
  ].includes(path.posix.extname(normalized));
}

function createCheckPlan(stagedFilesInput, unstagedFilesInput = []) {
  const stagedFiles = unique(stagedFilesInput);
  const unstagedFiles = new Set(unique(unstagedFilesInput));
  const widgetBuildTargets = new Set();

  for (const file of stagedFiles) {
    if (affectsWidgetBuildScript(file)) {
      widgetBuildTargets.add("all");
      continue;
    }
    if (affectsFullPageWidget(file)) widgetBuildTargets.add("full-page");
    if (affectsProductPageWidget(file)) widgetBuildTargets.add("product-page");
    if (affectsSdk(file)) widgetBuildTargets.add("sdk");
  }

  if (widgetBuildTargets.has("all")) {
    widgetBuildTargets.clear();
    widgetBuildTargets.add("all");
  }

  return {
    stagedFiles,
    lintFiles: stagedFiles.filter(isLintable),
    syntaxFiles: stagedFiles.filter(isSyntaxCheckable),
    testFiles: stagedFiles.filter(isTestFile),
    relatedSourceFiles: stagedFiles.filter(isRelatedTestSource),
    partialFiles: stagedFiles.filter((file) => unstagedFiles.has(file) && isCheckedForPartialStaging(file)),
    widgetBuildTargets: [...widgetBuildTargets].sort(),
    shouldMinifyCss: stagedFiles.some(affectsWidgetCss),
    shouldRunGraphify: stagedFiles.some(shouldRunGraphifyFor),
  };
}

function findBannedTestPatterns(fileContentsByPath) {
  const findings = [];
  for (const [file, content] of Object.entries(fileContentsByPath)) {
    const normalized = normalizePath(file);
    if (!isTestFile(normalized)) continue;

    if (/(?:^|[-_.])(layout|ui-contract|parity-contract|shell-layout|admin-layout)\.test\./.test(path.posix.basename(normalized))) {
      findings.push({
        file: normalized,
        reason: "layout/ui-contract test filename is banned for unit tests",
      });
    }

    if (/readFileSync\([\s\S]{0,160}\.(?:module\.)?css['"`]/.test(content)) {
      findings.push({
        file: normalized,
        reason: "CSS source assertions are banned in unit tests",
      });
    }

    if (/expect\([\s\S]{0,120}\)\.toContain\([\s\S]{0,120}(?:className|styles\.|grid-template-columns|font-size|padding|margin|width:|height:|border-radius|background:|color:)/.test(content)) {
      findings.push({
        file: normalized,
        reason: "className/style source assertion is banned in unit tests",
      });
    }

    if (/source\.indexOf\([\s\S]{0,120}\)\)\.toBeLessThan\([\s\S]{0,120}source\.indexOf/.test(content)) {
      findings.push({
        file: normalized,
        reason: "source order assertions are banned for UI placement tests",
      });
    }
  }

  return findings;
}

function isGraphifyConfigurationFailure(output) {
  return /Graphify rebuild failed with/.test(output)
    || /Failed to start graphify rebuild/.test(output)
    || /No module named ['"]?graphify/.test(output)
    || /ModuleNotFoundError/.test(output)
    || /GRAPHIFY_PYTHON/.test(output)
    || /runtime selection issue/.test(output)
    || /Operation not permitted/.test(output)
    || /ENOENT/.test(output);
}

module.exports = {
  GENERATED_FILES,
  createCheckPlan,
  findBannedTestPatterns,
  isGeneratedPath,
  isGraphifyConfigurationFailure,
  normalizePath,
};
