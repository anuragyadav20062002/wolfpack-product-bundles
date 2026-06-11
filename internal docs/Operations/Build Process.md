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
