# Issue: Fix All Issues in bundle-checkout-ui Extension

**Issue ID:** checkout-ui-bugfixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-27
**Last Updated:** 2026-02-27 12:00

## Overview
Audit of `extensions/bundle-checkout-ui/` against Shopify 2026-01 Checkout UI Extensions docs revealed 12 issues. The extension was written using React patterns (hooks, old prop names) but runs as a Preact extension. Component props use invalid values that don't match the Polaris web component API.

## Progress Log

### 2026-02-27 12:00 - Starting Bugfix Implementation
- Replace React hooks (`useCartLineTarget`, `useTotalAmount`) with Preact `shopify` global signals
- Fix `s-text` props: `size` → `type`, `tone="subdued"` → `color="subdued"`, `emphasis="bold"` → `type="strong"`, remove `strikethrough`
- Fix `s-stack` props: `gap="tight"` → `gap="small-200"`, `gap="extraTight"` → `gap="small-100"`, `inline-alignment` → `justifyContent`
- Replace `s-badge tone="success"` with `s-text tone="success"` (badge only supports auto|neutral|critical)
- Replace `s-pressable` with `s-clickable`
- Remove `@ts-nocheck`
- Clean up `index.tsx` imports
- Bump API version to 2026-01
- Delete `shopify.d.ts`

Files to modify:
- `extensions/bundle-checkout-ui/src/Checkout.tsx`
- `extensions/bundle-checkout-ui/src/index.tsx`
- `extensions/bundle-checkout-ui/shopify.extension.toml`
- `extensions/bundle-checkout-ui/package.json`
- `extensions/bundle-checkout-ui/shopify.d.ts` (delete)

### 2026-02-27 12:15 - Completed All Fixes
- Replaced `useCartLineTarget`/`useTotalAmount` React hooks with `shopify.target.value`/`shopify.cost.totalAmount.value`
- Fixed all `s-text` props: `size` → `type`, `tone="subdued"` → `color="subdued"`, `emphasis="bold"` → `type="strong"`, removed `strikethrough`
- Fixed all `s-stack` props: `gap="tight"` → `gap="small-200"`, `gap="extraTight"` → `gap="small-100"`, `inline-alignment` → `justifyContent`
- Replaced `s-badge tone="success"` with `s-text tone="success"` (badge only supports auto|neutral|critical)
- Replaced `s-pressable` with `s-clickable`
- Removed `@ts-nocheck` directive
- Bumped API version to `2026-01` and package to `2026.1.0`
- Deleted `shopify.d.ts` (types provided by `@shopify/ui-extensions/preact` side-effect import)
- Validated with `validate_component_codeblocks` — all components valid
- ESLint: 0 errors, 14 warnings (all pre-existing)

Files modified:
- `extensions/bundle-checkout-ui/src/Checkout.tsx`
- `extensions/bundle-checkout-ui/src/index.tsx`
- `extensions/bundle-checkout-ui/shopify.extension.toml`
- `extensions/bundle-checkout-ui/package.json`
- `extensions/bundle-checkout-ui/shopify.d.ts` (deleted)

## Phases Checklist
- [x] Fix Checkout.tsx (hooks, props, components)
- [x] Clean up index.tsx
- [x] Bump API version in toml and package.json
- [x] Delete shopify.d.ts
- [x] Validate with component validator
- [x] Lint check
