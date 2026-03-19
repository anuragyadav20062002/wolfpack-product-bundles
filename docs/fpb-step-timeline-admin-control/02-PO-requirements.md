# Product Owner Requirements: Admin-Controlled Step Timeline Visibility

## User Stories with Acceptance Criteria

### Story 1: Hide step timeline from Admin UI when using pricing tiers

**As a** merchant configuring a flat-grid BYOB bundle with pricing tier pills
**I want** to hide the step timeline directly from the bundle configure page
**So that** I don't need to open Theme Editor for this common flat-grid setup task

**Acceptance Criteria:**
- [ ] Given the merchant has configured ≥ 2 tiers, a "Show step timeline" checkbox appears
  at the bottom of the Pricing Tiers section.
- [ ] Given < 2 tiers are configured, the checkbox is not rendered at all.
- [ ] The checkbox defaults to checked (true) when first shown (step timeline visible by default).
- [ ] Unchecking hides the step timeline on the storefront for this bundle.
- [ ] Checking restores the step timeline on the storefront.
- [ ] On save, the setting is persisted to DB and survives page refresh.
- [ ] On page load with ≥ 2 tiers and a saved setting, the checkbox reflects the saved value.

### Story 2: Step timeline respects the admin setting across tier switches

**As a** shopper browsing a bundle with multiple pricing tier pills
**I want** the step timeline to appear or not appear correctly when I switch pricing tiers
**So that** each tier's bundle renders with its own configured display settings

**Acceptance Criteria:**
- [ ] When switching to a tier bundle that has `showStepTimeline = false`, the step timeline
  is not rendered (even if the original bundle had it shown).
- [ ] When switching to a tier bundle with `showStepTimeline = null`, the step timeline
  falls back to the theme editor data attribute value.
- [ ] Re-rendering after tier switch applies the newly loaded bundle's setting, not the
  original bundle's setting.

### Story 3: Warning when steps + tiers conflict

**As a** merchant
**I want** to be warned when I configure pricing tier pills alongside multi-step bundle logic
**So that** I understand the UX implications and can make an informed decision

**Acceptance Criteria:**
- [ ] When adding the 2nd pricing tier (making pills active) AND the bundle has > 1 step,
  a warning modal appears before the tier is added to the list.
- [ ] When adding a step AND ≥ 2 tiers are already configured, a warning modal appears.
- [ ] The warning modal text clearly explains the conflict (steps = sequential navigation,
  tiers = flat-grid pricing choice — using both creates a confusing UX).
- [ ] The modal has two actions: "Continue anyway" (proceeds with the change) and "Cancel"
  (aborts the add action).
- [ ] If the merchant clicks "Continue anyway", the add proceeds normally.
- [ ] If the merchant clicks "Cancel", no change is made (tier/step not added).
- [ ] The warning does NOT fire on initial page load even if conflict already exists in DB.
  (Only fires on active user action.)

### Story 4: Reset admin setting when tiers drop below threshold

**As a** merchant who removes pricing tiers after having set "Show step timeline" to false
**I want** the step timeline setting to reset to "use theme editor value" automatically
**So that** removing tiers doesn't leave a hidden-timeline override silently affecting the storefront

**Acceptance Criteria:**
- [ ] When the bundle is saved with < 2 valid tiers, `showStepTimeline` is set to `null` in DB.
- [ ] On next page load with < 2 tiers, the `showStepTimeline` checkbox is not shown.
- [ ] On the storefront, the widget falls back to the theme editor data attribute value when
  `showStepTimeline` is null from the API.

## UI/UX Specifications

### Checkbox placement
- Location: Bottom of `PricingTiersSection` component, below the tier rows, above the info text
- Only rendered when `tiers.length >= 2`
- Label: **"Show step timeline"**
- Default: checked (true) — timeline visible
- Polaris component: `Checkbox` from `@shopify/polaris`

### Warning modal
- Polaris component: `Modal` from `@shopify/polaris`
- Title: **"Steps and Pricing Tiers conflict"**
- Body text:
  > **Using both steps and pricing tiers creates a confusing experience for shoppers.**
  >
  > Pricing tier pills work best with a single-step flat-grid bundle (e.g. pick any 3 products).
  > Your bundle has [X] steps configured, which guides shoppers through a sequential flow.
  >
  > Continuing will configure tiers alongside steps. Consider removing extra steps or using
  > a single step for the best flat-grid BYOB experience.
- Primary action: **"Continue anyway"** (destructive: false)
- Secondary action: **"Cancel"**

## Data Persistence

- DB: `Bundle.showStepTimeline Boolean?` — null = not set (theme editor controls), true/false = admin override
- Saved via `handleSaveBundle()` in handlers
- Reset to null on server when tier count < 2 after validation

## Backward Compatibility

- Existing bundles: `showStepTimeline = null` in DB after migration → widget falls back to
  theme editor data attribute → zero behavior change for existing merchants
- Theme editor checkbox (`show_step_timeline`) remains untouched — still works as before
- Admin UI setting takes precedence ONLY when non-null

## Out of Scope

- Removing the theme editor checkbox (it stays for backward compat + non-tier use cases)
- Auto-checking "Hide step timeline" when tiers are first added (merchant must opt-in)
- Blocking the merchant from proceeding with steps + tiers (warning only, not enforcement)
