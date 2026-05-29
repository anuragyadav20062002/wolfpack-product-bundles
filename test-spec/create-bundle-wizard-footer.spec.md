# Test Spec: Create Bundle Wizard Footer + Add Rule

**Spec ID:** create-bundle-wizard-footer  **Issue:** [feedback-jun26-1]  **Created:** 2026-05-29

## Purpose

Lock in the CSS contract for the CREATE wizard's footer (Back/Next buttons) and the Add Rule button so they do not regress into the Crisp chat collision / full-width state.

Targets:
- `app/routes/app/app.bundles.create_.configure.$bundleId/wizard-configure.module.css`

## Test Cases

### .wizardFooter CSS contract

| # | Scenario | Assertion |
|---|---|---|
| 1 | Footer reserves right-side padding for Crisp bubble | `.wizardFooter` rule contains `padding-right: 96px` |
| 2 | Footer retains bottom clearance | `.wizardFooter` rule contains `padding-bottom: 40px` |
| 3 | Footer keeps right-aligned action buttons | `.wizardFooter` rule contains `justify-content: flex-end` |
| 4 | Footer has visible gap between buttons | `.wizardFooter` rule contains `gap: 12px` (or larger) |
| 5 | Buttons in the footer are sized for click comfort | A `.wizardFooter s-button` rule sets `min-height: 44px` |

### .addRuleWrap CSS contract

| # | Scenario | Assertion |
|---|---|---|
| 6 | Add Rule button container is flex right-aligned | `.addRuleWrap` rule contains `display: flex` AND `justify-content: flex-end` |
| 7 | Container no longer forces `display: block` | `.addRuleWrap` rule does NOT contain `display: block` |
| 8 | Inner button is not forced full-width | The CSS does NOT contain `.addRuleWrap s-button { display: block; width: 100%; }` |

## Acceptance Criteria

- [ ] All 8 test cases above pass
- [ ] No new ESLint errors
- [ ] Visual confirmation in Chrome DevTools on Wolfpack SIT: Back/Next clearly clear of Crisp on Steps 02-05; Add Rule sits on the right of the Rules card on Step 02
