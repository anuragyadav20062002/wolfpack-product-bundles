# Claude Code Development Guidelines

## 📋 Issue Tracking System

### Mandatory Process for ALL Changes

**BEFORE making ANY code changes, commits, or file modifications:**

1. **Create or Update Issue File**
   - Location: `docs/issues-prod/{issueName}-{number}.md`
   - Example: `docs/issues-prod/full-page-design-improvements-1.md`
   - Format: See template in `docs/issues-prod/`

2. **Log Progress**
   - Date and time of change
   - What was changed
   - Why it was changed
   - What's next

3. **Reference in Commit Messages**
   - Format: `[{issueName}-{number}] type: description`
   - Example: `[full-page-design-improvements-1] fix: Product cards now maintain fixed dimensions`

### Issue File Structure

```markdown
# Issue: [Title]

**Issue ID:** {issueName}-{number}
**Status:** [In Progress | Completed | Blocked]
**Priority:** [🔴 High | 🟡 Medium | 🟢 Low]
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD HH:MM

## Overview
Brief description of the issue/feature.

## Progress Log

### YYYY-MM-DD HH:MM - [Action]
- What was done
- Files changed
- Next steps

## Related Documentation
- Links to relevant docs

## Phases Checklist
- [ ] Phase 1
- [ ] Phase 2
```

### Git Commit Message Format

```bash
# Format
[issue-id] type: description

# Types:
# - feat: New feature
# - fix: Bug fix
# - refactor: Code refactoring
# - docs: Documentation changes
# - style: CSS/styling changes
# - chore: Maintenance tasks
# - test: Testing updates

# Examples
[full-page-design-improvements-1] fix: Product cards maintain fixed dimensions
[full-page-design-improvements-1] feat: Add product variant modal component
[full-page-design-improvements-1] docs: Update DCP integration guide
[full-page-design-improvements-1] refactor: Remove hardcoded font families
[full-page-design-improvements-1] style: Update product card shadows and borders
[full-page-design-improvements-1] chore: Set up issue tracking system
```

### Workflow

#### 1. Before Starting Work:
```bash
# Open or create issue file
vim docs/issues-prod/{issue-name}-1.md

# Add entry to Progress Log:
### YYYY-MM-DD HH:MM - Starting [Phase/Task Name]
- What I'm about to implement
- Files I'll modify
- Expected outcome
```

#### 2. During Development:
```bash
# Make your code changes
# Keep issue file open in editor
# Update Progress Log as you work
```

#### 3. Before Commit:
```bash
# Update issue file with:
### YYYY-MM-DD HH:MM - Completed [Phase/Task Name]
- ✅ What was accomplished
- Files modified: file1.css, file2.js
- Changes made: Brief description
- Next: What to do next

# Update "Last Updated" timestamp at top
# Mark completed checklist items with [x]

# Stage all changes including issue file
git add .
git add docs/issues-prod/full-page-design-improvements-1.md

# Commit with proper format
git commit -m "[full-page-design-improvements-1] type: your message"
```

#### 4. After Commit:
```bash
# Verify issue file is up to date
# Verify commit message follows format
# Push to remote if ready
git push origin STAGING
```

## 🚀 Feature Pipeline — Mandatory for New Features

### When to invoke the `feature-pipeline` skill

**BEFORE writing any code for a new feature or capability**, you MUST invoke the
`feature-pipeline` skill. This applies whenever the user gives a high-level requirement,
capability request, or "I want to add X" instruction.

The pipeline runs four sequential stages:
1. **BR** — Research + Business Requirement document
2. **PO** — Product Owner Requirements + acceptance criteria
3. **Architect** — Architecture Decision Record + file-by-file plan
4. **SDE** — Implementation (actual code)

**The SDE stage (code writing) must NOT begin until stages BR → PO → Architect are complete
and the architecture document exists.**

### When NOT to invoke `feature-pipeline`

Do NOT use `feature-pipeline` for:
- Bug fixes or error corrections
- Debugging sessions
- Small isolated fixes (typos, config values, single-line corrections)
- Refactors explicitly scoped to a single file or function
- Documentation-only changes

