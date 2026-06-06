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
| `app/assets/bundle-widget-full-page.js` + `bundle-widget-components.js` | `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` |
| `app/assets/bundle-widget-product-page.js` + `bundle-widget-components.js` | `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` |

**Both source AND bundled files must be committed.**

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

If over limit, strip block comments:
```bash
python3 -c "
import re, sys
f = sys.argv[1]
c = open(f).read()
c = re.sub(r'[ \t]*/\*(?![^\n]*\{|\s*[\w\-#.:>~+\[\]@]).*?\*/[ \t]*\n', '', c, flags=re.DOTALL)
c = re.sub(r'^[ \t]*/\*[^*\n]*(?:\*(?!/)[^*\n]*)*\*/[ \t]*$\n?', '', c, flags=re.MULTILINE)
c = re.sub(r'\n{3,}', '\n\n', c)
open(f, 'w').write(c)
print('Done:', len(c.encode()), 'bytes')
" extensions/bundle-builder/assets/bundle-widget-full-page.css
```

## Linting

Before every commit, lint modified files:
```bash
npx eslint --max-warnings 9999 <file1> <file2>
```

`--max-warnings 9999` prevents pre-existing warnings (~6500 project-wide) from blocking the check. Fix new **errors** you introduced; leave pre-existing warnings alone.

## Graphify Knowledge Graph

After modifying code files:
```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```
