# Product Owner Requirements: "Add to Bundle" Button Selected-State Color

## User Stories with Acceptance Criteria

### Story 1: Set Selected-State Button Background Colour
**As a** merchant
**I want** to choose the background colour of the "Add to Bundle" button after a product is selected
**So that** the selected state matches my brand palette

**Acceptance Criteria:**
- [ ] Given I open DCP → Product Cards → Button, when I scroll to the "Added State" subsection, then I see a colour picker labelled "Added Button Background"
- [ ] Given I change the colour picker value, when the preview renders, then the "Added to Bundle" button in the preview shows the new background colour immediately
- [ ] Given I save DCP, when a customer selects a product on the storefront, then the button background changes to my chosen colour
- [ ] Given I have never set this value, when the widget renders, then the added button shows `#10B981` (matching current hardcoded default) — backward compatible

### Story 2: Set Selected-State Button Text Colour
**As a** merchant
**I want** to choose the text colour of the "Add to Bundle" button in its selected state
**So that** the text is always readable against my chosen background

**Acceptance Criteria:**
- [ ] Given I open DCP → Product Cards → Button, when I scroll to the "Added State" subsection, then I see a colour picker labelled "Added Button Text"
- [ ] Given I change the text colour picker, when the preview renders, then the "Added to Bundle" button text in the preview updates immediately
- [ ] Given I save DCP, when a customer selects a product, then the button text colour uses my chosen colour
- [ ] Given I have never set this value, when the widget renders, then text colour defaults to `#FFFFFF`

### Story 3: Live Preview of Both Button States
**As a** merchant
**I want** to see the unselected and selected button states side-by-side in the DCP preview
**So that** I can visually compare both states before saving

**Acceptance Criteria:**
- [ ] Given I navigate to DCP → Product Cards → Button → "Added State" subsection, when the preview renders, then the right panel shows two product cards: one with "Add to Bundle" (unselected) and one with "Added to Bundle" (selected state, with checkmark overlay)
- [ ] Given I update either added-state colour picker, when the preview updates, then only the selected-state card updates in real time
- [ ] Given I navigate away from "Added State" subsection, when I return, then both cards are still visible

### Story 4: Applies to Both Widget Types
**As a** merchant using full-page bundles
**I want** the same added-state button customisation to apply to my full-page bundle widget
**So that** my branding is consistent across both widget types

**Acceptance Criteria:**
- [ ] Given I set `buttonAddedBgColor` in DCP (product-page type), when the full-page widget renders an added button, then it uses the same CSS variable and shows my colour
- [ ] Given both widget types share the same DCP settings object, when I update this setting once, then both widget types reflect it

## UI/UX Specifications

### Settings Panel (ButtonSettings.tsx additions)

**Location in navigation:** DCP → Product Cards → Button → [new subsection: "Added State"]

**New controls to add** (after existing button controls):

```
─── Divider ───

Section heading: "Added State"
Subtitle: "Button appearance after a product is added to the bundle"

ColorPicker
  label: "Added Button Background"
  key: buttonAddedBgColor
  default: #10B981

ColorPicker
  label: "Added Button Text"
  key: buttonAddedTextColor
  default: #FFFFFF
```

### Preview Component (ProductCardPreview.tsx)

**Trigger subsection key:** `"addedButtonState"` (new sub-section within button section)

**Preview layout:** Two cards side by side
- Left card: unselected state ("Add to Bundle", current button bg)
- Right card: selected state ("Added to Bundle", green checkmark overlay, new `buttonAddedBgColor` applied inline)

The selected card shows:
- `.selected-overlay` div with "✓"
- `.product-add-btn.added` button using `var(--bundle-button-added-bg)` as background and `var(--bundle-button-added-text)` as color

### Navigation Sidebar

**Add new sub-item** under the existing "Button" navigation item:
```
Button
  ├── Default Style      (existing)
  └── Added State        (new) → sectionKey="addedButtonState"
```

## Data Persistence

| Field | Type | Default | Storage |
|-------|------|---------|---------|
| `buttonAddedBgColor` | `string` | `"#10B981"` | Prisma `DesignSettings` table |
| `buttonAddedTextColor` | `string` | `"#FFFFFF"` | Prisma `DesignSettings` table |

Both fields are nullable with DB-level defaults to maintain backward compatibility.

## CSS Variables Generated

| CSS Variable | From Field | Applied To |
|---|---|---|
| `--bundle-button-added-bg` | `buttonAddedBgColor` | `.product-add-btn.added` |
| `--bundle-button-added-text` | `buttonAddedTextColor` | `.product-add-btn.added` text |

## Backward Compatibility Requirements

- Existing Prisma rows: new columns are nullable; DB default is the hardcoded colour (`#10B981` / `#FFFFFF`)
- Widget CSS: `var(--bundle-button-added-bg, #10B981)` fallback ensures no visual change if CSS var not injected
- No data migration needed — nullable + default handles it

## Out of Scope (explicit)

- Hover state of the added/selected button
- Animation/transition of the state change
- Gradient added-button (full-page already has `fullPageAddedButtonGradientStart/End`)
- "Add to Box" label customisation (text is already controlled by `buttonAddToCartText` elsewhere)
- Per-step or per-bundle overrides
