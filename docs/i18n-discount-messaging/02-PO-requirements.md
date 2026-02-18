# [PO] Product Owner Requirements: Multilingual Discount Messaging

**Document Type:** Product Owner Requirements
**Feature:** Multilingual Discount Message Configuration
**Date:** 2026-02-19
**Status:** Ready for Architecture Review
**Prepared by:** Product Owner — Wolfpack Product Bundles
**Input:** BR-01 (Multilingual Discount Messaging)

---

## Product Owner Statement

This feature closes a critical gap for our international merchant base. Discount messaging is the highest-visibility merchant-authored text in the widget — it directly influences buyer behaviour. Locking it to English is a conversion killer for any merchant running a non-English storefront. The implementation must be seamless for merchants (no added friction to existing workflows) and invisible to buyers (automatic locale detection).

---

## Refined User Stories with Acceptance Criteria

---

### US-01 — Language Dropdown in Discount Messaging

**Story:** As a merchant, I want a language selector dropdown in the Discount Messaging section so I can manage templates per language without leaving the page.

**Acceptance Criteria:**

- **AC-01.1:** A `Select` dropdown labelled `"Language"` appears at the top of the Discount Messaging subsection, above the message fields.
- **AC-01.2:** The dropdown is populated with IETF shorthand language codes: `en`, `fr`, `de`, `es`, `it`, `ja`, `ko`, `pt`, `zh`, `nl`, `da`, `sv`, `pl`, `cs`, `fi`, `tr`, `nb`.
- **AC-01.3:** Each option displays as `code — Name` format: e.g., `en — English`, `fr — French`, `de — German`.
- **AC-01.4:** The dropdown defaults to `en` on first load.
- **AC-01.5:** Switching languages updates the message input fields below it without any page reload.
- **AC-01.6:** Unsaved changes in the current language are NOT lost when switching — they are kept in local state and submitted together on save.
- **AC-01.7:** The dropdown is visible only when the "Show discount messaging" toggle is enabled.

---

### US-02 — Per-Language Message Configuration

**Story:** As a merchant, I want to write separate "Discount Text" and "Success Message" templates for each language, so buyers in each language see contextually appropriate messages.

**Acceptance Criteria:**

- **AC-02.1:** The "Discount Text" field shows the value saved for the currently selected language (or empty string if none saved yet).
- **AC-02.2:** The "Success Message" field shows the value saved for the currently selected language (or empty string if none saved yet).
- **AC-02.3:** Placeholder text for empty fields shows a translated hint in the selected language where practical (e.g., French placeholder when `fr` is selected). _If not practical, English placeholder is acceptable._
- **AC-02.4:** Template variables (`{conditionText}`, `{discountText}`, etc.) remain unchanged and work identically across all languages.
- **AC-02.5:** The variable helper/collapsible reference section is still accessible regardless of selected language.

---

### US-03 — Saving Multilingual Messages

**Story:** As a merchant, I want all configured language messages to be saved atomically when I click "Save", so I don't lose any language configuration.

**Acceptance Criteria:**

- **AC-03.1:** Clicking "Save" persists ALL configured languages in a single save operation (not one per language).
- **AC-03.2:** Languages the merchant has not configured (empty both fields) are NOT stored — only languages with at least one non-empty field are saved.
- **AC-03.3:** After save, switching between languages in the dropdown shows the previously saved values.
- **AC-03.4:** The save operation is backward-compatible — bundles configured before this feature continues to work with their English messages automatically treated as the `en` entry.

---

### US-04 — Storefront Locale-Aware Display

**Story:** As a buyer, I want to see bundle discount messages in my browsing language if the merchant has configured it, so I can understand the discount offer clearly.

**Acceptance Criteria:**

