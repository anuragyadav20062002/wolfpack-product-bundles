---
title: Build Process
type: operations
audited: 2026-04-16
sources: CLAUDE.md, scripts/build-widget-bundles.js
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

## Linting

Before every commit, lint modified files:
```bash
npx eslint --max-warnings 9999 <file1> <file2>
```

`--max-warnings 9999` prevents pre-existing warnings (~6500 project-wide) from blocking the check. Fix new **errors** you introduced; leave pre-existing warnings alone.

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
