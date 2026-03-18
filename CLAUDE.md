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
7. **NEVER run `shopify app deploy` autonomously** — see Shopify Deploy Rule below ❌
8. **Write tests BEFORE implementation for all new code** ✅
9. **Run linter on modified files BEFORE every commit** ✅ — see Lint Before Commit below
10. **NO backwards-compatibility shims or migration hacks** ❌ — see No Backwards Compatibility Rule below

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

## 🚢 Shopify Deploy Rule

### NEVER run `shopify app deploy` autonomously

The `shopify app deploy` command pushes extensions and app configuration to Shopify's
servers and can affect live merchant stores. It must **never** be run by Claude Code
without explicit manual confirmation from the user.

**Rule:** If a workflow step requires `shopify app deploy`, stop and display the following
prompt to the user:

```
ACTION REQUIRED — Manual deploy needed.

Run the following command in your terminal:

  shopify app deploy

Reason: [brief explanation of why deploy is needed]

Let me know once it completes and I will continue.
```

Do NOT attempt to run `shopify app deploy` even if:
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
3. Run: npm run build:widgets
4. Test changes in storefront
5. Commit BOTH source files AND bundled files
```

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
3. Run: npm run build:widgets
4. ✅ CHECK CSS FILE SIZES — Shopify enforces a 100,000 B limit on app block CSS assets.
   Run: wc -c extensions/bundle-builder/assets/*.css
   If any file exceeds 100,000 B, strip standalone block comments and excess blank lines:
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
   Re-run wc -c to confirm all files are under 100,000 B before proceeding.
5. Commit source + bundled files
6. Run: shopify app deploy  (per the Shopify Deploy Rule above)
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

**Last Updated:** February 19, 2026
**Author:** Aditya Awasthi
