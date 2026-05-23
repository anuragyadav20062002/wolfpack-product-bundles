# Claude Code Development Guidelines

## Core Operating Principles

1. **Ask, do not assume.** If something is unclear, ask before writing a single line. No silent guesses about intent, architecture, or requirements.
2. **Simplest solution first.** Implement the simplest thing that could work. No abstractions or flexibility you did not explicitly request.
3. **Do not touch unrelated code.** If a file or function is not part of the current task, do not modify it even if you think it could be improved.
4. **Flag uncertainty explicitly.** If you are not confident about an approach or technical detail, say so before proceeding. Confidence without certainty causes damage.

---

## 📋 Issue Tracking System

**BEFORE making ANY code changes, commits, or file modifications:**

1. **Create or Update Issue File** — `docs/issues-prod/{issueName}-{number}.md`
2. **Log Progress** — date/time, what changed, why, what's next
3. **Reference in Commit Messages** — `[{issueName}-{number}] type: description`

### Issue File Structure

```markdown
# Issue: [Title]
**Issue ID:** {issueName}-{number}
**Status:** [In Progress | Completed | Blocked]
**Priority:** [🔴 High | 🟡 Medium | 🟢 Low]
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD HH:MM

## Overview
## Progress Log
### YYYY-MM-DD HH:MM - [Action]
- What was done / Files changed / Next steps

## Related Documentation
## Phases Checklist
- [ ] Phase 1
```

### Commit Format

```
[issue-id] type: description

# Types: feat | fix | refactor | docs | style | chore | test
# Example: [full-page-design-improvements-1] fix: Product cards maintain fixed dimensions
```

### Workflow

1. **Before work:** Create/open issue file, add Progress Log entry for what you're about to do.
2. **Before commit:** Update issue file with completed work, update "Last Updated" timestamp.
3. **Commit:** Stage issue file alongside code changes. Use `[issue-id] type: msg` format.

---

## 🚀 Feature Pipeline — Mandatory for New Features

**BEFORE writing any code for a new feature**, invoke the `feature-pipeline` skill.

Stages (must run in order):
1. **BR** — Research + Business Requirement
2. **PO** — Product Owner Requirements + acceptance criteria
3. **Architect** — ADR + file-by-file plan
4. **SDE** — Implementation

**SDE must NOT begin until BR → PO → Architect are complete.**

Skip pipeline for: bug fixes, debugging, single-file refactors, typos, config values, docs-only.

**Decision rule:** "fix/debug/broken" → skip. "add/build/implement/I want/we need" → pipeline mandatory.

---

## 🧪 Test-Driven Development (TDD)

Write tests **before** implementation. Cycle: Red → Green → Refactor.

### Test file locations
```
tests/
├── unit/
│   ├── lib/          ← helpers, utilities
│   ├── services/     ← server services
│   ├── routes/       ← route action/loader functions
│   └── extensions/   ← cart transform, checkout UI
├── integration/      ← multi-layer flows
└── e2e/              ← full request lifecycle
```
File naming: `{module-name}.test.ts`

### What must be tested
- Every exported function in `app/lib/`
- Every auth guard path (authorized, unauthorized, missing env var)
- Every route `action` and `loader` — happy path + error cases
- Any function with conditional branching or security logic

```bash
npm test | npm run test:unit | npm run test:watch | npm run test:coverage
```

TDD does NOT apply to: one-line config changes, CSS-only changes, docs changes, route annotation comments.

### Test Spec Files — Mandatory in TDD Sessions

Create `test-spec/{module-name}.spec.md` alongside every TDD session.

```markdown
# Test Spec: {Module / Feature Name}
**Spec ID:** {module-name}  **Issue:** [{issue-id}]  **Created:** YYYY-MM-DD

## Purpose
## Test Cases
### {TestSuiteName}
| # | Scenario | Input | Expected Output | Notes |
## Acceptance Criteria
- [ ] All listed test cases pass
```

Reference in commit: `[issue-id] test: add unit tests for {module}\nSpec: test-spec/{module-name}.spec.md`

---

