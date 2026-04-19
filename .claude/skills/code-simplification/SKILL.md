---
name: code-simplification
description: "Spawns a dedicated code-simplification subagent that audits Remix + Shopify Prisma TypeScript code for anti-patterns and over-engineering, then produces a prioritised fix plan. Includes Shopify-specific checks (App Bridge invalid props, hardcoded CSS values, direct authenticate calls) and live verification via Chrome DevTools MCP + shopify app dev log spying. Use when: (1) user asks to simplify, refactor, or clean up a file or directory; (2) a file looks overly complex, defensive, or hard to read; (3) code review surfaces structural problems. Triggers on phrases like 'simplify this', 'this is too complex', 'clean this up', 'refactor', 'too much defensive code', 'too many fallbacks'."
---

# Code Simplification Orchestrator

## What This Skill Does

Spawns a `feature-dev:code-reviewer` subagent equipped with project-specific anti-pattern knowledge and simplification standards. The subagent audits code, classifies every finding by severity and effort, and returns a prioritised report with concrete before/after examples.

---

## Orchestration Steps

When this skill is invoked, follow these steps **in order**:

### Step 1 — Determine Scope

Identify what to analyse from the user's message:
- **Single file** — user named a file or the conversation is about a specific route
- **Directory** — user said "all API routes", "the configure route", a folder path
- **Full `app/`** — user said "the whole app", "everything", or gave no specific scope

If scope is ambiguous, ask before spawning the subagent.

### Step 2 — Spawn the Subagent

Use the Task tool with `subagent_type: "feature-dev:code-reviewer"` and the prompt below, substituting `{{SCOPE}}` with the resolved path(s):

```
You are a code-simplification specialist for a Remix + Shopify + Prisma TypeScript app.
You also have deep Shopify debugging expertise: App Bridge web components, Admin GraphQL
error layers, dev server log patterns, and Chrome DevTools live verification.

Read these two reference files FIRST before doing anything else:
1. /Users/adityaawasthi/Developer/wolfpack-product-bundles/.claude/skills/code-simplification/references/anti-patterns.md
2. /Users/adityaawasthi/Developer/wolfpack-product-bundles/.claude/skills/code-simplification/references/simplification-standards.md

Then audit the following scope: {{SCOPE}}

For each file in scope:
1. Read the file
2. Identify every violation of the anti-patterns and standards, INCLUDING Shopify-specific
   patterns (AP-11 APP_BRIDGE_INVALID_PROP, AP-12 HARDCODED_CSS_VALUE, AP-13 DIRECT_AUTHENTICATE)
3. Classify each finding: CRITICAL | WARN | INFO (see reference files for criteria)
4. Produce a before/after code snippet for CRITICAL and WARN findings
5. For each UI-affecting fix, note what to verify in Chrome DevTools Console after applying it
   (e.g. "Zero 'Unexpected value for attribute' errors on <ui-save-bar>")

Output a structured report exactly as specified in the OUTPUT FORMAT section of SKILL.md.

Do NOT modify any files. Do NOT commit. Return findings only.
```

Run the subagent **in the background** (`run_in_background: true`) when scope is large (directory or full app). For a single file, run inline.

### Step 3 — Present the Report

When the subagent returns, format its output as shown below and present it to the user. Ask: "Which findings should I fix?"

### Step 4 — Fix on Approval

For each approved finding, apply the fix using Edit or Write. Run lint after fixes:
```bash
npx eslint --max-warnings 9999 <changed-files>
```

Then update the issue tracker per CLAUDE.md.

### Step 5 — Live Verification (Shopify-specific)

After applying fixes, verify on the running dev server using the Chrome DevTools MCP and server log spying:

**Check dev server is alive:**
```bash
pgrep -la "shopify" | grep -v grep
tail -20 /tmp/shopify-dev.log
```

**For admin UI fixes (App Bridge props, route crashes, SSR errors):**
1. Use `mcp__chrome-devtools__navigate_page` to reload the affected admin route
2. Use `mcp__chrome-devtools__list_console_messages` — target: 0 error-level messages
3. Use `mcp__chrome-devtools__list_network_requests` — confirm no unexpected 4xx/5xx

