---
schema_version: 1
id: build-process
title: Build Process
type: operations
status: authoritative
summary: Build, minification, lint, and pre-commit requirements for deployable application and storefront assets.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - operations
systems:
  - asset-pipeline
source_paths:
  - scripts/build-widget-bundles.js
  - scripts/minify-assets.js
related_docs:
  - internal docs/index.md
tags:
  - build
  - storefront-assets
keywords:
  - widget bundles
  - css minification
---

# Build Process

## Widget Bundles

Source files use ES modules. Must be bundled to IIFEs for Shopify extension use.

```bash
npm run build:widgets              # all widgets
npm run build:widgets:full-page    # FPB only
npm run build:widgets:product-page # PDP only
```

### Source → Output

| Source | Output |
|---|---|
| `app/assets/bundle-widget-full-page.js` + shared/template modules | `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` |
| `app/assets/bundle-widget-product-page.js` + shared/template modules | `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` |

**Both source AND bundled files must be committed.**

The widget build inlines shared modules, template config registries, and template method modules before each widget entry file. Template files should export config or method objects; do not reintroduce `installXTemplate` functions or template-specific prototype patching.

Keep split source modules semantically named by responsibility. Mechanical split names such as `chunk-01.js` or `part-01.css` are not acceptable long-term source structure.

## Cart Transform WASM

```bash
cd extensions/bundle-cart-transform-ts && npm run build
```
`dist/` is gitignored — WASM output is NOT committed.

## CSS Size Limit

Shopify enforces **100,000 B** on app block CSS assets.

```bash
wc -c extensions/bundle-builder/assets/*.css
```

Do not fix an oversized file by making source CSS unreadable. Reduce the base asset by deleting unused/conflicting selectors and moving template-specific CSS into separately generated extension assets. Current split assets:

| Base asset | Template assets |
|---|---|
| `bundle-widget-full-page.css` | `bundle-widget-full-page-standard.css`, `bundle-widget-full-page-classic.css`, `bundle-widget-full-page-compact.css`, `bundle-widget-full-page-horizontal.css` |
| `bundle-widget.css` | `bundle-widget-product-page-cascade.css`, `bundle-widget-product-page-cognive.css`, `bundle-widget-product-page-modal.css` |

`scripts/minify-assets.js` validates every generated CSS asset against Shopify's limit.

### Selector minification gotcha

Do not write a descendant selector as `.parent :is(.child-a, .child-b)` in storefront source CSS. The current minifier can remove the descendant combinator and emit `.parent:is(...)`, which changes the selector to target one element matching both sides. Use explicit descendant selectors, or a combinator such as `.parent > :is(...)` when direct-child semantics are correct. Compound selectors such as `.parent:is(.variant-a, .variant-b)` are safe when they intentionally target the same element.

## Linting

Before every commit, lint modified files:
```bash
npx eslint --max-warnings 9999 <file1> <file2>
```

`--max-warnings 9999` prevents pre-existing warnings (~6500 project-wide) from blocking the check. Fix new **errors** you introduced; leave pre-existing warnings alone.

## Pre-Commit Hook

Tracked hooks live in `.githooks/`. Install them with:

```bash
npm run hooks:install
```

`npm install` also runs a warning-only `prepare` installer unless `CI=true` or
`WPB_SKIP_HOOK_INSTALL=1` is set.

The pre-commit hook is staged-file aware. It blocks commits for critical
breakage: staged diff whitespace errors, partially staged checked source files,
ESLint errors on staged source, raw JS syntax errors, banned styling unit-test
patterns, related Jest failures, and stale generated widget/CSS assets when
their source files are staged. It also attempts `npm run graphify:rebuild` and
auto-stages `graphify-out/GRAPH_REPORT.md` plus `graphify-out/graph.json` when
the rebuild succeeds. Local graphify runtime/configuration failures warn only so
developer-specific Python or uv setup does not block unrelated commits.

## Graphify Knowledge Graph

After modifying code files:
```bash
npm run graphify:rebuild
```

The npm wrapper must use the same Python runtime as the installed `graphify`
CLI and git hooks. Prefer the `graphify` executable shebang, then the uv
`graphifyy` tool install. Do not hardcode a user profile path: local uv and
pipx installs are machine-specific, and older graphify runtimes can miss lock
handling, backup behavior, and current output conventions.

`graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` are tracked.
`graphify-out/.graphify_python`, caches, manifests, lock/temp files, dated
protected-output backups, and `graph.html` are generated support artifacts and
should stay ignored.

Keep `graphify-out/` in `.graphifyignore`. Graphify uses `.graphifyignore`
instead of `.gitignore` when present, so the file must also list normal
dependency/build directories such as `node_modules/`, `.git/`, and build
outputs. Do not let graphify ingest its own `GRAPH_REPORT.md` or backup
folders as source input.

Also keep local agent/editor state out of graphify input: `.claude/`,
`.codex/`, `.vscode/`, and Obsidian plugin state under
`Wolfpack: Product Bundles/.obsidian/`.

If ignored, deleted, or generated files were previously scanned, old nodes can
stay in `graph.json` because code-only rebuilds preserve semantic/document
nodes. Prune nodes whose `source_file` is outside live graphify detection before
rebuilding.

If a rebuild warns about invalid `file_type: "concept"` nodes, those are stale
semantic nodes preserved from an older graphify schema. Normalize them to
`document` before rebuilding so validation is clean.