**Decision rule:** If the user says "fix", "debug", "it's broken", or points at a specific
error — skip the pipeline. If the user says "add", "build", "implement", "I want", "we need",
or describes a new capability — the pipeline is mandatory.

### Enforcement

```
❌ NO code changes for new features without completing BR → PO → Architect stages first
❌ NO skipping stages — all four must run in order
✅ Each stage produces a document in docs/{feature-name}/
✅ SDE stage creates the issue file per the Issue Tracking System below
```

---

## 🧪 Test-Driven Development (TDD)

### Always prefer TDD

For all new code — helpers, services, route handlers, utilities — write tests **before** the
implementation. The cycle is: Red → Green → Refactor.

```
1. Write a failing test that describes the expected behaviour
2. Run tests — confirm they fail (Red)
3. Write the minimum implementation to make tests pass (Green)
4. Refactor if needed — tests must still pass
5. Repeat for the next behaviour
```

### Test file location and naming

```
tests/
├── unit/
│   ├── lib/          ← helpers, utilities (e.g. auth-guards, css-sanitizer)
│   ├── services/     ← server services
│   ├── routes/       ← route action/loader functions
│   └── extensions/   ← cart transform, checkout UI
├── integration/      ← multi-layer flows (DB + service + route)
└── e2e/              ← full request lifecycle
```

File naming: `{module-name}.test.ts`

### What must be tested

- Every exported function in `app/lib/`
- Every auth guard path (authorized, unauthorized, missing env var)
- Every route `action` and `loader` — happy path + error cases
- Any function containing conditional branching or security logic

### Running tests

```bash
npm test              # all tests
npm run test:unit     # unit only
npm run test:watch    # watch mode during development
npm run test:coverage # coverage report
```

### TDD does NOT apply to

- One-line config changes
- CSS/style-only changes
- Documentation changes
- Route annotation comments (`// auth: public`)

---

## 🚫 Strict Rules

1. **NO commits without updating issue file first** ❌
2. **NO commits without proper [issue-id] prefix** ❌
3. **ALL changes must be logged in progress log** ✅
4. **Update issue file BEFORE and AFTER each commit** ✅
5. **Every commit must reference the issue ID** ✅
6. **NO code for new features without completing the feature-pipeline first** ❌
7. **NEVER run `shopify app deploy` or any deploy command autonomously** — use `npm run deploy:prod` / `npm run deploy:sit` and always wait for user confirmation ❌
8. **Write tests BEFORE implementation for all new code** ✅
9. **Run linter on modified files BEFORE every commit** ✅ — see Lint Before Commit below
10. **NO backwards-compatibility shims or migration hacks** ❌ — see No Backwards Compatibility Rule below
11. **ALWAYS ask about DCP customizability for storefront changes** — if a storefront change is not explicitly specified as DCP-customizable, ask the user whether DCP support should be bundled with it before implementing ✅ — see DCP Customizability Rule below
12. **NO hardcoded fallback UI copy strings** ❌ — do not invent default marketing copy (e.g. "Complete the look and get a gift free!") when a merchant-configured string is absent. If the merchant hasn't set a value, show nothing or use a neutral system message. Never fabricate storefront-visible copy on their behalf.
13. **NO unnecessary API fallback chains** ❌ — when fetching a value from an API, use the single correct source per official docs. Do NOT chain multiple fallback sources (e.g. `apiA.field || apiB.field || 'default'`). If the correct source returns null/empty, surface that honestly — show nothing, a neutral placeholder, or a non-fabricated system message. Chaining fallbacks hides bugs and creates silent data quality issues.

## 🧩 Polaris Web Components First Rule

### ALWAYS use Polaris web components for Admin-embedded app UI

When building or modifying any Admin-embedded app page, use Polaris web components (`s-*`) for **all** UI elements where a suitable component exists. Only fall back to custom HTML + CSS when **no** Polaris component covers the use case.