## 🚫 Strict Rules

1. ❌ NO commits without updating issue file first
2. ❌ NO commits without proper `[issue-id]` prefix
3. ✅ ALL changes must be logged in progress log
4. ✅ Update issue file BEFORE and AFTER each commit
5. ❌ NO code for new features without completing feature-pipeline first
6. ❌ NEVER run `shopify app deploy` autonomously — see Shopify Deploy Rule
7. ✅ Write tests BEFORE implementation for all new code
8. ✅ Run linter on modified files BEFORE every commit — see Lint Before Commit
9. ❌ NO backwards-compatibility shims or migration hacks — see No Backwards Compatibility Rule
10. ✅ ALWAYS ask about DCP customizability for storefront changes before implementing
11. ✅ CREATE a test spec file in `test-spec/` for every TDD session
12. ❌ NO hardcoded fallback UI copy strings — never fabricate merchant-facing marketing copy
13. ❌ NO unnecessary API fallback chains — use the single correct source per official docs
14. ❌ NEVER commit Chrome DevTools investigation screenshots
15. ❌ NO competitor references in code (`eb`, `skai`, `skailama`, `easybundles`) — docs only

---

## 🧩 Polaris Web Components First Rule

Use Polaris web components (`s-*`) for **all** Admin-embedded app UI. Fall back to custom HTML only when no Polaris component exists.

**Components (polaris-app-home surface):**
- Actions: `s-button`, `s-button-group`, `s-link`, `s-menu`
- Forms: `s-checkbox`, `s-select`, `s-text-field`, `s-text-area`, `s-switch`, `s-number-field`, `s-search-field`, `s-drop-zone`
- Feedback: `s-badge`, `s-banner`, `s-spinner`
- Layout: `s-box`, `s-stack`, `s-grid`, `s-section`, `s-divider`
- Typography: `s-heading`, `s-text`, `s-paragraph`
- Media: `s-icon`, `s-thumbnail`, `s-image`, `s-avatar`
- Overlays: `s-modal`, `s-popover`
- Interactive: `s-clickable`, `s-clickable-chip`, `s-chip`

**Icon names:** `plus`, `delete`, `view`, `upload`, `globe`, `search`, `filter`, `edit`, `info`, `check`, `x`, `duplicate`, `menu-horizontal`, `alert-triangle`, `clock`, `note`, `product`, `arrow-left`, `arrow-right`

**Acceptable custom HTML exceptions:** tab navigation, step chip/pill patterns, keyframe animations, fixed-position overlays, complex grids not achievable with `s-grid`.

Check availability: `mcp__shopify-dev-mcp__learn_shopify_api(api: "polaris-app-home")`

---

## 🎨 DCP Customizability Rule

Any storefront-visible change may need a merchant-facing DCP control:
- User **explicitly says** DCP-customizable → implement DCP control in same issue/commit.
- User **does not mention** DCP → **ask first**: "Should this also have a DCP control?"
- Do NOT assume no DCP needed. Do NOT add DCP controls speculatively.

---

## 🔄 No Backwards Compatibility Rule

**NEVER add backwards-compatibility code.** The app has a "Sync Bundle" feature — merchants re-sync to pick up new defaults.

**Banned patterns:**
- Fallback shims reading old JSON blob fields when new direct columns exist
- Deprecated field mappings in `extractGeneralSettings` / `buildSettingsData`
- Version-detection code that adjusts behavior for old data
- `if (legacyField) use(legacyField) else use(newField)` patterns

**Correct approach:** Add new Prisma columns with sensible defaults. Drop old JSON blob keys. Bump `WIDGET_VERSION` and show a sync prompt banner for breaking changes.

---

## 🔍 Lint Before Commit Rule

```bash
npx eslint --max-warnings 9999 <file1> <file2> ...
# or full project:
npm run lint -- --max-warnings 9999
```

Zero ESLint errors required. Warnings acceptable (pre-existing ~6500 warnings in project). Fix new errors you introduced; leave pre-existing warnings.

---

## 🗺️ App Navigation Map

