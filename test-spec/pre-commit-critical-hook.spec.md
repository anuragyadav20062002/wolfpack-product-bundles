# Test Spec: Pre-Commit Critical Hook
**Spec ID:** pre-commit-critical-hook  **Created:** 2026-07-13

## Purpose
Verify the staged-file planner for the fast critical pre-commit hook so commits are blocked only for high-confidence breakage and graphify configuration failures can warn without aborting.

## Test Cases
### PreCommitCriticalPlanner
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Mixed staged source files | TS source, raw widget JS, widget CSS, generated extension asset | Lint TS/raw JS, syntax-check raw JS, build matching widget target, minify CSS, ignore generated output for lint | Keeps hook fast and staged-aware |
| 2 | Partially staged checked source | Same file in staged and unstaged file lists | File appears in partial-stage blockers | Prevents checks from reading unstaged code |
| 3 | Banned UI styling test pattern | Test filename/content with styling assertions | Pattern finding reports blocking messages | Enforces AGENTS.md unit-test rule |
| 4 | Graphify local runtime failure | Known graphify/Python/permission error text | Classified as warn-only configuration failure | Commit should proceed with warning |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Hook planner excludes generated assets from lint/test checks
- [ ] Hook planner triggers generated asset checks only from staged source inputs
