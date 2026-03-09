---
name: feature-pipeline
description: "A sequential 4-stage feature development pipeline that transforms a raw idea into production-ready code through structured handoffs: Business Requirement, Product Owner Requirements, Architecture Decisions, SDE Implementation. Use this skill when a user describes a new feature idea or capability that needs formal requirements, design, and implementation work. Triggers on phrases like 'I want to add a feature', 'we need to support X', 'implement Y in the app', or 'build a pipeline for [feature]'."
---

# Feature Pipeline

## Overview

The Feature Pipeline skill orchestrates a sequential 4-stage handoff process that takes a raw idea from business requirement through to working, committed code. Each stage builds on the previous one, ensuring the implementation is well-reasoned, architecturally sound, and aligned with stakeholder intent.

**Stages:**
1. **BR** — Business Requirement (research + problem statement)
2. **PO** — Product Owner Requirements (user stories + acceptance criteria)
3. **Architect** — Architecture Decisions (approach, data model, patterns)
4. **SDE** — Senior Software Engineer (implementation plan + code)

---

## Workflow

### Trigger

Use this pipeline when a user describes a **new capability** that spans research, design, and implementation. Examples:
- "We want users to be able to show discount messaging in different languages"
- "Add a dark mode toggle to the admin app"
- "Support multiple currencies in pricing rules"
- "Let merchants upload a custom logo per bundle"

---

### Stage 1 — Business Requirement (BR)

**Role:** Research analyst + business stakeholder

**Inputs:** Raw feature idea from user

**Actions:**
1. Research the problem space (use WebSearch, WebFetch, and codebase Grep/Read as needed)
2. Identify the most suitable implementation approach (document alternatives, pick the recommended one)
3. Write the BR document

**Output file:** `docs/{feature-name}/00-BR.md`

**BR document structure:**
```markdown
# Business Requirement: [Feature Name]

## Executive Summary
1-2 sentences describing the core business need.

## Problem Statement
What pain point does this solve? Who experiences it?

## Research Findings
- Approach A: [name] — [pros/cons]
- Approach B: [name] — [pros/cons]
- **Recommended:** Approach [X] because [rationale]

## Functional Requirements (FRs)
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements (NFRs)
- NFR-01: Performance — ...
- NFR-02: Backward compatibility — ...

## User Stories (high level)
- As a [role], I want to [action] so that [benefit]

## Scope
### In Scope
### Out of Scope

## Risks
| Risk | Likelihood | Mitigation |
```

**Handoff note:** Attach the BR document path when presenting Stage 2.

---

### Stage 2 — Product Owner Requirements (PO)

**Role:** Product Owner

**Inputs:** BR document from Stage 1

**Actions:**
1. Read the BR document
2. Translate FRs/user stories into granular, testable acceptance criteria
3. Define the exact UI/UX behavior (component names, labels, interactions)
4. Clarify ambiguities from the BR before handing to architecture

**Output file:** `docs/{feature-name}/02-PO-requirements.md`

**PO document structure:**
```markdown
# Product Owner Requirements: [Feature Name]

## User Stories with Acceptance Criteria

### Story 1: [Title]
**As a** [role]
**I want** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [edge case], then [fallback]

### Story N: ...

## UI/UX Specifications
- Component: [Polaris component name]
- Label format: [exact text]
- Default value: [value]
- Validation rules: [rules]

## Data Persistence
- What is saved, where, in what format

## Backward Compatibility Requirements
- Existing data must remain valid
- Migration strategy (if any)

## Out of Scope (explicit)
```

**Handoff note:** Attach both BR + PO documents when presenting Stage 3.

---

### Stage 3 — Architecture Decisions (Architect)

**Role:** Senior Software Architect

**Inputs:** BR + PO documents

**Actions:**
1. Read both documents thoroughly
2. Explore the existing codebase to understand current data models and patterns (use Glob/Grep/Read)
3. Evaluate 2-3 implementation options
4. Make and document a clear recommendation
5. Define the data model change / schema evolution
6. Identify all files that will need modification

**Output file:** `docs/{feature-name}/03-architecture.md`

**Architecture document structure:**
```markdown
# Architecture Decision Record: [Feature Name]

## Context
What problem are we solving architecturally?

## Constraints
- Must not break existing data
- Must work within current stack ([e.g., Remix + Prisma + Shopify metafields])

## Options Considered

### Option A: [Name]
- Description
- Pros / Cons
- Verdict: ✅ Recommended / ❌ Rejected

### Option B: [Name]
- Description
- Pros / Cons
- Verdict: ❌ Rejected because [reason]

## Decision: [Option X]
Rationale for the chosen approach.

## Data Model
```typescript
// New or updated types/interfaces
```

## Files to Modify
| File | Change |
|------|--------|
| `app/types/...` | Add new types |
| `app/hooks/...` | Update state shape |
| `app/routes/.../route.tsx` | Add UI |

## Migration / Backward Compatibility Strategy

## Testing Strategy

### Test Files to Create
| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/lib/...` | Unit | New helpers/utilities |
| `tests/unit/services/...` | Unit | New service functions |
| `tests/unit/routes/...` | Unit | Route action/loader logic |
| `tests/unit/extensions/...` | Unit | Cart transform / checkout logic |
| `tests/integration/...` | Integration | Multi-layer flows |
| `tests/e2e/...` | E2E | Full request lifecycle |

