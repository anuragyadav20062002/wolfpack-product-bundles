---
name: feature-pipeline
description: "A 3-stage feature development pipeline: Requirements (BR+PO merged), Architecture (ADR + file plan + impact analysis), Implementation (TDD). Use when a user describes a new feature, capability, or 'I want to add X'. Fast-track available when an audit/spec already covers the BR. Never use for bug fixes, refactors, or single-file changes."
---

# Feature Pipeline

## When to use

**Use this pipeline for:** new capabilities, new UI sections, new data models, new merchant-facing controls.

**Skip this pipeline for:** bug fixes, refactors scoped to one file, config changes, CSS-only changes, documentation.

**Fast-track mode:** When an audit document, spec, or prior research already covers the business context, skip Stage 1 — reference the existing doc and go straight to Stage 2.

---

## Stages

```
Stage 1 — Requirements   →   Stage 2 — Architecture   →   Stage 3 — Implementation
(BR + PO merged)              (ADR + files + tests)         (TDD: Red → Green → Commit)
```

All stages run sequentially. Do not begin Stage N+1 until Stage N output file exists and has been confirmed.

---

## Stage 1 — Requirements

**Role:** Business Analyst + Product Owner combined

**When to skip:** Reference an existing audit/spec doc and note it at the top of Stage 2 instead.

**Actions:**
1. Research the problem space (codebase Grep/Read + competitor context if relevant)
2. Write the requirements document — BR and PO in one pass

**Output:** `docs/{feature-name}/01-requirements.md`

```markdown
# Requirements: {Feature Name}

## Context
One paragraph: what problem this solves, who it affects, why now.

## Audit / Prior Research Reference
> Skip if writing from scratch.
Link to existing audit or spec that motivated this feature.

## Functional Requirements
- FR-01: [must-have behaviour]
- FR-02: ...

## Out of Scope
- [explicit exclusions to prevent scope creep]

## Acceptance Criteria
Each FR maps to one or more testable criteria.

### FR-01: {name}
- [ ] Given {context}, when {action}, then {result}
- [ ] Given {edge case}, when {action}, then {fallback}

## UI/UX Spec
Component, label text, default values, validation rules, empty states.
Only include what's genuinely ambiguous — omit obvious items.

## Data Changes
New fields, schema changes, or "none" if purely UI.

## Risks
| Risk | Mitigation |
|---|---|
```

---

## Stage 2 — Architecture

**Role:** Senior Architect

**Actions (in order):**
1. Read Stage 1 doc (or reference audit doc in fast-track mode)
2. Run impact analysis using the graph:
   ```bash
   /Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/graphify path "AffectedNode" "DependentNode"
   ```
3. Identify god nodes touched (from `graphify-out/GRAPH_REPORT.md`)
4. Evaluate 2 options max — pick one and justify it
5. List every file to create or modify with the exact change required
6. Define the testing strategy

**Output:** `docs/{feature-name}/02-architecture.md`

```markdown
# Architecture: {Feature Name}

## Fast-Track Note
> If BR skipped: "BR context from: docs/ui-audit-26.05.md § {section}"

## Impact Analysis
- **Communities touched:** [from GRAPH_REPORT.md]
- **God nodes affected:** [BundleWidgetFullPage / AppStateService / etc.]
- **Blast radius:** [which areas could break]

## Decision
{Chosen approach in 2-3 sentences. No need for a rejected-options table unless the choice is genuinely non-obvious.}

## Data Model
```typescript
// Only new/changed types — omit unchanged fields
```

## Files
| File | Action | What changes |
|---|---|---|
| `app/types/bundle.types.ts` | modify | Add `stepBannerImageUrl?: string` |
| `extensions/.../liquid` | modify | Render new field |
| `tests/unit/...` | create | Unit tests for new logic |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/x.test.ts` | unit | happy path, missing field, invalid input |
| `tests/integration/x.test.ts` | integration | DB + service together |

**Mock:** Prisma, Shopify Admin API, session/auth
**Do not mock:** pure functions, data transforms, pricing calculations
**No tests needed:** CSS changes, Liquid/widget JS, Polaris UI rendering, TOML config
```

---

## Stage 3 — Implementation

**Role:** Senior Software Engineer

**Actions:**
1. Read Stages 1 + 2 docs
2. Create the issue file: `docs/issues-prod/{feature-name}-{N}.md` — do this before writing any code
3. For each file in the Stage 2 file list, follow TDD:
   - Write failing tests (Red)
   - Implement minimum code to pass (Green)
   - Refactor — tests must stay green
   - Run `npm test` before moving to next file
4. Lint modified files: `npx eslint --max-warnings 9999 {files}`
5. Commit using `[{issue-id}] type: description` format
6. Update issue file after each commit

**Output:** Working code + passing tests + committed issue file

**Checklist before done:**
- [ ] All new tests pass (`npm test`)
- [ ] No TypeScript errors
- [ ] ESLint zero errors on modified files
- [ ] Widget rebuilt if widget source changed (`npm run build:widgets`)
- [ ] Issue file updated and committed
- [ ] No backwards-compat shims added

---

## Quick Reference

| Stage | Output | Key rule |
|---|---|---|
| 1 — Requirements | `docs/{feature}/01-requirements.md` | Skip if audit already covers BR |
| 2 — Architecture | `docs/{feature}/02-architecture.md` | Impact analysis mandatory |
| 3 — Implementation | Code + tests + issue file | TDD: tests first, always |

---

## Fast-Track Example

Feature has a complete audit doc covering business context:

```
Stage 1: SKIPPED — context from docs/ui-audit-26.05.md § "Category Filter Sub-Tabs Per Step"
Stage 2: Write docs/step-category-filters/02-architecture.md (reference audit in header)
Stage 3: Implement with TDD
```
