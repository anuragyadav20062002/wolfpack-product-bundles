# Architecture Decision Record: Cart Property Visibility Fix

## Context
Pure UI addition. No data model changes. No server changes. No tests required (Polaris UI rendering excluded per CLAUDE.md TDD exceptions).

## Decision
Single new component `app/components/CartPropertyFixCard.tsx` added to the dashboard layout.

## Files to Modify
| File | Change |
|------|--------|
| `app/components/CartPropertyFixCard.tsx` | NEW — self-contained card component |
| `app/routes/app/app.dashboard/route.tsx` | Import + render `CartPropertyFixCard` in Layout.Section |

## Component Design
- Self-contained — no props needed, no loader data
- Uses `useState` for copy confirmation state
- Uses Polaris: `Card`, `BlockStack`, `InlineStack`, `Text`, `Button`, `Icon`, `Badge`
- Code block styled with inline CSS (dark bg `#1a1a2e`, monospace font, padding)
- Copy via `navigator.clipboard.writeText()`

## Dashboard Placement
Below the setup instructions card, above or alongside the bundle list. Uses existing `Layout.Section` pattern.

## Testing Strategy
No tests required — Polaris UI component (TDD exception per CLAUDE.md).
