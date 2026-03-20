# Product Owner Requirements: Cart Property Visibility Fix

## User Stories with Acceptance Criteria

### Story 1: View fix instructions on dashboard
**As a** merchant whose cart page shows raw bundle properties
**I want** to see a clear, step-by-step fix guide with a copyable snippet
**So that** I can fix my cart template in under 2 minutes without reading docs

**Acceptance Criteria:**
- [ ] Given the merchant is on the dashboard, they see a "Cart Display Fix" card
- [ ] The card shows a numbered 3-step guide (Theme Editor → find loop → add condition)
- [ ] The Liquid snippet is displayed in a styled code block
- [ ] Given the merchant clicks "Copy snippet", the code is copied to clipboard
- [ ] After copying, the button label changes to "Copied!" for 2 seconds then resets
- [ ] A note states: "Dawn and most Shopify themes handle this automatically"

## UI/UX Specifications

### Component: `CartPropertyFixCard`
- **Container:** Polaris `Card`
- **Header:** Icon (CodeIcon or SettingsIcon) + "Cart Property Display" title
- **Subtitle:** subdued text explaining the issue in one sentence
- **Steps:** numbered list (1, 2, 3) using same pattern as `BundleSetupInstructions`
- **Code block:** dark-background monospace block with the snippet, right-aligned "Copy" button
- **Footer note:** subdued small text — "Most modern themes (Dawn, Refresh, etc.) handle this automatically. Only apply if you see internal properties on your cart page."

### Exact Snippet Content
```liquid
{%- unless property.first contains '_' -%}
  <dt>{{ property.first }}</dt>
  <dd>{{ property.last }}</dd>
{%- endunless -%}
```

### Exact Step Text
1. **Open your theme** — Go to Online Store → Themes → Actions → Edit code
2. **Find the property loop** — In your cart template (`cart.liquid` or `cart-items.liquid`), locate the `for property in item.properties` loop
3. **Wrap with this condition** — Replace or wrap the loop body with the snippet below

### Copy Button Behavior
- Default label: "Copy snippet"
- Post-copy label: "Copied!" (green tone or success icon)
- Reset after: 2000ms
- Uses `navigator.clipboard.writeText()` — no fallback needed (Shopify embedded app runs in modern browser)

## Data Persistence
None — pure display component.

## Backward Compatibility
None — new component added to existing dashboard, no existing functionality modified.

## Out of Scope
- Theme detection / automatic fix
- Multiple snippet variants per theme
- Localization
