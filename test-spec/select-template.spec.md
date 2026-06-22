# Test Spec: Select Template — parseWpbTemplate
**Spec ID:** select-template  **Issue:** [select-template-1]  **Created:** 2026-05-23

## Purpose
Verify that `parseWpbTemplate` correctly parses `wpbLayoutTemplate` and `wpbPresetId` from FormData submitted by both FPB and PPB configure route forms. The function is a pure FormData parser — no DB or API calls.

## Test Cases

### parseWpbTemplate — defaults and empty form

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Empty form | `{}` | `{ wpbLayoutTemplate: null, wpbPresetId: null }` | No template selected |
| 2 | Only whitespace in wpbPresetId | `{ wpbPresetId: "  " }` | `{ wpbPresetId: null }` | Trim + null |
| 3 | Only whitespace in wpbLayoutTemplate | `{ wpbLayoutTemplate: "  " }` | `{ wpbLayoutTemplate: null }` | Trim + null |

### parseWpbTemplate — valid FPB presets

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 4 | FPB Standard | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "STANDARD" }` | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "STANDARD" }` | Canonical FPB Standard preset |
| 5 | FPB Classic | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "CLASSIC" }` | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "CLASSIC" }` | |
| 6 | FPB Compact | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "COMPACT" }` | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "COMPACT" }` | |
| 7 | FPB Horizontal | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "HORIZONTAL" }` | `{ wpbLayoutTemplate: "FBP_SIDE_FOOTER", wpbPresetId: "HORIZONTAL" }` | |

### parseWpbTemplate — valid PPB templates

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 8 | PPB Product List (inpage+cascade) | `{ wpbLayoutTemplate: "PDP_INPAGE", wpbPresetId: "CASCADE" }` | `{ wpbLayoutTemplate: "PDP_INPAGE", wpbPresetId: "CASCADE" }` | |
| 9 | PPB Product Grid (inpage+cognive) | `{ wpbLayoutTemplate: "PDP_INPAGE", wpbPresetId: "COGNIVE" }` | `{ wpbLayoutTemplate: "PDP_INPAGE", wpbPresetId: "COGNIVE" }` | |
| 10 | PPB Horizontal Slots (modal+modal) | `{ wpbLayoutTemplate: "PDP_MODAL", wpbPresetId: "MODAL" }` | `{ wpbLayoutTemplate: "PDP_MODAL", wpbPresetId: "MODAL" }` | |
| 11 | PPB Vertical Slots (modal+simplified) | `{ wpbLayoutTemplate: "PDP_MODAL", wpbPresetId: "SIMPLIFIED" }` | `{ wpbLayoutTemplate: "PDP_MODAL", wpbPresetId: "SIMPLIFIED" }` | |

### parseWpbTemplate — presetId present, layoutTemplate absent

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 12 | PresetId only | `{ wpbPresetId: "CASCADE" }` | `{ wpbLayoutTemplate: null, wpbPresetId: "CASCADE" }` | Each field parsed independently |

## Acceptance Criteria
- [ ] All 12 test cases pass
- [ ] No TypeScript errors in `parsers.ts`
- [ ] `parseWpbTemplate` is exported from `parsers.ts`
