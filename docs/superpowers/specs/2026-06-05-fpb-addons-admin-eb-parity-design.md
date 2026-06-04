# FPB Add-ons Admin EB Parity Design

## Goal
Make the Full Page Bundle `Step Setup -> Free Gift & Add Ons` Admin section match EB's Landing Page Add-ons implementation and verify the saved Admin state reaches the storefront.

## Evidence
- Live EB Chrome audit on 2026-06-05 showed the Add-ons section order: `Add-Ons and Gifting Step`, `Add-Ons with Bundles`, tier card, `Add Add Ons Tier`, and `Footer Messaging`.
- EB help article says Landing Page layout supports free gifts/add-ons, then configure Add-ons under Step Setup, set add-on name/title, create discount tiers, set conditions and products, customize qualification messages, save, then preview.
- `internal docs/EB Implementation Reference.md` documents the direct `personalizationData.addonProducts` payload shape.
- Current WPB already persists the direct Add-ons contract; the parity gap is Admin UI fidelity and explicit SaveBar coverage.

## Scope
- FPB configure route only: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`.
- Route CSS module only for Admin visual parity: `app/styles/routes/full-page-bundle-configure.module.css`.
- Tests/specs/issues for layout and SaveBar wiring.
- E2E verification in Chrome from WPB Admin to storefront/cart.

## Non-Goals
- Do not re-add the removed gift/message-product Messages section.
- Do not implement email behavior.
- Do not change the existing storefront Add-ons data contract unless verification exposes a functional defect.
- Do not run Shopify deploy autonomously.

## Admin UI Requirements
- Use custom controls where needed to match EB.
- Top step card keeps EB order: heading, switch, Multi Language, upload, Step Name, Step Title.
- Add-ons card keeps EB order: heading, switch, How to setup, Multi Language, description, section title, tier cards.
- Tier cards include title/delete, tier title, Add Products, selected count chip/button, variants switch, discount basis select, eligibility value, discount percent, tier rules, and Add Tier Rule.
- Footer Messaging includes Show Variables, Multi Language, one Tier 1 group, message when rule not met, and success message.

## SaveBar Requirements
- Every Add-ons control must dirty the page.
- Save must serialize `personalizationData.addonProducts`.
- Discard must restore Add-ons draft and footer messaging state.
- Enter key in fields must not save silently.

## Verification
- Unit tests for route markers and dirty wiring.
- Existing save handler tests for direct personalization contract.
- Chrome Admin interaction: edit controls, observe SaveBar, discard once, save once.
- Chrome storefront: preview saved bundle, select qualifying products, confirm Add-ons title/messages/product behavior, and inspect cart payload/page.
