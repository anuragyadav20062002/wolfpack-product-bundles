# Issue: Multilingual Discount Messaging

**Issue ID:** i18n-discount-messaging-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-19
**Last Updated:** 2026-02-19 14:30

## Overview

Allow merchants to configure discount message templates in multiple languages. A language selector dropdown is added to the Discount Messaging section. The storefront widget detects the buyer's locale (`window.Shopify.locale`) and serves the matching template, falling back to `en`.

## Documentation
- Research: `docs/i18n-discount-messaging/00-research.md`
- BR: `docs/i18n-discount-messaging/01-BR.md`
- PO Requirements: `docs/i18n-discount-messaging/02-PO-requirements.md`
- Architecture: `docs/i18n-discount-messaging/03-architecture.md`
- SDE Plan: `docs/i18n-discount-messaging/04-SDE-implementation.md`

## Progress Log

### 2026-02-19 14:30 - Implementation Completed
- ✅ Phase 1: Added `LocalizedMessageEntry`, `LocalizedPricingMessages`, `AnyPricingMessages`, `normalizeMessages`, `getMessageForLocale` to `app/types/pricing.ts`
- ✅ Phase 2: Changed `ruleMessages` type to `Record<string, Record<string, {discountText, successMessage}>>` in `useBundleConfigurationState.ts`
- ✅ Phase 3: Added `SUPPORTED_LANGUAGES` const, `selectedMessageLocale` state, language `Select` dropdown, updated `updateRuleMessage` signature + TextFields in both `product-page-bundle` and `full-page-bundle` configure routes
- ✅ Phase 4: Updated `handlers.server.ts` to build `localized` map from all configured locales (not just first-rule English)
- ✅ Phase 5: Updated `bundle-product.server.ts` to emit `localizedMessages` in metafield + keep legacy flat fields as `en` fallback
- ✅ Phase 6: Updated `updateMessagesFromBundle()` with locale detection (`window.Shopify.locale`) and fallback chain
- ✅ Phase 7: Widget rebuilt successfully (119.5 KB)
- ✅ TypeScript: Zero errors in modified files

## Phases Checklist

- [x] Phase 1: Type definitions (`pricing.ts`) ✅
- [x] Phase 2: State hook type update (`useBundleConfigurationState.ts`) ✅
- [x] Phase 3: Admin UI — dropdown + locale-aware fields (both routes) ✅
- [x] Phase 4: Server handler — `localizedMessages` builder (`handlers.server.ts`) ✅
- [x] Phase 5: Metafield sync update (`bundle-product.server.ts`) ✅
- [x] Phase 6: Widget locale detection (`bundle-widget-product-page.js`) ✅
- [x] Phase 7: Widget rebuild (`npm run build:widgets`) ✅
