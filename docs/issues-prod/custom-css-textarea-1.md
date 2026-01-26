# Issue: Custom CSS Textarea Feature

**Issue ID:** custom-css-textarea-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-19
**Last Updated:** 2026-01-21 10:30

## Overview

Implement a Custom CSS textarea feature in the Design Control Panel (DCP) that allows merchants to add custom CSS rules which automatically apply to the storefront bundle widgets. This feature is similar to what Easy Bundles by Skai Lama provides.

## Research Summary

### How Competitors Implement This Feature

**Easy Bundles by Skai Lama** ([Shopify App Store](https://apps.shopify.com/bundle-builder)):
- Provides a multi-line textarea in their design/styling settings
- Merchants can add single/multiple CSS rules with proper syntax
- CSS is applied automatically to the storefront widget
- Works alongside their visual design customization options

### Shopify Best Practices for Custom CSS Injection

Based on [Shopify Theme App Extensions Documentation](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration):

1. **Character Limitations**:
   - CSS rules affecting entire theme: 1500 characters max
   - CSS rules for specific sections: 500 characters max
   - Custom Liquid type: 50KB max

2. **Recommended Approach for Apps**:
   - Store custom CSS in database (server-side)
   - Serve CSS via app's API endpoint
   - Inject via `<link rel="stylesheet">` in theme extension
   - This approach has NO character limitations

3. **Security Considerations**:
   - Sanitize CSS to prevent XSS attacks
   - Validate CSS syntax before saving
   - Strip potentially harmful content (JavaScript, expressions, behaviors)

### Current Architecture Compatibility

**Good News**: The infrastructure is already in place!

1. **Database Field Exists**: `prisma/schema.prisma:261`
   ```prisma
   customCss                   String?
   ```

2. **CSS API Endpoint Exists**: `app/routes/api.design-settings.$shopDomain.tsx`
   - Already serves dynamic CSS from database
   - Returns CSS with proper caching headers
   - Loads on storefront via `<link>` tag

3. **Liquid Templates Already Load CSS**:
   - `bundle-full-page.liquid:218` - Loads CSS via app proxy
   - `bundle-product-page.liquid` - Same pattern

## Implementation Plan

### Phase 1: Database & API Integration

**Files to Modify:**
- `app/routes/api.design-settings.$shopDomain.tsx`

**Tasks:**
1. Include `customCss` field in the CSS API output
2. Append custom CSS at the end of generated CSS (after CSS variables)
3. Add comment marker for custom CSS section

**Code Changes:**
```typescript
// In api.design-settings.$shopDomain.tsx
// After all CSS variable generation, add:

/* ============================================
   MERCHANT CUSTOM CSS
   ============================================ */
${designSettings.customCss || ''}
```

### Phase 2: Admin UI - DCP Textarea

**Files to Modify:**
- `app/routes/app.design-control-panel.tsx`
- `app/components/design-control-panel/constants.ts` (if needed)

**Tasks:**
1. Add `customCss` to loader query
2. Add `customCss` to action handler
3. Create new "Advanced" or "Custom CSS" navigation section
4. Add Polaris `TextField` with `multiline={true}` attribute
5. Add character count indicator
6. Add syntax help/examples collapsible section

**UI Design:**
```
┌─────────────────────────────────────────────────────┐
│ Custom CSS                                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Add custom CSS rules to further customize your      │
│ bundle widget appearance.                           │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ .bundle-product-card {                         │ │
│ │   box-shadow: 0 4px 12px rgba(0,0,0,0.15);    │ │
│ │ }                                              │ │
│ │                                                │ │
│ │ .bundle-add-button:hover {                     │ │
│ │   transform: scale(1.02);                      │ │
│ │ }                                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                         0/50000     │
│                                                     │
│ ▸ View CSS Class Reference                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Phase 3: CSS Validation & Sanitization

**Files to Create:**
- `app/lib/css-sanitizer.ts`

**Tasks:**
1. Create CSS sanitization utility
2. Remove potentially dangerous content:
   - `javascript:` URLs
   - `expression()` (IE CSS expressions)
   - `behavior:` property
   - `@import` rules (security + performance)
   - `-moz-binding` property
3. Validate basic CSS syntax
4. Return sanitized CSS or validation errors

**Sanitization Rules:**
```typescript
// Patterns to remove/block
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /@import/gi,
  /-moz-binding/gi,
  /vbscript:/gi,
  /data:/gi,  // data: URLs can be used for XSS
];
```

### Phase 4: CSS Class Reference Documentation

**Files to Create:**
- In-app collapsible help section

**Available CSS Classes to Document:**

**Full-Page Bundle Widget:**
```css
/* Container */
.bundle-widget-full-page { }
.bundle-step-container { }

/* Product Cards */
.bundle-product-card { }
.bundle-product-image { }
.bundle-product-title { }
.bundle-product-price { }

/* Buttons */
.bundle-add-button { }
.bundle-remove-button { }
.bundle-next-button { }
.bundle-back-button { }

/* Footer */
.bundle-footer { }
.bundle-total-price { }
.bundle-progress-bar { }

/* Modal */
.bundle-modal { }
.bundle-modal-content { }
.bundle-modal-close { }
```

**Product-Page Bundle Widget:**
```css
/* Similar class structure */
.bundle-widget-product-page { }
/* ... etc */
```

### Phase 5: Testing & Validation

**Test Cases:**
1. Empty custom CSS saves correctly
2. Valid CSS applies to storefront
3. Invalid CSS shows validation warning
4. Dangerous CSS is sanitized
5. Large CSS (up to 50KB) saves and loads correctly
6. CSS changes reflect immediately after save (cache busting)
7. Custom CSS doesn't break DCP variable CSS

## Security Considerations

### XSS Prevention
- Never use `eval()` or `innerHTML` with custom CSS
- Sanitize all user input server-side before storage
- Sanitize again when outputting to CSS file

### Content Security Policy (CSP)
- Custom CSS is served from app's own domain via API endpoint
- No `style-src 'unsafe-inline'` required
- Maintains compatibility with strict CSP headers

### Resource Limits
- Maximum CSS size: 50KB (matches Shopify's liquid limit)
- Character count UI feedback for merchants
- Truncate/reject oversized submissions

## Database Migration

No migration required - `customCss` field already exists in schema.

## Files Changed Summary

| File | Changes |
|------|---------|
| `app/routes/api.design-settings.$shopDomain.tsx` | Include customCss in output |
| `app/routes/app.design-control-panel.tsx` | Add textarea UI, loader/action updates |
| `app/lib/css-sanitizer.ts` | New file - CSS sanitization utility |

## Progress Log

### 2026-01-21 10:30 - Implementation Completed

**Phase 1: Database & API Integration**
- Updated `app/routes/api.design-settings.$shopDomain.tsx`
- Added import for `sanitizeCss` from css-sanitizer utility
- Modified `generateCSSFromSettings` to accept and append `customCss` parameter
- Added sanitization of custom CSS before output with warning logging

**Phase 2: Admin UI - DCP Textarea**
- Updated `app/routes/app.design-control-panel.tsx`
- Added `customCss` state variable and `customCssHelpOpen` for collapsible help
- **Placed Custom CSS section on MAIN DCP page** (outside the modal, below "Open Customisations" button)
  - Separation of concerns: Visual editor in modal, Custom CSS on main page
  - Easy access for power users without opening the modal
- Created Card section with:
  - Multi-line monospaced textarea (10 rows) with detailed placeholder examples
  - Character counter (50,000 max)
  - Collapsible CSS class reference with organized categories
  - Security warning banner
  - Dedicated "Save Custom CSS" button

**Phase 3: CSS Validation & Sanitization**
- Created `app/lib/css-sanitizer.ts` with comprehensive security patterns:
  - Blocks javascript:, vbscript:, data: URLs
  - Blocks expression(), behavior:, -moz-binding:
  - Blocks @import, @charset rules
  - Blocks HTML tags (<script>, <style>, <link>, etc.)
  - Blocks event handlers (onclick, onerror, etc.)
  - 50KB max size limit
  - Basic CSS syntax validation (balanced braces, quotes, etc.)

**Phase 4: CSS Class Reference Documentation**
- Added inline help section in DCP with available CSS classes organized by:
  - Container classes
  - Product Card classes
  - Button classes
  - Footer classes
  - Modal classes

**Files Changed:**
- `app/routes/api.design-settings.$shopDomain.tsx` - API integration + sanitization
- `app/routes/app.design-control-panel.tsx` - UI textarea + navigation
- `app/lib/css-sanitizer.ts` - New security utility
- `docs/issues-prod/custom-css-textarea-1.md` - This issue tracking file

## Phases Checklist

- [x] Phase 1: Database & API Integration
- [x] Phase 2: Admin UI - DCP Textarea
- [x] Phase 3: CSS Validation & Sanitization
- [x] Phase 4: CSS Class Reference Documentation
- [x] Phase 5: Testing & Validation

## Related Documentation

- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [Shopify Input Settings](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings)
- [Easy Bundles by Skai Lama](https://apps.shopify.com/bundle-builder)
- Internal: `docs/DCP_IMPLEMENTATION_SUMMARY.md`

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| XSS via malicious CSS | Low | High | Server-side sanitization |
| Performance with large CSS | Low | Medium | 50KB limit, CDN caching |
| Breaking existing styles | Medium | Medium | Append custom CSS last |
| Invalid CSS causing widget issues | Medium | Low | Validation warnings, not blocking |

## Success Metrics

1. Merchants can add custom CSS via DCP textarea
2. CSS applies to storefront within refresh
3. No security vulnerabilities introduced
4. Character limit enforced with UI feedback
5. CSS class reference helps merchant adoption
