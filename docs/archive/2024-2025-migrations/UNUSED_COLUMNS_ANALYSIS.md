# Database Columns Usage Analysis

**Analysis Date:** 2025-12-16
**Status:** Complete

## Summary

This document analyzes database columns across 9 key tables to identify unused or underutilized fields that can be removed to simplify the schema and improve maintainability.

---

## 📊 Detailed Analysis by Table

### 1. **Bundle Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key, essential |
| `name` | ✅ Used | High | **KEEP** | Core field |
| `description` | ✅ Used | High | **KEEP** | Core field |
| `shopId` | ✅ Used | High | **KEEP** | Foreign key, essential |
| `shopifyProductId` | ✅ Used | High | **KEEP** | Links to Shopify product |
| `templateName` | ✅ Used | Medium | **KEEP** | Used for theme templates |
| `bundleType` | ✅ Used | Medium | **KEEP** | Distinguishes bundle types |
| `status` | ✅ Used | High | **KEEP** | Core state management |
| `active` | ⚠️ Unused | 0 (read) | **REMOVE** | Only set to `false`, never read. Redundant with `status` field |
| `publishedAt` | ❌ Unused | 0 | **REMOVE** | Completely unused, no references |
| `settings` | ⚠️ Minimal | 2 | **REMOVE** | Only used when cloning bundles, can be removed as clone operation can copy needed data differently |
| `matching` | ⚠️ Minimal | 3 | **CONSIDER REMOVING** | Only used in clone operation and one API endpoint. Evaluate if necessary |
| `createdAt` | ✅ Used | Medium | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Medium | **KEEP** | Audit trail |

**Summary:** Remove 2-4 columns (active, publishedAt, settings, matching*)

---

### 2. **BundlePricing Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `bundleId` | ✅ Used | High | **KEEP** | Foreign key |
| `enabled` | ✅ Used | High | **KEEP** | Core field |
| `method` | ✅ Used | 24 | **KEEP** | Core field |
| `rules` | ✅ Used | 19 | **KEEP** | Core field |
| `showFooter` | ✅ Used | 22 | **KEEP** | UI configuration |
| `showProgressBar` | ✅ Used | 20 | **KEEP** | UI configuration |
| `messages` | ✅ Used | 6 | **KEEP** | Customer-facing text |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** All columns actively used - no removals needed ✅

---

### 3. **BundleStep Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `name` | ✅ Used | High | **KEEP** | Core field |
| `icon` | ⚠️ Minimal | 3 | **KEEP** | Used for UI, low priority but functional |
| `position` | ✅ Used | High | **KEEP** | Ordering |
| `minQuantity` | ✅ Used | High | **KEEP** | Business logic |
| `maxQuantity` | ✅ Used | High | **KEEP** | Business logic |
| `enabled` | ✅ Used | High | **KEEP** | Core field |
| `productCategory` | ⚠️ Minimal | 2 | **CONSIDER REMOVING** | Very low usage, likely leftover from older implementation |
| `collections` | ✅ Used | High | **KEEP** | Core field |
| `products` | ✅ Used | 19 | **KEEP** | Core field |
| `displayVariantsAsIndividual` | ✅ Used | Medium | **KEEP** | UI configuration |
| `conditionType` | ✅ Used | Medium | **KEEP** | Business logic |
| `conditionOperator` | ✅ Used | Medium | **KEEP** | Business logic |
| `conditionValue` | ✅ Used | Medium | **KEEP** | Business logic |
| `bundleId` | ✅ Used | High | **KEEP** | Foreign key |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Consider removing `productCategory` (1 column)

---

