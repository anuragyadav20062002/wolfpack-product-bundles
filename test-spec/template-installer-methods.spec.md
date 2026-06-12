# Test Spec: Template Installer Methods
**Spec ID:** template-installer-methods  **Created:** 2026-06-11

## Purpose
Ensure template installer modules expose behavior through named method maps instead of direct per-method prototype assignment.

## Test Cases
### TemplateInstallerMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page template installer source shape | PPB template installer files | No `const prototype =` or `prototype.` assignment strings | Keeps PPB installers ready for config-driven migration |
| 2 | Full-page template installer source shape | FPB template installer files | No `const prototype =` or `prototype.` assignment strings | Keeps runtime-style methods attached through a single method map |

## Acceptance Criteria
- [ ] Focused source-shape test passes.
- [ ] Existing registry and component contract tests continue to pass.