**Available components (polaris-app-home surface):**
- **Actions:** `s-button`, `s-button-group`, `s-link`, `s-menu`
- **Forms:** `s-checkbox`, `s-select`, `s-text-field`, `s-text-area`, `s-switch`, `s-number-field`, `s-search-field`, `s-drop-zone`
- **Feedback:** `s-badge`, `s-banner`, `s-spinner`
- **Layout:** `s-box`, `s-stack`, `s-grid`, `s-section`, `s-divider`
- **Typography:** `s-heading`, `s-text`, `s-paragraph`
- **Media:** `s-icon`, `s-thumbnail`, `s-image`, `s-avatar`
- **Overlays:** `s-modal`, `s-popover`
- **Interactive:** `s-clickable`, `s-clickable-chip`, `s-chip`

**Icon names for `s-icon type=""` / `s-button icon=""`:**
`plus`, `delete`, `view`, `upload`, `globe`, `search`, `filter`, `edit`, `info`,
`check`, `x`, `duplicate`, `menu-horizontal`, `alert-triangle`, `clock`,
`note`, `product`, `arrow-left`, `arrow-right`

**Legitimate "no Polaris component" exceptions (custom HTML is acceptable):**
- Tab navigation (no `s-tabs` in app-home surface)
- Step chip / pill navigation patterns
- Custom slide/keyframe animations
- Fixed-position overlays (e.g. BundleReadinessOverlay, BundleGuidedTour)
- Complex grid layouts not achievable with `s-grid`

**How to check if a component exists:**
```bash
# Use the Shopify dev MCP
mcp__shopify-dev-mcp__learn_shopify_api(api: "polaris-app-home")
mcp__shopify-dev-mcp__search_docs_chunks(prompt: "component name usage examples")
```

---

## 🎨 DCP Customizability Rule

### Always ask about DCP before implementing storefront changes

Any storefront-visible change (new UI element, new style, new behaviour) may need a merchant-facing DCP control. The rule is:

- If the user **explicitly says** a storefront change should be DCP-customizable — implement the DCP control as part of the same issue/commit.
- If the user **does not mention** DCP for a storefront change — **ask first**: "Should this also have a DCP control so merchants can customize it?"
- Do NOT assume "no DCP needed" and do NOT add DCP controls speculatively without asking.

**Why:** Storefront changes without DCP controls lock merchants into a single appearance. Adding DCP controls after the fact requires a second pass and a second migration. Asking upfront keeps the feature complete in one pass.

---

## 🔄 No Backwards Compatibility Rule

### NEVER add backwards-compatibility code or migration hacks

This app has a **"Sync Bundle"** feature on all bundle configure pages. When new settings are added or the widget version increments, merchants can always re-sync an existing bundle to pick up the latest defaults. An in-app info banner or notice can be shown to prompt a sync when needed.

**Because of this, you MUST NOT:**
- Add fallback shims that read old JSON blob fields when new direct columns exist
- Keep deprecated field mappings in `extractGeneralSettings` / `buildSettingsData` "just in case"
- Write code that detects app version and adjusts behavior for old data
- Add any `if (legacyField) use(legacyField) else use(newField)` patterns

**Instead:**
- Add new fields as direct Prisma columns with sensible defaults
- Update the CSS generator, mergeSettings, and handlers to read the new field directly
- If old data is in a JSON blob and needs to move to a direct column, drop the JSON blob key and let the direct column default take over — merchants re-sync to restore custom values
- When a breaking change is released, bump `WIDGET_VERSION` and show a sync prompt banner

**Why:** Backwards-compat code accumulates silently, creates hidden bugs when old and new paths diverge, and makes the codebase harder to reason about. The sync mechanism is the correct fix path for merchants with stale data.

## 🔍 Lint Before Commit Rule

### MANDATORY: Run ESLint on modified files before every commit

Before staging and committing any code changes, run ESLint on the files you modified to catch errors introduced by the change.