**MANDATORY:** Update `docs/app-nav-map/APP_NAVIGATION_MAP.md` whenever you:
- Add/rename/remove a route, page, modal, or tab
- Add a new sidebar section to DCP navigation
- Add/change a user flow or add relevant API routes

---

## 🚢 Shopify Deploy Rule

**NEVER run `shopify app deploy` autonomously.** Always stop and prompt:

```
ACTION REQUIRED — Manual deploy needed.
Run in your terminal:
  npm run deploy:prod   ← PROD (wolfpack-product-bundles-4)
  npm run deploy:sit    ← SIT  (wolfpack-product-bundles-sit)
Reason: [brief explanation]
Let me know once it completes.
```

The npm scripts run `scripts/generate-extension-templates.js` first — never call `shopify app deploy` directly.

---

## 🔧 Widget Bundle Build Process

**ALWAYS build after modifying these source files:**

Widget sources → `npm run build:widgets`:
- `app/assets/bundle-widget-components.js`
- `app/assets/bundle-modal-component.js`
- `app/assets/bundle-widget-full-page.js`
- `app/assets/bundle-widget-product-page.js`

SDK sources → `npm run build:sdk`:
- `app/assets/sdk/` (state.js, events.js, config-loader.js, cart.js, validate-bundle.js, get-display-price.js, debug.js, wolfpack-bundles.js)
- Output: `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`

**Build commands:**
```bash
npm run build:widgets           # all widget bundles + minify
npm run build:widgets:full-page
npm run build:widgets:product-page
npm run build:sdk
```

**Forgetting to build = changes won't appear in the storefront.**

---

## 🗜️ Asset Minification

Always edit raw source CSS files, then run minifier:

Raw sources:
- `app/assets/widgets/full-page-css/bundle-widget-full-page.css`
- `app/assets/widgets/product-page-css/bundle-widget.css`

Minified output (deploy target):
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `extensions/bundle-builder/assets/bundle-widget.css`

| Change type | Command |
|---|---|
| JS bundle changes | `npm run build:widgets` |
| CSS-only changes | `npm run minify:assets css` |
| Both CSS and JS | `npm run build:widgets && npm run minify:assets css` |
| All assets | `npm run minify:assets` |

Script exits non-zero if any CSS file exceeds Shopify's **100,000 B** app-block asset limit.

---

## 🔢 Widget Version Rule

Increment `WIDGET_VERSION` in `scripts/build-widget-bundles.js` before every widget deploy.

| Change type | Version bump |
|---|---|
| Bug fix | PATCH x.y.Z |
| New feature (backwards-compatible) | MINOR x.Y.z |
| Breaking change / redesign | MAJOR X.y.z |

**Steps before every widget deploy:**
1. Increment `WIDGET_VERSION`
2. `npm run build:widgets`
3. `npm run minify:assets css`
4. Commit source + bundled files
5. Run `npm run deploy:prod` or `npm run deploy:sit`
6. Wait 2–10 min for Shopify CDN cache propagation

Verify live version: `console.log(window.__BUNDLE_WIDGET_VERSION__)` in DevTools console.

Shopify CDN cache-busting: the `?v=HASH` param on `asset_url` only changes on `shopify app deploy`. Custom query params are NOT on the CDN allowlist.

---

## 🚨 Do Not Touch — Bundle Config Loading (FPB Widget)

**NEVER modify the bundle config loading priority order in `bundle-widget-full-page.js`.**

Two-stage load strategy:
1. **Stage 1 — Metafield cache (primary):** Liquid block writes config into `data-bundle-config` attribute. Widget reads on init — zero network, instant first paint.
2. **Stage 2 — Proxy API fallback:** If metafield absent/empty/malformed, falls back to `GET /apps/product-bundles/api/bundle/{id}.json` with single retry after 3s for `503`/`504` (Render cold-starts).

**Rules:**
- ❌ Do NOT remove or reorder the `data-bundle-config` check — must run before proxy fetch
- ❌ Do NOT remove `503`/`504` retry logic — Render cold-starts are 3–10s
- ❌ Do NOT add a third source between Stage 1 and Stage 2
- ✅ If bundle config structure changes, update server writer AND widget parser together