### Behaviors to Test
(Derived from PO acceptance criteria — each "Given/When/Then" becomes at least one test case)

### Mock Strategy
- **Mock:** Prisma DB client, Shopify GraphQL/Admin API client, session/auth
- **Do NOT mock:** Pure utility functions, data transformations, pricing calculations
- **Do NOT test:** Polaris UI component rendering (too coupled to Remix/React)

### TDD Exceptions (no tests required)
- CSS/style-only changes
- Documentation changes
- One-line config changes
- Widget storefront JS (tested separately via `tests/unit/assets/`)
- Shopify extension TOML config
```

**Handoff note:** Attach BR + PO + Architecture documents when presenting Stage 4.

---

### Stage 4 — SDE Implementation

**Role:** Senior Software Engineer

**Inputs:** BR + PO + Architecture documents

**Actions:**
1. Read all three documents (including the Architecture testing strategy)
2. Write a detailed implementation plan with phases — each phase pairs test files with implementation files
3. **Execute each phase using TDD:**
   a. Write failing tests first (Red)
   b. Implement the minimum code to pass (Green)
   c. Refactor while keeping tests green
   d. Run `npm test` to confirm all tests pass before moving to next phase
4. Run diagnostics / build checks
5. Create the issue file per CLAUDE.md and commit

**Output file:** `docs/{feature-name}/04-SDE-implementation.md`

**Implementation plan structure:**
```markdown
# SDE Implementation Plan: [Feature Name]

## Overview
What this plan covers, what files will change.

## Test Plan
(Derived from Architecture testing strategy)

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/feature.test.ts` | Pure logic, edge cases | Pending |
| `tests/unit/services/feature-service.test.ts` | Service layer with mocked DB | Pending |
| `tests/unit/routes/api.feature.test.ts` | Action/loader happy + error paths | Pending |
| `tests/integration/feature-flow.test.ts` | End-to-end service flow | Pending |

## Phase 1: [Name]
**Tests (Red):**
- `tests/unit/lib/feature.test.ts` — describe expected behavior

**Implementation (Green):**
- Step 1.1: [action] → `path/to/file.ts`
- Step 1.2: [action] → `path/to/file.ts`

**Refactor:** Clean up while tests stay green

## Phase N: ...

## Build & Verification Checklist
- [ ] All new tests pass (`npm test`)
- [ ] No regressions in existing tests
- [ ] TypeScript compiles without new errors
- [ ] Widget rebuilt (if widget files changed)
- [ ] Backward-compatible with existing data
- [ ] Manual test steps

## Rollback Notes
How to revert if needed.
```

**TDD exceptions** (implement without tests):
- CSS/style-only changes
- Documentation changes
- One-line config changes
- Widget storefront JS (covered by `tests/unit/assets/`)
- Shopify extension TOML config
- Polaris UI component rendering

**Then implement:**
- Follow CLAUDE.md issue tracking: create `docs/issues-prod/{feature-name}-{N}.md`
- Commit format: `[{issue-id}] type: description`
- Update issue file before and after each commit
- Include test files in each commit alongside the code they validate

---

## Quick Reference — Stage Outputs

| Stage | Role | Output File | Handoff To |
|-------|------|-------------|------------|
| BR | Research Analyst | `docs/{feature}/00-BR.md` | PO |
| PO | Product Owner | `docs/{feature}/02-PO-requirements.md` | Architect |
| Architect | Senior Architect | `docs/{feature}/03-architecture.md` | SDE |
| SDE | Senior Engineer | `docs/{feature}/04-SDE-implementation.md` + tests + code | Done |

---

## Worked Example

The i18n discount messaging feature was built using this exact pipeline:

| Stage | Document |
|-------|----------|
| Research + BR | `docs/i18n-discount-messaging/00-research.md` + `01-BR.md` |
| PO Requirements | `docs/i18n-discount-messaging/02-PO-requirements.md` |
| Architecture | `docs/i18n-discount-messaging/03-architecture.md` |
| SDE Plan + Code | `docs/i18n-discount-messaging/04-SDE-implementation.md` |

**Key outcome:** Locale-keyed JSON schema evolution in `BundlePricing.messages`, language dropdown in both configure routes, `window.Shopify.locale` detection in widget — zero DB migrations, full backward compatibility.

---

## Notes

- All stages are executed **sequentially** — never skip a stage
- Present each stage's output to the user before proceeding to the next (unless user says "continue when ready")
- The SDE stage **writes tests first, then actual code** — following TDD (Red/Green/Refactor)
- Always follow the project's `CLAUDE.md` issue tracking rules during Stage 4
- Run `npm test` after each phase to verify no regressions
