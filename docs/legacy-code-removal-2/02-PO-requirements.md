# Product Owner Requirements: Legacy Backwards-Compatibility Removal (Round 2)

## Story 1: Simplify checkout component parsing
**As a** developer
**I want** `parseComponents` to only handle the compact array format
**So that** the function has no dead branch and its intent is unambiguous

**Acceptance Criteria:**
- [ ] `if (Array.isArray(parsed[0]))` format-detection check removed; function always maps as compact arrays
- [ ] Legacy object-format `return parsed.map((item: any) => ({ title: item.title, ... }))` block removed
- [ ] Comment "Falls back to legacy object format" removed
- [ ] Comment "Detect format: compact arrays vs legacy objects" removed
- [ ] TypeScript compiles cleanly in `bundle-checkout-ui`

---

## Story 2: Remove `pricing.messages` fallback from product-page widget
**As a** developer
**I want** `updateMessagesFromBundle` in `bundle-widget-product-page.js` to only use the `messaging` top-level key
**So that** the method has two clear branches: new path or default

**Acceptance Criteria:**
- [ ] `const pricingMessages = this.selectedBundle?.pricing?.messages` line removed
- [ ] `else if (pricingMessages)` block (lines 292–309) removed entirely
- [ ] Comment "Also check legacy path (pricing.messages) for backwards compatibility" removed
- [ ] The `else` default branch is preserved unchanged
- [ ] Widget rebuilt

---

## Story 3: Remove `pricing.messages` fallback from full-page widget
**As a** developer
**I want** the same simplification applied to `bundle-widget-full-page.js`
**So that** both widgets behave identically

**Acceptance Criteria:**
- [ ] Same as Story 2 but in `bundle-widget-full-page.js` (lines 413–449)
- [ ] Widget rebuilt

---

## Out of Scope
- `legacyResourceId` in GraphQL queries — still needed for admin URL construction