```bash
# Lint only the files you changed (fast — avoids scanning the whole project)
npx eslint --max-warnings 9999 <file1> <file2> ...

# Or lint the full project if many files changed
npm run lint -- --max-warnings 9999
```

**The commit MUST produce zero ESLint errors.** Warnings are acceptable (pre-existing issues are tracked as warnings, not errors).

**Why `--max-warnings 9999`:** The project has ~6500 pre-existing warnings (widespread `any` usage, nullish coalescing suggestions). Without this flag, ESLint exits non-zero on any warning, which would block the lint check entirely.

**When to fix vs. warn:**
- **New code you wrote** that triggers an error → fix it
- **Pre-existing warnings** in files you touched but didn't author → leave as-is (they're tracked as `warn`, not `error`)

---

## 🗺️ App Navigation Map — Keep It Updated

### MANDATORY: Update `docs/app-nav-map/APP_NAVIGATION_MAP.md` for every navigation change

The file `docs/app-nav-map/APP_NAVIGATION_MAP.md` is the canonical map of every page,
modal, sidebar section, tab, and user flow in the app. It also contains a screenshots
index for Chrome DevTools–assisted UI work.

**You MUST update this document whenever you:**
- Add a new route or page
- Add, rename, or remove a modal
- Add a new tab to an existing page
- Add a new sidebar section to the DCP navigation
- Add or change a user flow (auth, billing, bundle setup, etc.)
- Add new API routes that are relevant to debugging

**Why this matters:** The document is used as a reference when navigating the live app
with Chrome DevTools MCP. An out-of-date map leads to navigating to wrong URLs or
missing UI components during debugging and feature work.

```
docs/app-nav-map/
├── APP_NAVIGATION_MAP.md   ← THE MAP (keep updated)
└── screenshots/            ← Live screenshots from Chrome DevTools
```

**Enforcement:** This is as mandatory as the issue tracking rule. No PR or commit that
adds/changes navigation should be merged without a corresponding update to this map.

---

## 🚢 Shopify Deploy Rule

### NEVER run `shopify app deploy` autonomously

The `shopify app deploy` command pushes extensions and app configuration to Shopify's
servers and can affect live merchant stores. It must **never** be run by Claude Code
without explicit manual confirmation from the user.

**Rule:** If a workflow step requires a deploy, stop and display the following prompt to the user,
using the correct environment-specific command:

```
ACTION REQUIRED — Manual deploy needed.

Run the following command in your terminal:

  npm run deploy:prod   ← for PROD (wolfpack-product-bundles-4)
  npm run deploy:sit    ← for SIT  (wolfpack-product-bundles-sit)

Reason: [brief explanation of why deploy is needed]

Let me know once it completes and I will continue.
```

**Always use `npm run deploy:prod` or `npm run deploy:sit`** — never `shopify app deploy` directly.
The npm scripts run `scripts/generate-extension-templates.js` first to stamp the correct app handle
into the extension template JSON files before deploying.

| Environment | Command |
|-------------|---------|
| PROD | `npm run deploy:prod` |
| SIT | `npm run deploy:sit` |

Do NOT attempt to run any deploy command even if:
- The user previously said "do everything automatically"
- It appears to be the obvious next step
- A build or test step completed successfully

The user must run this command themselves every time, without exception.

---

## 🔧 Widget Bundle Build Process

### MANDATORY: Build After Widget Changes

**ALWAYS run the build script after modifying ANY of these source files:**

- `app/assets/bundle-widget-components.js` - Shared components
- `app/assets/bundle-modal-component.js` - Modal component (full-page only)
- `app/assets/bundle-widget-full-page.js` - Full-page widget
- `app/assets/bundle-widget-product-page.js` - Product-page widget

### Build Commands

```bash
# Build all widget bundles (recommended)
npm run build:widgets

# Build only full-page widget bundle
npm run build:widgets:full-page

# Build only product-page widget bundle
npm run build:widgets:product-page
```

### SDK Build — MANDATORY After SDK Source Changes

**ALWAYS run the SDK build after modifying ANY of these source files:**