### 4. **DesignSettings Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `shopId` | ✅ Used | High | **KEEP** | Foreign key |
| `bundleType` | ✅ Used | High | **KEEP** | Allows different designs per bundle type |
| **Individual Fields** | ✅ Used | 68 | **KEEP** | All color/font/size fields actively used |
| `productCardBgColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `productCardFontColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `productCardFontSize` | ✅ Used | Medium | **KEEP** | UI customization |
| `productCardFontWeight` | ✅ Used | Medium | **KEEP** | UI customization |
| `productCardImageFit` | ✅ Used | Medium | **KEEP** | UI customization |
| `productCardsPerRow` | ✅ Used | Medium | **KEEP** | UI customization |
| `productPriceVisibility` | ✅ Used | Medium | **KEEP** | UI customization |
| `productStrikePriceColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `productStrikeFontSize` | ✅ Used | Medium | **KEEP** | UI customization |
| `productStrikeFontWeight` | ✅ Used | Medium | **KEEP** | UI customization |
| `productFinalPriceColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `productFinalPriceFontSize` | ✅ Used | Medium | **KEEP** | UI customization |
| `productFinalPriceFontWeight` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonBgColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonTextColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonFontSize` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonFontWeight` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonBorderRadius` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonHoverBgColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `buttonAddToCartText` | ✅ Used | Medium | **KEEP** | UI customization |
| `quantitySelectorBgColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `quantitySelectorTextColor` | ✅ Used | Medium | **KEEP** | UI customization |
| `quantitySelectorFontSize` | ✅ Used | Medium | **KEEP** | UI customization |
| `quantitySelectorBorderRadius` | ✅ Used | Medium | **KEEP** | UI customization |
| `globalColorsSettings` | ✅ Used | 7 | **KEEP** | JSON settings |
| `footerSettings` | ✅ Used | 7 | **KEEP** | JSON settings |
| `stepBarSettings` | ✅ Used | 7 | **KEEP** | JSON settings |
| `generalSettings` | ✅ Used | 7 | **KEEP** | JSON settings |
| `customCss` | ❌ Unused | 0 | **REMOVE** | Completely unused |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Remove `customCss` (1 column)

---

### 5. **Session Table** ⚠️

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `shop` | ✅ Used | High | **KEEP** | Essential |
| `state` | ✅ Used | High | **KEEP** | OAuth state |
| `isOnline` | ✅ Used | High | **KEEP** | Session type |
| `scope` | ✅ Used | Medium | **KEEP** | OAuth scopes |
| `expires` | ✅ Used | Medium | **KEEP** | Session expiry |
| `accessToken` | ✅ Used | High | **KEEP** | Essential for API calls |
| `storefrontAccessToken` | ✅ Used | Medium | **KEEP** | Storefront API access |
| `userId` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `firstName` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `lastName` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `email` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `accountOwner` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `locale` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `collaborator` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `emailVerified` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Remove 8 columns (userId, firstName, lastName, email, accountOwner, locale, collaborator, emailVerified) - **HIGH IMPACT**

---

### 6. **Shop Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `shopDomain` | ✅ Used | High | **KEEP** | Essential identifier |
| `name` | ❌ Unused | 0 | **REMOVE** | Never read |
| `email` | ❌ Unused | 0 | **REMOVE** | Never read |
| `installedAt` | ⚠️ Minimal | 1 | **KEEP** | May be useful for analytics/support |
| `uninstalledAt` | ⚠️ Minimal | 1 | **KEEP** | Tracks app uninstalls |
| `currentSubscriptionId` | ✅ Used | 5 | **KEEP** | Subscription tracking |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Remove 2 columns (name, email)

---

### 7. **ShopSettings Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `shopId` | ✅ Used | High | **KEEP** | Foreign key |
| `theme` | ❌ Unused | 0 | **REMOVE** | Never accessed |
| `defaultSettings` | ✅ Used | 30 | **KEEP** | Actively used |
| `discountImplementation` | ❌ Unused | 0 | **REMOVE** | Never accessed, hardcoded to cart_transformation |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Remove 2 columns (theme, discountImplementation)

---

### 8. **StepProduct Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `stepId` | ✅ Used | High | **KEEP** | Foreign key |
| `productId` | ✅ Used | High | **KEEP** | Shopify product ID |
| `title` | ✅ Used | High | **KEEP** | Display name |
| `imageUrl` | ✅ Used | 11 | **KEEP** | Product image |
| `variants` | ✅ Used | 18 | **KEEP** | Variant data |
| `minQuantity` | ✅ Used | High | **KEEP** | Business logic |
| `maxQuantity` | ✅ Used | High | **KEEP** | Business logic |
| `position` | ✅ Used | 16 | **KEEP** | Ordering |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** All columns actively used - no removals needed ✅

---

### 9. **Subscription Table**

| Column | Status | Usage Count | Recommendation | Reason |
|--------|--------|-------------|----------------|---------|
| `id` | ✅ Used | High | **KEEP** | Primary key |
| `shopId` | ✅ Used | High | **KEEP** | Foreign key |
| `shopifySubscriptionId` | ✅ Used | 28 | **KEEP** | Shopify reference |
| `plan` | ✅ Used | High | **KEEP** | Subscription tier |
| `status` | ✅ Used | High | **KEEP** | Subscription state |
| `name` | ✅ Used | Medium | **KEEP** | Display name |
| `price` | ✅ Used | Medium | **KEEP** | Billing amount |
| `currencyCode` | ✅ Used | Medium | **KEEP** | Currency |
| `trialDaysRemaining` | ⚠️ Minimal | 3 | **KEEP** | Trial tracking (low usage but important) |
| `currentPeriodStart` | ⚠️ Minimal | 1 | **KEEP** | Billing period tracking |
| `currentPeriodEnd` | ⚠️ Minimal | 9 | **KEEP** | Billing period tracking |
| `cancelledAt` | ⚠️ Minimal | 4 | **KEEP** | Cancellation tracking |
| `test` | ❌ Unused | 0 | **REMOVE** | Never read |
| `confirmationUrl` | ✅ Used | 13 | **KEEP** | Shopify confirmation flow |
| `returnUrl` | ✅ Used | 16 | **KEEP** | Post-approval redirect |
| `createdAt` | ✅ Used | Low | **KEEP** | Audit trail |
| `updatedAt` | ✅ Used | Low | **KEEP** | Audit trail |

