# Test Spec: FPB Step Timeline Reference Parity
**Spec ID:** fpb-step-timeline-reference-parity  **Created:** 2026-06-12

## Purpose

Verify the FPB storefront uses the reference step timeline across all four full-page presets while keeping Step Config icon customization on the public `stepImage` contract.

## Test Cases

### Preset Timeline Eligibility
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard preset | `footer_side` + `STANDARD` | reference step bar renderer enabled | Standard template |
| 2 | Classic preset | `footer_side` + `CLASSIC` | reference step bar renderer enabled | Same FPB timeline family |
| 3 | Compact preset | `footer_side` + `COMPACT` | reference step bar renderer enabled | Same FPB timeline family |
| 4 | Horizontal preset | `footer_side` + `HORIZONTAL` | reference step bar renderer enabled | Same FPB timeline family |
| 5 | Non-side layout | non-`footer_side` layout | reference step bar renderer disabled | Avoid unrelated layouts |

### Step Icon Contract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 6 | Custom Step Config icon | runtime step has `stepImage` | timeline uses custom image | Public key |
| 7 | Legacy DB field | public runtime payload | no `timelineIconUrl` key | Formatter/metafield boundary |

## Acceptance Criteria

- [ ] All four FPB presets use the reference step bar renderer.
- [ ] Step Config custom icons render from `stepImage`.
- [ ] Public runtime payloads do not expose `timelineIconUrl`.
- [ ] Desktop and mobile Chrome verification covers all four presets.