- **AC-04.1:** The widget reads `window.Shopify.locale` to determine the buyer's language.
- **AC-04.2:** The language subtag is extracted (e.g., `fr` from `fr-FR`, `pt` from `pt-BR`).
- **AC-04.3:** The widget serves the message template matching the buyer's language subtag.
- **AC-04.4:** If no template is configured for the buyer's language, the widget falls back to the `en` template.
- **AC-04.5:** If no `en` template exists either (edge case), the widget falls back to the legacy `messages.progress` / `messages.qualified` fields.
- **AC-04.6:** If `window.Shopify.locale` is undefined, the widget defaults to `en`.

---

### US-05 — Migration Safety for Existing Bundles

**Story:** As a merchant with existing bundle configurations, I want my existing English discount messages to continue working after the update without any re-configuration.

**Acceptance Criteria:**

- **AC-05.1:** No database migration is required.
- **AC-05.2:** Existing bundles where `BundlePricing.messages` is a flat `{progress, qualified, showInCart}` object continue to work correctly (widget reads them as the `en` fallback).
- **AC-05.3:** On first opening the Discount Messaging section after the update, the `en` field is pre-populated with the merchant's existing English messages.
- **AC-05.4:** No merchant-facing announcement or action is required to maintain existing behaviour.

---

## UX Specification

### Dropdown Placement
```
[Discount Messaging] ─────────────────────────────────────────
  [✓] Show discount messaging

  Language  [en — English ▼]           ← NEW: appears right after toggle

  Discount Text
  [Add {conditionText} to get {discountText}                 ]

  Success Message
  [Congratulations! You got {discountText}                   ]

  ▶ Available Variables
───────────────────────────────────────────────────────────────
```

### Language Option Format
Each option in the `Select` dropdown:
```
en — English
fr — French
de — German
es — Spanish
it — Italian
ja — Japanese
ko — Korean
pt — Portuguese
zh — Chinese (Simplified)
nl — Dutch
da — Danish
sv — Swedish
pl — Polish
cs — Czech
fi — Finnish
tr — Turkish
nb — Norwegian
```

### Visual State: Unconfigured Language
- Fields are empty with muted placeholder text.
- No warning or validation required for empty fields (merchants may only configure languages relevant to their store).

### Visual State: Configured Language
- Fields show saved values.
- No special indicator needed (simplicity preferred).

---

## Feature Flag & Rollout

- **No feature flag required** — this is a UI addition that adds capability without changing existing behaviour.
- **Rollout:** Deploy to all merchants simultaneously (no staged rollout needed given backward compatibility).

---

## Out of Scope (Confirmed Non-Goals)

1. **Auto-translation** — Merchants write their own translations. No API integration.
2. **Language detection for admin UI** — The bundle config page itself stays in English.
3. **Per-rule language inheritance** — Each rule manages its own messages independently.
4. **Language deletion UI** — Saving with empty fields effectively removes that language entry.
5. **Preview in selected language** — DCP preview stays in default English.
6. **Full-page bundle widget** — Separate ticket if required.
7. **RTL support** — Not in scope for initial release.

---

## Definition of Done

- [ ] Language dropdown renders in the Discount Messaging section.
- [ ] Switching languages updates fields with no page reload.
- [ ] All configured languages are saved atomically on form save.
- [ ] Storefront widget serves locale-matched messages with `en` fallback.
- [ ] Existing English messages work unchanged post-deploy.
- [ ] No DB migration required.
- [ ] Widget build (`npm run build:widgets`) run and committed.
- [ ] Code reviewed and merged to STAGING.

---

## Handover Notes for Architect

Key technical constraints to observe:
1. **No new npm packages** — use Polaris `Select` for the dropdown.
2. **No new API endpoints** — extend the existing `discountData` formData field.
3. **JSON schema evolution** — `BundlePricing.messages` must support both old flat format and new locale-keyed format simultaneously (no migration).
4. **Widget is a bundled IIFE** — changes require `npm run build:widgets` before commit.
5. **`window.Shopify.locale`** is the reliable locale signal on storefront pages.
6. The discount messaging section is in `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` around lines 1813–1919.