**For widget JS fixes (storefront-side):**
1. Navigate to the storefront product page via `mcp__chrome-devtools__navigate_page`
2. Use `mcp__chrome-devtools__evaluate_script` to run:
   ```javascript
   // Verify widget version
   console.log(window.__BUNDLE_WIDGET_VERSION__)
   // Inspect cart state
   fetch('/cart.js').then(r=>r.json()).then(console.log)
   ```
3. Screenshot with `mcp__chrome-devtools__take_screenshot` to confirm visual fix

**Known dev-environment false positives (do NOT flag as failures):**
- `Failed to execute 'postMessage'` — App Bridge modals blocked by tunnel origin mismatch (deploy-only fix)
- `Error in PostgreSQL connection` — only appears if Cloudflare tunnel expired; restart dev server

---

## Output Format

The subagent must return results in this exact structure:

```
## Code Simplification Report: <scope>

### CRITICAL — Fix before next commit
| # | File:Line | Anti-Pattern | Description |
|---|-----------|-------------|-------------|
| 1 | app/routes/api/example.tsx:45 | CASCADING_FALLBACK | ... |

#### Finding 1 — <Anti-Pattern Name>
**File:** `app/routes/api/example.tsx:40-65`
**Why it's wrong:** ...

**Before:**
```typescript
// problematic code
```

**After:**
```typescript
// simplified code
```

---

### WARN — Should fix, pre-existing or lower risk
| # | File:Line | Anti-Pattern | Description |
|---|-----------|-------------|-------------|

---

### INFO — Style / awareness
| # | File:Line | Note | Description |
|---|-----------|------|-------------|

---

### Summary
- Files analysed: N
- CRITICAL: N  WARN: N  INFO: N
- Estimated fix effort: [XS | S | M | L]
```

---

## Severity Criteria

| Severity | Criteria |
|----------|---------|
| **CRITICAL** | Masks real errors, creates silent failures, causes runtime exceptions, or hides bugs from type system |
| **WARN** | Makes code hard to maintain, inconsistent with project patterns, or significantly over-engineered |
| **INFO** | Style inconsistencies, minor redundancy, or patterns to be aware of for future code |

---

## Quick Reference — Anti-Pattern Names

Full details in `references/anti-patterns.md`:

| Code | Name | One-Line Summary |
|------|------|-----------------|
| `CASCADING_FALLBACK` | Cascading Fallback Chain | Try X, catch, try Y, catch, try Z |
| `SILENT_SWALLOW` | Silent Error Swallow | catch block logs and continues as if nothing happened |
| `TRIPLE_VALIDATION` | Redundant Validation | Same validation logic repeated 2+ times in a function |
| `ANY_ESCAPE` | `as any` Type Escape | Type assertion that hides a real structural mismatch |
| `PARAM_ANY` | `any` Function Parameters | `admin: any, session: any` instead of proper types |
| `GIANT_FUNCTION` | Giant Function | Single function with 3+ distinct responsibilities |
| `CONSOLE_SPAM` | `console.log` in Production | Debug `console.log` bypassing AppLogger |
| `REPEAT_EXTRACT` | Repeated Extraction Pattern | Identical shape-pick functions written N times |
| `GENERIC_CATCH` | Overly Broad Catch | `(error as Error).message` without type narrowing |
| `INCONSISTENT_GQL` | Inconsistent GraphQL Error Check | Sometimes checks `errors`, sometimes `userErrors`, sometimes neither |
| `MIXED_PROMISES` | Promise.all with Mixed Safety | Some IIFEs catch internally, others don't, masking partial failures |
| `APP_BRIDGE_INVALID_PROP` | Invalid App Bridge Prop | Undocumented prop on `<ui-save-bar>`, `<ui-modal>` etc. — silently ignored, causes console error |
| `HARDCODED_CSS_VALUE` | Hardcoded Colour/Size in Widget JS | Hex/RGB literal instead of reading `--bundle-*` CSS variable from DCP |
| `DIRECT_AUTHENTICATE` | Direct `authenticate.admin()` in Route | Bypasses `requireAdminSession` auth guard — use the project-standard guard |
