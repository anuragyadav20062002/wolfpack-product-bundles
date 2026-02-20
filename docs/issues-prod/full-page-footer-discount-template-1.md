# Issue: Full-Page Footer Discount Message Uses Templates

**Issue ID:** full-page-footer-discount-template-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-20
**Last Updated:** 2026-02-20 04:00

## Overview

The full-page bundle footer progress message ("Just 3 more items to unlock a discount!")
is hardcoded in `renderFullPageFooter()` instead of using the configured discount messaging
templates from the Discount & Pricing → Discount Messaging section.

The success state already uses `this.config.successMessageTemplate` (populated from
`bundle.messaging.successTemplate`). The progress state must use
`this.config.discountTextTemplate` (from `bundle.messaging.progressTemplate`) in the same way.

## Root Cause

`renderFullPageFooter()` in `bundle-widget-full-page.js` builds the pre-qualification
message with hardcoded `if/else` strings instead of calling
`TemplateManager.replaceVariables(this.config.discountTextTemplate, variables)`.

Product-page footer and modal already use the template system correctly.

## Progress Log

### 2026-02-20 04:00 - Fix Applied and Committed
- ✅ Replaced hardcoded `if/else` progress message strings in `renderFullPageFooter()` with
  `TemplateManager.createDiscountVariables` + `TemplateManager.replaceVariables(this.config.discountTextTemplate, variables)`
- ✅ Variables hoisted above if/else so both success and progress branches share the same object
- ✅ Success branch unchanged (was already using `successMessageTemplate`)
- ✅ Widget rebuilt (192.0 KB), 0 ESLint errors
- Files: `app/assets/bundle-widget-full-page.js`, `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

## Phases Checklist

- [x] Fix `renderFullPageFooter()` to use discount message templates
- [x] Rebuild widget
- [x] Lint + commit
