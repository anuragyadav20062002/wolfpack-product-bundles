/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  // Files not in tsconfig.json cannot be type-checked — exclude from type-aware
  // linting to avoid "file not included in tsconfig" parsing errors.
  // - app/assets/**    : widget source JS bundled for storefront
  // - extensions/**/*.js : compiled Shopify extension assets
  // - scripts/**       : Node build scripts
  // - *.config.js      : root-level config files (jest, postcss, tailwind)
  ignorePatterns: [
    "app/assets/**",
    "extensions/**/*.js",
    "scripts/**",
    "jest.config.js",
    "postcss.config.js",
    "tailwind.config.js",
  ],
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  globals: {
    shopify: "readonly",
  },

  // ─── Phase 1: typescript-eslint type-aware rules ───────────────────────────
  // Requires parserOptions.project so the TypeScript compiler can resolve types
  // across files and enable the "type-checked" rule set.
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // --- Critical (error): catches silent runtime failures in route handlers ---
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": [
      "error",
      // allow async functions passed as event handlers and JSX callbacks
      { checksVoidReturn: { arguments: false, attributes: false } },
    ],

    // --- Type safety (warn): existing code has widespread `any`; upgrade to
    //     error incrementally as the codebase is cleaned up ---
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",

    // --- Code quality (warn) ---
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    // Pre-existing unused imports/vars are widespread; keep as warn so they
    // don't block CI while the codebase is incrementally cleaned up.
    "@typescript-eslint/no-unused-vars": "warn",

    // ─── Phase 2: eslint-plugin-security ─────────────────────────────────────
    "security/detect-non-literal-regexp": "error",
    "security/detect-object-injection": "warn",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-child-process": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-new-buffer": "error",
    "security/detect-pseudoRandomBytes": "error",

    // ─── Phase 3: eslint-plugin-prisma ───────────────────────────────────────
    "prisma/no-unsafe": "error",

    // ─── Phase 5: eslint-plugin-unicorn (selective) ──────────────────────────
    "unicorn/no-process-exit": "error",
    "unicorn/prefer-node-protocol": "warn",
    "unicorn/no-array-callback-reference": "warn",
  },

  // ─── Phase 4: eslint-import-resolver-typescript ──────────────────────────
  // Teaches eslint-plugin-import (already loaded by Remix config) to resolve
  // TypeScript path aliases (~/...) and type-only imports correctly.
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
  },

  plugins: ["@typescript-eslint", "security", "prisma", "unicorn"],

  overrides: [
    {
      // Tests and the CLI test runner have different runtime semantics:
      // - `it()` / `describe()` from node:test return promises that the
      //   framework consumes — not awaiting them at the call site is intentional
      // - The CLI test runner legitimately uses process.exit()
      files: ["tests/**/*.ts"],
      rules: {
        "@typescript-eslint/no-floating-promises": "off",
        "unicorn/no-process-exit": "off",
      },
    },
  ],
};