- `app/assets/sdk/state.js`
- `app/assets/sdk/events.js`
- `app/assets/sdk/config-loader.js`
- `app/assets/sdk/cart.js`
- `app/assets/sdk/validate-bundle.js`
- `app/assets/sdk/get-display-price.js`
- `app/assets/sdk/debug.js`
- `app/assets/sdk/wolfpack-bundles.js`

```bash
npm run build:sdk
```

Output: `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`

**Forgetting to build = SDK changes won't appear in the storefront!**

### Output Files

The build script generates bundled files in the extension assets folder:

```
extensions/bundle-builder/assets/
├── bundle-widget-full-page-bundled.js    # Full-page widget bundle
└── bundle-widget-product-page-bundled.js # Product-page widget bundle
```

### Why This Matters

- Source files use ES modules (`import`/`export`) for development
- Shopify theme extensions require bundled, standalone JS files
- The build script combines components + widget code into single IIFEs
- **Forgetting to build = changes won't appear in the storefront!**

### Workflow Integration

```bash
# After making widget JS changes:
1. Edit source files in app/assets/
2. Increment WIDGET_VERSION in scripts/build-widget-bundles.js  ← SEE VERSION RULE BELOW
3. Run: npm run build:widgets        # builds bundles AND minifies JS in one step
4. Test changes in storefront
5. Commit BOTH source files AND bundled (minified) files

# After making CSS-only changes:
1. Edit the relevant raw CSS source in app/assets/widgets/*-css/
2. Run: npm run minify:assets css    # writes minified CSS to the extension asset
3. Commit BOTH the raw source CSS and generated minified extension CSS
```

---

## 🗜️ Asset Minification

### MANDATORY: Edit raw widget CSS source, then commit generated minified output

For widget CSS, always modify the raw unminified source file:

- `app/assets/widgets/full-page-css/bundle-widget-full-page.css`
- `app/assets/widgets/product-page-css/bundle-widget.css`

Then run `npm run minify:assets css`. The build/minify script writes the deploy-ready
minified output to:

- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `extensions/bundle-builder/assets/bundle-widget.css`

The API and storefront must call the minified extension asset only. Do not point API
preview code, Liquid, or storefront code at the raw source CSS file.

Other CSS targets that do not yet have a raw source file are still minified in place.

**When to run the minifier:**

| Change type                          | Command                        |
|--------------------------------------|--------------------------------|
| JS bundle changes (widget source)    | `npm run build:widgets`        |
| CSS-only changes                     | `npm run minify:assets css`    |
| Both CSS and JS changed              | `npm run build:widgets && npm run minify:assets css` |
| All assets (CSS + JS)                | `npm run minify:assets`        |

**What gets minified:**