**Relevant files:**
- Widget: `app/assets/bundle-widget-full-page.js` — `loadBundleConfig()` (~line 325)
- Liquid: `extensions/bundle-builder/blocks/bundle-full-page.liquid` — `data-bundle-config`
- Server: `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts`

---

## 🔐 Test Store Access

- Store: `wolfpack-store-test-1.myshopify.com`
- Default storefront password: `1`

## 🧭 Chrome DevTools App Verification

Access embedded app via Shopify Admin URL:
```
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/...
```
Do NOT use Cloudflare tunnel URLs directly — they redirect to `/auth/login`.

---

## 🐙 GitHub Tasks — Always Use `gh` CLI

| Task | Command |
|---|---|
| Create PR | `gh pr create` |
| View PRs | `gh pr list` / `gh pr view` |
| Merge PR | `gh pr merge` |
| Create issue | `gh issue create` |
| View issues | `gh issue list` / `gh issue view` |
| Check CI | `gh run list` / `gh run view` |
| Remote branches | `gh api repos/{owner}/{repo}/branches` |
| Commit SHA | `gh api repos/{owner}/{repo}/commits/{ref}` |
| Comment | `gh pr comment` / `gh issue comment` |

---

## graphify

Knowledge graph at `graphify-out/`, internal docs vault at `internal docs/`.

### Mandatory Search Order

1. **`internal docs/`** — start here for Cart Transform, Pricing, DB schema, Shopify API limits, widget architecture, deployment.
2. **`graphify-out/GRAPH_REPORT.md`** — god nodes and community structure.
3. **`graphify-out/wiki/`** — node-level detail.
4. **Raw source files** — ONLY when vault and graph don't cover the detail.

❌ Do NOT open raw `.ts`/`.js`/`.liquid`/`.prisma` files speculatively.

### Keeping the Vault Current

If you learn something about Shopify API behaviour, gotchas, data model details, or build rules that's NOT in `internal docs/` → write/update the note and add link in `internal docs/index.md`.

### Graph-Assisted Debugging & RCA

1. Find affected node's community in `GRAPH_REPORT.md`.
2. Run `graphify path "NodeA" "NodeB"` to trace relationship chains.
3. Check **Surprising Connections** and **Hyperedges** sections.

```bash
/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "ComponentA" "ComponentB"
/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify query "what depends on X?"
```

### Impact Analysis — Mandatory Before Every Change

1. Identify god nodes in `GRAPH_REPORT.md` — changes touching these require extra care.
2. Find all nodes depending on what you're changing.
3. Document blast radius in **commit message body** and **PR description**:

```
[issue-id] type: short description

Impact: touches <CommunityName>, depends on <GodNode>
Affected: <file1>, <file2>
Tested by: <test-file(s)>
```

PR Impact Analysis section:
```markdown
## Impact Analysis
- **Communities touched**: [list]
- **God nodes affected**: [list]
- **Downstream risk**: [what could break]
- **Test coverage**: [test files]
```

### Keeping the Graph Current

