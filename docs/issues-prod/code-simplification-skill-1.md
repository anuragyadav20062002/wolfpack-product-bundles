# Issue: Code Simplification Skill

**Issue ID:** code-simplification-skill-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-19
**Last Updated:** 2026-02-19 03:00

## Overview

Research code simplification and refactoring best practices in the Remix + Shopify + Prisma TypeScript context. Develop a framework of anti-patterns and positive standards, then create a `code-simplification` Claude skill with an orchestrator that spawns a `feature-dev:code-reviewer` subagent on invocation.

## Phases Checklist

- [x] Phase 1: Research — web research + codebase exploration (parallel background agents) ✅
- [x] Phase 2: Document anti-patterns with real codebase examples ✅
- [x] Phase 3: Document positive simplification standards ✅
- [x] Phase 4: Create orchestrator SKILL.md ✅

## Progress Log

### 2026-02-19 02:30 - Planning and Research Started

- Launched two parallel background agents:
  - Codebase exploration: identified real anti-pattern instances in `handlers.server.ts`, `api.storefront-products.tsx`, `api.bundle.$bundleId[.]json.tsx`
  - Web research: AWS Builders Library, Remix docs, Shopify App Remix patterns, defensive programming anti-patterns
- Goal: Ground every anti-pattern in a real example from this codebase

### 2026-02-19 03:00 - All Phases Completed

- ✅ Files Created:
  - `.claude/skills/code-simplification/SKILL.md` (142 lines) — orchestrator
  - `.claude/skills/code-simplification/references/anti-patterns.md` (478 lines) — 10 anti-patterns
  - `.claude/skills/code-simplification/references/simplification-standards.md` (324 lines) — 10 standards

**Anti-patterns documented (with real codebase examples):**
- AP-01 CASCADING_FALLBACK — `api.storefront-products.tsx`: on-demand token creation with race condition
- AP-02 SILENT_SWALLOW — `handlers.server.ts`: Promise.all IIFE that catches and continues silently
- AP-03 TRIPLE_VALIDATION — `handlers.server.ts`: UUID check repeated 3× in handleSaveBundle
- AP-04 ANY_ESCAPE — `api.storefront-products.tsx`: manually-constructed admin context `as any`
- AP-05 GIANT_FUNCTION — `handlers.server.ts`: handleSaveBundle ~500 lines, 7+ responsibilities
- AP-06 CONSOLE_SPAM — `api.bundle.$bundleId[.]json.tsx`: ASCII-bordered console.log blocks
- AP-07 REPEAT_EXTRACT — `handlers.server.ts`: 5 `extract*Settings` functions all doing shape-pick
- AP-08 GENERIC_CATCH — Various routes: `(error as Error).message` without instanceof check
- AP-09 INCONSISTENT_GQL — Mixed error checking: some check `errors`, some `userErrors`, some neither
- AP-10 MIXED_PROMISES — `handlers.server.ts`: Promise.all with asymmetric catch coverage

**Standards documented:**
- 10 positive standards (fail-fast, throw vs return, auth guards, GraphQL, Prisma, parallel ops, function size, type narrowing, AppLogger, node: protocol)
- 7-question decision framework
- 8-item completion checklist

**Skill design:** SKILL.md acts as orchestrator — on `/code-simplification` invocation, spawns `feature-dev:code-reviewer` Task subagent with prompt that reads both reference files before auditing scope.

**Status:** Completed
- Commit: (pending)