CSS files:
- `app/assets/widgets/full-page-css/bundle-widget-full-page.css` → `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- `app/assets/widgets/product-page-css/bundle-widget.css` → `extensions/bundle-builder/assets/bundle-widget.css`
- `modal-discount-bar.css`

JS files (in `extensions/bundle-builder/assets/`):
- `bundle-widget-full-page-bundled.js`
- `bundle-widget-product-page-bundled.js`

**CSS minification** removes all block comments, collapses whitespace, strips spaces
around `:`, `{`, `}`, `,`, `;`, removes empty rules, and strips trailing semicolons
before `}`.

**JS minification** is conservative (no AST, no renaming):
- Preserves `/*!` licence/banner headers
- Removes all other block comments and `//` single-line comments
- Collapses 3+ consecutive blank lines to one
- Trims trailing whitespace per line

The script exits non-zero and prints an error if any CSS file exceeds Shopify's
**100,000 B** app-block asset limit after minification.

---

## 🔢 Widget Version Rule

### MANDATORY: Increment `WIDGET_VERSION` before every widget deploy

`WIDGET_VERSION` lives at the top of `scripts/build-widget-bundles.js`.
It is embedded in every bundled JS file as `window.__BUNDLE_WIDGET_VERSION__`.

**When to increment (semantic versioning):**

| Change type                                  | Version bump |
|----------------------------------------------|--------------|
| Bug fix (broken behaviour, logic error)      | PATCH x.y.Z  |
| New storefront feature (backwards-compatible)| MINOR x.Y.z  |
| Breaking change / widget redesign            | MAJOR X.y.z  |

**Mandatory steps before every widget deploy:**

```
1. Open scripts/build-widget-bundles.js
2. Increment WIDGET_VERSION (e.g. '1.0.0' → '1.0.1')
3. Run: npm run build:widgets        # builds JS bundles AND minifies them automatically
4. Run: npm run minify:assets css    # minify CSS files (script exits non-zero if any
                                     # file exceeds Shopify's 100,000 B limit)
5. Commit source + bundled (minified) files
6. Run: npm run deploy:prod  OR  npm run deploy:sit  (per the Shopify Deploy Rule above)
7. Wait 2-10 min for Shopify CDN cache to propagate — this is expected
```

**How Shopify CDN cache-busting works (why this matters):**

Shopify serves extension JS from its CDN. The `asset_url` Liquid filter appends a
`?v=HASH` parameter automatically. This hash only changes when you run
`shopify app deploy` — it is tied to the app-version snapshot, NOT the file content.
Custom query parameters (e.g. `?timestamp=`) are NOT on the CDN allowlist and will NOT
bust the cache.

Summary: **build → increment version → deploy → wait ~5 min → verify.**

**Verify the live version** in browser DevTools on any storefront page with the widget:

```javascript
// Paste in DevTools console:
console.log(window.__BUNDLE_WIDGET_VERSION__)
```

Expected output: the version string you set before the last deploy (e.g. `"1.0.1"`).

## 📁 File Structure

```
docs/
├── issues-prod/
│   ├── full-page-design-improvements-1.md    # Current issue
│   ├── {future-issue}-2.md                   # Future issues
│   └── ...
├── FULL_PAGE_DESIGN_GAP_ANALYSIS.md          # Analysis docs
├── FULL_PAGE_IMPLEMENTATION_PLAN_2026.md     # Implementation docs
└── ...

CLAUDE.md                                      # This file (root)
.claude/
└── plans/
    └── graceful-marinating-wozniak.md         # Current plan
```

## 🎯 Example Issue File

See `docs/issues-prod/full-page-design-improvements-1.md` for the current active issue.

## 📝 Example Commit History

```bash
[full-page-design-improvements-1] chore: Set up issue tracking system
[full-page-design-improvements-1] fix: Product cards maintain fixed dimensions via CSS grid
[full-page-design-improvements-1] feat: Add spacing controls to Theme Editor
[full-page-design-improvements-1] refactor: Remove hardcoded fonts, use inheritance
[full-page-design-improvements-1] feat: Create product variant modal component
[full-page-design-improvements-1] style: Update product card styling with shadows
[full-page-design-improvements-1] feat: Integrate modal and spacing with DCP
[full-page-design-improvements-1] docs: Update merchant guide for new features
```

## ✅ Benefits

- **Traceability:** Every change is documented
- **Context:** Understand why changes were made
- **Progress:** Clear visibility of what's done
- **Collaboration:** Easy for team members to follow along
- **Debugging:** Quick reference for when issues arise
- **History:** Complete audit trail of development

## 🔍 Finding Issues

### List All Issues:
```bash
ls -la docs/issues-prod/
```

### View Current Issue:
```bash
cat docs/issues-prod/full-page-design-improvements-1.md
```

### Search Commits by Issue:
```bash
git log --grep="full-page-design-improvements-1"
```

---

**Enforce this pattern throughout ALL changes in this project from now on.**
**No exceptions.** ✅

---

## 🚨 Do Not Touch — Bundle Config Loading (FPB Widget)

### NEVER modify the bundle config loading priority order in `bundle-widget-full-page.js`

The FPB widget uses a two-stage load strategy to avoid proxy failures and cold-start timeouts:

1. **Stage 1 — Metafield cache (primary):** The Liquid block writes the bundle config as a JSON string into the `data-bundle-config` attribute on the widget container. The widget reads this on init for instant, zero-network first paint. The metafield (`page.metafields.custom.bundle_config`) is written by the app when the merchant clicks "Place Widget Now" or "Sync Bundle".

2. **Stage 2 — Proxy API fallback:** If the metafield cache is absent, empty, or malformed JSON, the widget falls back to `GET /apps/product-bundles/api/bundle/{id}.json`. This path includes a single retry after 3 s for `503`/`504` responses to survive Render server cold-starts.

**Why this matters:** Before this fix, widgets on pages without a warm server would silently fail to load — the proxy call timed out and there was no fallback. The metafield cache eliminates the round-trip entirely for the common case; the retry handles the cold-start edge case.

**Rules:**
- ❌ Do NOT remove or reorder the `data-bundle-config` check — it must always run before the proxy fetch.
- ❌ Do NOT remove the `503`/`504` retry logic — Render cold-starts are real and ~3–10 s long.
- ❌ Do NOT add a third loading source between Stage 1 and Stage 2 without understanding the full proxy auth flow.
- ✅ The metafield is populated by `bundle-config-metafield.server.ts` — if bundle config structure changes, update both the server writer AND the widget parser together.

**Relevant files:**
- Widget reader: `app/assets/bundle-widget-full-page.js` — `loadBundleConfig()` (~line 325)
- Liquid injector: `extensions/bundle-builder/blocks/bundle-full-page.liquid` — `data-bundle-config="{{ page.metafields.custom.bundle_config | escape }}"`
- Server writer: `app/services/bundles/metafield-sync/` — `bundle-config-metafield.server.ts`

---

**Enforce this pattern throughout ALL changes in this project from now on.**
**No exceptions.** ✅

---

## 🔐 Test Store Access

**Default storefront password for all locked test stores: `1`**

- Test store: `wolfpack-store-test-1.myshopify.com`
- Use this password when Chrome DevTools MCP or any browser automation tool
  hits the Shopify storefront password gate.

## 🧭 Chrome DevTools App Verification

When verifying the embedded app with Chrome DevTools MCP, always access app pages through
the Shopify Admin embedded URL, for example:

```
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/...
```

Do **not** navigate directly to the Cloudflare tunnel app URL. Direct tunnel URLs such as
`https://<tunnel>.trycloudflare.com/app/...` do not preserve the Shopify embedded app
context and commonly redirect to `/auth/login`, so they are not valid for live Admin UI
verification.

---

## 🐙 GitHub Tasks — Always Use `gh` CLI

**ALWAYS use the `gh` CLI for ALL GitHub-related tasks.** Never use raw `git` commands for remote operations when `gh` provides a dedicated command.

| Task | Command |
|---|---|
| Create PR | `gh pr create` |
| View PRs | `gh pr list` / `gh pr view` |
| Merge PR | `gh pr merge` |
| Create issue | `gh issue create` |
| View issues | `gh issue list` / `gh issue view` |
| Check CI status | `gh run list` / `gh run view` |
| View remote branches | `gh api repos/{owner}/{repo}/branches` |
| Get commit SHA | `gh api repos/{owner}/{repo}/commits/{ref}` |
| Comment on PR/issue | `gh pr comment` / `gh issue comment` |

**Why:** `gh` handles auth, pagination, and JSON output correctly. Raw `git fetch`/`git push` to remote may fail without SSH keys configured in the session.

---

**Last Updated:** 2026-04-19
**Author:** Aditya Awasthi

## graphify

This project has a graphify knowledge graph at graphify-out/ and an audited internal docs vault at `internal docs/`.

### Mandatory Search Order

**ALWAYS follow this order when looking up architecture, APIs, or codebase behaviour:**

1. **`internal docs/`** — audited, human-curated vault. Start here for any topic that may be covered (Cart Transform, Pricing, DB schema, Shopify API limits, widget architecture, deployment).
2. **`graphify-out/GRAPH_REPORT.md`** — god nodes and community structure for codebase topology questions.
3. **`graphify-out/wiki/`** — if `index.md` exists, navigate it for node-level detail.
4. **Raw source files** — ONLY when the user explicitly asks you to read raw files, OR when the vault and graph do not cover the specific detail you need.

❌ Do NOT open raw `.ts` / `.js` / `.liquid` / `.prisma` files speculatively — consult the vault and graph first.
✅ The vault is the fastest and most reliable source for cross-cutting questions (API behaviour, gotchas, build rules, pricing units, etc.).

### Keeping the Vault Current

**When you encounter something useful that is NOT in `internal docs/`:**
- If it's a fact about Shopify API behaviour, a gotcha, a data model detail, a build rule, or a cross-cutting concern → **write or update the relevant note in `internal docs/`** before the conversation ends.
- If it's a specific bug fix or implementation detail that belongs in the code or git history, do NOT add it to the vault.
- After writing to the vault, add/update the link in `internal docs/index.md`.

### Graph-Assisted Debugging & RCA

**When debugging a bug or doing Root Cause Analysis (RCA), ALWAYS:**

1. Use `graphify-out/GRAPH_REPORT.md` to identify which community the affected node belongs to.
2. Run `graphify path "NodeA" "NodeB"` (or query the graph) to trace the relationship chain between the broken component and its dependencies/consumers.
3. Check the **Surprising Connections** and **Hyperedges** sections in `GRAPH_REPORT.md` — cross-cutting relationships that aren't obvious from reading the code directly are often the root cause.

```bash
/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "ComponentA" "ComponentB"
/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify query "what depends on X?"
```

### Impact Analysis — Mandatory Before Every Change

**Before building a new feature OR fixing a defect**, perform an impact analysis using the graph:

1. Identify the god nodes (`GRAPH_REPORT.md` → God Nodes section) — any change touching these requires extra care.
2. Use the graph to find all nodes that depend on the file/function you're changing.
3. Document the blast radius: which communities are affected, which tests cover them.

**Impact analysis must appear in:**
- **Commit message body** (after the first line): list affected communities / god nodes touched
- **PR description** (in a dedicated "Impact Analysis" section): list affected components, downstream risks, and which tests validate the change

**Commit format with impact analysis:**
```
[issue-id] type: short description

Impact: touches <CommunityName> community, depends on <GodNode>
Affected: <file1>, <file2>
Tested by: <test-file(s)>
```

**PR template addition:**
```markdown
## Impact Analysis
- **Communities touched**: [list from GRAPH_REPORT.md]
- **God nodes affected**: [BundleWidgetFullPage / AppStateService / etc.]
- **Downstream risk**: [what could break]
- **Test coverage**: [which test files validate this]
```

### Keeping the Graph Current

After modifying code files in this session, run:
```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## 📱 Storefront UI Audit Rule — Desktop + Mobile

### MANDATORY: Test both desktop and mobile views when auditing storefront UI

When asked to audit, review, or verify storefront UI, you MUST test on **both desktop and mobile viewports** using Chrome DevTools MCP.

**Workflow:**

1. **Desktop audit first** — take screenshots at default desktop viewport (1280×800 or wider).
2. **Mobile audit second** — use Chrome DevTools MCP `emulate` tool to switch to a mobile device (e.g. iPhone 12/14, 390×844) and take screenshots of the same pages/components.
3. **Compare and report** — note any layout issues, overflow, truncation, spacing problems, or broken interactions that appear only on one viewport.

**Required for:**
- Any "audit the storefront", "check the UI", "how does it look" request
- Post-deploy visual verification
- Bug reports related to storefront appearance

**Chrome DevTools MCP commands:**
```
1. Navigate to the storefront page
2. Take desktop screenshot
3. Emulate mobile device (e.g. iPhone 14)
4. Take mobile screenshot
5. Report findings for both viewports
```

**Why:** Many storefront bugs are mobile-only (overflow, tap targets, font scaling, modal sizing). A desktop-only audit misses ~60% of merchant customer traffic. Always test both.