After modifying code files, run:
```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## 🎯 EB Implementation Reference — Grounded Truth for Porting

When implementing any feature that mirrors EB behaviour — step/category data shapes, admin API payloads, template IDs, storefront runtime globals, cart add format, box selection enforcement, or text config — **consult `internal docs/EB Implementation Reference.md` first.**

This doc is the distilled, topic-organized reference captured from a live authenticated EB investigation. Do NOT guess EB's data shapes — they are fully documented there.

### What it covers

| Topic | What's documented |
|---|---|
| Admin API endpoints | All FPB + PPB create/update/save paths |
| FPB step/category payload | Complete JSON shape including `categoryType`, product ID arrays, collection GIDs |
| PPB step/category payload | Complete JSON shape including `conditions`, `displayVariantsAsIndividualProducts`, `displayVariantsAsSwatches` |
| Discount configuration | `discountConfiguration` + compact `metafieldData.discount` mirror |
| Default/preselected products | `defaultProductsData` full shape |
| Template system | FPB two-field (`bundleDesignTemplate` + `bundleDesignPresetId`) — all 4 presets confirmed; PPB two-field (`bundleDesignTemplate` + `templateId`) — all 4 templates confirmed |
| Storefront globals | FPB `window.gbb.*` + `stepsConfigurationData`; PPB `window.gbbMix.*` + `mixAndMatchBundleSettings` (25+ fields) |
| Cart add format | FPB JSON + PPB multipart; `_easyBundle:OfferId` format; `bundle_details` metafield accumulation |
| Box selection | `gbbBoxSelection.state` schema; ATC enforcement logic (decompiled); DOM structure |
| Text config | `bundleTextConfig.bundleSummary.{title,subTitle}` — confirmed only two fields |
| Collection pagination | Batch `nodes(ids:[...])` architecture — NOT cursor-based |
| Wolfpack DB alignment | Field-by-field mapping from EB payload → Wolfpack model |

### Mandatory search order for EB porting questions

1. `internal docs/EB Implementation Reference.md` — confirmed facts, exact JSON shapes
2. `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` — full evidence record with raw payloads, decompiled JS, and DOM captures
3. Only then: live DevTools investigation if the reference doc has a gap

❌ Do NOT assume or fabricate EB data shapes — they are documented.
❌ Do NOT re-investigate facts already in the reference doc.

---

## 📱 Storefront UI Audit — Desktop + Mobile

When auditing storefront UI, test **both viewports**:
1. Desktop screenshot (1280×800+)
2. Mobile screenshot (emulate iPhone 14, 390×844)
3. Report findings for both

Required for: "audit the storefront", "check the UI", post-deploy verification, appearance bug reports.

---

## 🔬 Competitor Parity Audit Rule

For any "parity", "compare", "match competitor" request — conduct a full audit before writing code.

**Parity means:** pixel-level placement, visual hierarchy, spacing (measured via `getComputedStyle`), UX interactions, edge cases.

**Audit workflow:**
1. Open competitor in Chrome DevTools MCP, take full-page screenshot
2. Use `take_snapshot` for DOM structure, `evaluate_script` for computed styles
3. Interact (click, hover, toggle) and screenshot each state
4. If CORS blocks `evaluate_script` — use `take_snapshot` + keyboard interactions
5. Document every gap (placement, size, color, spacing, behavior)
6. Implement only after audit is complete

❌ Do NOT estimate spacing — measure it. ❌ Do NOT skip mobile for storefront parity. ❌ Do NOT implement partial parity.

---

## 🖱️ Chrome DevTools — Shopify Admin Iframe Interaction

The Shopify Admin embeds the app in a cross-origin OOPIF — `contentDocument` is null from the outer page.

### PRIMARY METHOD — Keyboard Tab Navigation

Try Tab navigation BEFORE `evaluate_script`. The CDP accessibility tree traverses cross-origin iframes.

1. `take_snapshot()` — find interactive elements (button, textbox, checkbox) inside iframe
2. `click(uid: "...")` — click a safe interactive element to bring focus into iframe
3. `press_key(key: "Tab")` / `press_key(key: "Shift+Tab")` — navigate to target
4. `press_key(key: "Enter")` (buttons/links) or `press_key(key: "Space")` (checkboxes/toggles) — activate
5. `take_screenshot()` — verify result

If nav items are `StaticText` nodes (no ARIA role), use arrow keys or fall back to CDP target method.

### FALLBACK — `evaluate_script` via CDP target

Use when the app's own iframe registers as a separate CDP target in `list_pages`.

1. `list_pages()` — find iframe's pageId
2. `select_page(pageId: "...")` — switch to iframe target
3. `evaluate_script(script: "document.querySelector('...').click()")` — interact
4. `take_screenshot()` — verify
5. `select_page(pageId: "<admin-page-id>")` — switch back

Always `select_page` to the **iframe target** before `evaluate_script`. For third-party CORS-blocked iframes, use Tab navigation instead.

---

**Last Updated:** 2026-05-22
**Author:** Aditya Awasthi