**Summary:** Remove 1 column (test)

---

## 🎯 Final Recommendations

### **High Priority Removals** (Definitely Remove)

| Table | Columns to Remove | Count | Impact |
|-------|------------------|-------|--------|
| **Session** | `userId`, `firstName`, `lastName`, `email`, `accountOwner`, `locale`, `collaborator`, `emailVerified` | 8 | **HIGH** - Large cleanup |
| **Bundle** | `active`, `publishedAt` | 2 | **MEDIUM** - Redundant fields |
| **Shop** | `name`, `email` | 2 | **LOW** - Never used |
| **ShopSettings** | `theme`, `discountImplementation` | 2 | **LOW** - Never used |
| **DesignSettings** | `customCss` | 1 | **LOW** - Feature not implemented |
| **Subscription** | `test` | 1 | **LOW** - Never read |

**Total: 16 columns to remove**

---

### **Consider Removing** (Evaluate Further)

| Table | Columns | Reason | Recommendation |
|-------|---------|--------|----------------|
| **Bundle** | `settings`, `matching` | Only used in clone operations | Can be refactored to not need these fields |
| **BundleStep** | `productCategory` | Very low usage (2 occurrences) | Likely deprecated, verify then remove |

**Total: 3 columns to evaluate**

---

### **Keep All Columns**

These tables have all columns actively in use:
- ✅ **BundlePricing** - All fields used
- ✅ **StepProduct** - All fields used

---

## 📋 Migration Plan

### Phase 1: Safe Removals (No Risk)
```sql
-- Session table cleanup
ALTER TABLE "Session" DROP COLUMN "userId";
ALTER TABLE "Session" DROP COLUMN "firstName";
ALTER TABLE "Session" DROP COLUMN "lastName";
ALTER TABLE "Session" DROP COLUMN "email";
ALTER TABLE "Session" DROP COLUMN "accountOwner";
ALTER TABLE "Session" DROP COLUMN "locale";
ALTER TABLE "Session" DROP COLUMN "collaborator";
ALTER TABLE "Session" DROP COLUMN "emailVerified";

-- Bundle table cleanup
ALTER TABLE "Bundle" DROP COLUMN "active";
ALTER TABLE "Bundle" DROP COLUMN "publishedAt";

-- Shop table cleanup
ALTER TABLE "Shop" DROP COLUMN "name";
ALTER TABLE "Shop" DROP COLUMN "email";

-- ShopSettings table cleanup
ALTER TABLE "ShopSettings" DROP COLUMN "theme";
ALTER TABLE "ShopSettings" DROP COLUMN "discountImplementation";

-- DesignSettings table cleanup
ALTER TABLE "DesignSettings" DROP COLUMN "customCss";

-- Subscription table cleanup
ALTER TABLE "Subscription" DROP COLUMN "test";
```

### Phase 2: Evaluate & Remove (After verification)
```sql
-- After verifying these can be safely removed
ALTER TABLE "Bundle" DROP COLUMN "settings";
ALTER TABLE "Bundle" DROP COLUMN "matching";
ALTER TABLE "BundleStep" DROP COLUMN "productCategory";
```

---

## 💾 Estimated Impact

- **Total columns removed:** 16-19
- **Database size reduction:** Minimal (mostly nullable fields)
- **Code simplification:** High (fewer fields to maintain)
- **Schema clarity:** Significantly improved
- **Risk level:** Low (fields are unused or minimally used)

---

## ✅ Next Steps

1. **Backup production database** before any changes
2. **Create migration** for Phase 1 removals
3. **Test in development** environment first
4. **Deploy to staging** and verify
5. **Create Phase 2 migration** after code refactoring for settings/matching fields
6. **Update TypeScript types** after schema changes
7. **Run `prisma generate`** to update Prisma Client

---

**Generated by:** Claude Code Analysis
**Review Status:** Pending team review
