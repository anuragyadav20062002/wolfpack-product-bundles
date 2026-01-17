# Full-Page Bundle - Unified Flow Documentation

**Production-Ready | App Store Compliant**

---

## 🎯 Overview

This document describes the **unified user flow** for creating full-page bundles. The flow automatically handles both first-time setup (widget installation) and subsequent bundle page creation in a single, seamless experience.

### Key Features
- ✅ **Single "Add to Storefront" button** - Works for both scenarios
- ✅ **Automatic detection** - Backend checks widget installation status
- ✅ **Smart modal** - Shows installation guide when needed
- ✅ **Instant creation** - Pages created immediately after widget is installed
- ✅ **App Store compliant** - No programmatic theme modifications

---

## 📋 Complete Unified Flow

### Step 1: Merchant Creates Bundle

```
Merchant in Admin Panel:
├── Creates new full-page bundle
├── Configures:
│   ├── Bundle name
│   ├── Description
│   ├── Steps with products
│   └── Pricing rules
└── Saves bundle
```

**Result:** Bundle stored in database with `bundleType: 'full_page'`

---

### Step 2: Merchant Clicks "Add to Storefront"

```
Frontend Action:
├── Merchant clicks "Add to Storefront" button
├── Frontend calls: POST /app/bundles/full-page-bundle/configure/:bundleId
│   └── FormData: { intent: "validateWidgetPlacement" }
└── Shows loading state
```

**Location:** `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx:2920`

---

### Step 3: Backend Performs Unified Check

```
Backend: createFullPageBundle() - UNIFIED LOGIC
├── 1. Check widget installation in templates/page.json
│   ├── Query Shopify Admin API
│   ├── Fetch current theme
│   └── Search for: shopify://apps/{apiKey}/blocks/bundle-full-page
│
├── 2A. IF Widget NOT Installed (First Time):
│   ├── Generate installation deep link:
│   │   https://{shop}.myshopify.com/admin/themes/current/editor
│   │   ?template=page
│   │   &addAppBlockId={apiKey}/bundle-full-page
│   │   &target=mainSection
│   │
│   └── Return:
│       {
│         success: false,
│         widgetInstallationRequired: true,
│         widgetInstallationLink: "...",
│         error: "Please install the Bundle Widget...",
│         errorType: "widget_not_installed"
│       }
│
└── 2B. IF Widget IS Installed (Subsequent Times):
    ├── Create Shopify page:
    │   mutation pageCreate {
    │     pageCreate(page: {
    │       title: "Bundle Name",
    │       handle: "bundle-xyz",
    │       isPublished: true
    │     })
    │   }
    │
    ├── Add metafield to page:
    │   mutation metafieldsSet {
    │     metafieldsSet(metafields: [{
    │       ownerId: "gid://shopify/Page/123456",
    │       namespace: "$app",
    │       key: "bundle_id",
    │       value: "bundle-xyz"
    │     }])
    │   }
    │
    ├── Update bundle in database:
    │   bundle.update({
    │     shopifyPageHandle: "bundle-xyz",
    │     shopifyPageId: "gid://shopify/Page/123456"
    │   })
    │
    └── Return:
        {
          success: true,
          pageUrl: "https://{shop}.myshopify.com/pages/bundle-xyz",
          pageId: "gid://shopify/Page/123456",
          pageHandle: "bundle-xyz"
        }
```

**Location:** `app/services/widget-installation.server.ts:600-785`

---

### Step 4A: Frontend Handles Widget Installation Required

**Triggered when:** `widgetInstallationRequired: true`

```
Frontend Response Handler:
├── Detects: data.widgetInstallationRequired === true
├── Stores: widgetInstallationLink in state
├── Opens: Installation modal (beautiful UI)
└── Shows: Toast notification
```

**Modal UI Contents:**

```
╔══════════════════════════════════════════════════════════╗
║  One-Time Widget Setup Required                          ║
╠══════════════════════════════════════════════════════════╣
║                                                           ║
║  ⚡ Quick Setup (Takes ~10 seconds)                       ║
║                                                           ║
║  To display full-page bundles on your storefront,        ║
║  add the Bundle Widget to your theme once.               ║
║  After this one-time setup, all your bundles will        ║
║  work automatically!                                      ║
║                                                           ║
║  ─────────────────────────────────────────────────────── ║
║                                                           ║
║  Installation Steps:                                     ║
║                                                           ║
║  [Step 1] Click "Install Widget Now" below               ║
║  [Step 2] Bundle - Full Page widget will be pre-selected ║
║  [Step 3] Drag widget to desired position                ║
║  [Step 4] Click "Save" (top right)                       ║
║  [Step 5] Return here and click "Add to Storefront"      ║
║           again - page created instantly!                ║
║                                                           ║
║  ─────────────────────────────────────────────────────── ║
║                                                           ║
║  ✨ Why is this needed?                                   ║
║  • One-time only: Install once, use forever              ║
║  • App Store compliant: Follows Shopify best practices   ║
║  • Full control: Position widget where you want          ║
║  • No coding required: Simple drag-and-drop              ║
║                                                           ║
║  ─────────────────────────────────────────────────────── ║
║                                                           ║
║  Need help? [Theme Editor Guide]                         ║
║                                                           ║
║  [Install Widget Now]  [I'll Do This Later]              ║
╚══════════════════════════════════════════════════════════╝
```

**Location:** `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx:4306-4450`

---

### Step 4B: Merchant Installs Widget

```
When Merchant Clicks "Install Widget Now":
├── Opens theme editor in new tab with:
│   ├── Template: page
│   ├── App block: bundle-full-page (pre-selected)
│   └── Target: mainSection
│
├── Merchant in Theme Editor:
│   ├── Sees "Bundle - Full Page" block highlighted
│   ├── Drags block to desired position
│   └── Clicks "Save" (top right)
│
└── Widget is now in templates/page.json ✅
    (Works for ALL future full-page bundles!)
```

**Theme Editor Deep Link:**
```
https://{shop}.myshopify.com/admin/themes/current/editor
  ?template=page
  &addAppBlockId={apiKey}/bundle-full-page
  &target=mainSection
```

---

### Step 5: Merchant Returns & Creates Page

```
After Widget Installation:
├── Merchant returns to app
├── Clicks "Add to Storefront" again
├── Backend detects: Widget IS installed ✅
├── Skips installation modal
└── Proceeds directly to page creation (Step 4B flow)
```

**Flow continues to Step 6 immediately...**

---

### Step 6: Frontend Handles Success

**Triggered when:** `success: true` and `pageUrl` exists

```
Frontend Response Handler:
├── Detects: data.success === true && data.pageUrl
├── Shows: Success toast
│   "Bundle page created successfully!
│    The bundle is now live on your storefront."
│
├── Prompts: Confirmation dialog
│   "Would you like to view it on your storefront?"
│   ├── [Yes] → Opens: data.pageUrl in new tab
│   └── [No]  → Continues
│
└── Reloads page after 2 seconds to refresh state
```

**Location:** `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx:2967-2996`

---

### Step 7: Customer Views Bundle

```
Customer visits bundle page:
├── URL: https://{shop}.myshopify.com/pages/bundle-xyz
│
├── Page template loads: templates/page.json
│   └── Contains: Bundle - Full Page widget
│
├── Widget reads page metafield:
│   └── Finds: $app:bundle_id = "bundle-xyz"
│
├── JavaScript fetches bundle data:
│   GET /apps/product-bundles/api/bundle/bundle-xyz.json
│
└── Renders interactive bundle UI:
    ├── Product selection steps
    ├── Pricing & discounts
    ├── Add to cart functionality
    └── Progress tracking
```

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Merchant clicks "Add to Storefront"                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Backend: Check Widget │
         │  Installation Status  │
         └───────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  NOT Installed      IS Installed
        │                 │
        ▼                 │
┌──────────────┐          │
│ Show Install │          │
│    Modal     │          │
│              │          │
│ [Install Now]│          │
└──────┬───────┘          │
       │                  │
       ▼                  │
  ┌─────────┐             │
  │ Merchant│             │
  │ Installs│             │
  │ Widget  │             │
  │ in Theme│             │
  └────┬────┘             │
       │                  │
       ▼                  │
  Returns to App          │
       │                  │
       ▼                  │
  Clicks Button           │
   Again                  │
       │                  │
       └────────┬─────────┘
                │
                ▼
        ┌───────────────┐
        │ Create Page   │
        │ Add Metafield │
        │ Save to DB    │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Show Success  │
        │ Open Page URL │
        │ Reload App    │
        └───────────────┘
```

---

## 📊 Technical Implementation Details

### Backend Function
**File:** `app/services/widget-installation.server.ts`
**Function:** `createFullPageBundle()`
**Lines:** 600-785

**Logic:**
1. Calls `checkFullPageWidgetInstallation()` (READ-ONLY)
2. Returns installation link if widget not found
3. Creates page + metafield if widget installed
4. NO theme modifications (App Store compliant)

### Frontend Handler
**File:** `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx`
**Function:** `handlePlaceWidgetNow()`
**Lines:** 2920-2935

**Response Handler:**
**Lines:** 2941-3019

**Logic:**
1. Checks `widgetInstallationRequired` flag
2. Shows modal if true
3. Shows success if page created
4. Handles all error types

### Installation Modal
**File:** `app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx`
**Lines:** 4306-4450

**Features:**
- Step-by-step instructions
- Benefits callout
- Help resources link
- Primary action: "Install Widget Now"
- Secondary action: "I'll Do This Later"

---

## ✅ Benefits of Unified Flow

### For Merchants
1. **Single button** - Same action for all scenarios
2. **Clear guidance** - Beautiful modal with instructions
3. **One-time setup** - Install widget once, works forever
4. **Instant results** - Pages created immediately after setup
5. **No coding** - Simple drag-and-drop in theme editor

### For Developers
1. **Clean code** - Single function handles both scenarios
2. **Easy maintenance** - All logic in one place
3. **Type-safe** - TypeScript interfaces for all responses
4. **Well-documented** - Comments and logs throughout
5. **App Store ready** - Fully compliant

### For App Store
1. **✅ No theme modifications** - Manual widget installation only
2. **✅ No write_themes scope** - Removed from permissions
3. **✅ Best practices** - Follows Shopify guidelines
4. **✅ Built for Shopify eligible** - Qualifies for badge
5. **✅ User control** - Merchants choose widget position

---

## 🧪 Testing Checklist

### First Bundle (Widget Not Installed)
- [ ] Click "Add to Storefront"
- [ ] Installation modal appears
- [ ] Modal shows clear instructions
- [ ] "Install Widget Now" opens theme editor
- [ ] Widget is pre-selected in editor
- [ ] Save works in theme editor
- [ ] Return to app and click button again
- [ ] Page creates successfully

### Subsequent Bundles (Widget Installed)
- [ ] Click "Add to Storefront"
- [ ] NO modal appears
- [ ] Page creates immediately
- [ ] Success toast shows
- [ ] Confirmation dialog appears
- [ ] Page URL opens correctly
- [ ] Bundle displays on storefront

### Error Scenarios
- [ ] Page creation failure shows error
- [ ] Metafield failure shows warning
- [ ] Network errors handled gracefully
- [ ] Retry works after errors

---

## 🎨 UI/UX Highlights

### Installation Modal Features
- ✨ **Professional design** - Clean Polaris components
- 📝 **Clear steps** - Numbered badges with descriptions
- ✅ **Benefits section** - Explains why setup is needed
- 🔗 **Help resources** - Link to Shopify documentation
- 🎯 **Actionable** - Primary CTA stands out
- 🚀 **Non-blocking** - "I'll do this later" option

### Toast Messages
- "One-time widget setup required" (info)
- "Theme editor opened! Add the widget..." (info)
- "Bundle page created successfully!" (success)
- Appropriate error messages (error)

---

## 📚 Related Documentation

- [Widget Installation Service](../app/services/widget-installation.server.ts)
- [Full-Page Bundle Route](../app/routes/app.bundles.full-page-bundle.configure.$bundleId.tsx)
- [Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [App Store Requirements](https://shopify.dev/docs/apps/launch/release-requirements)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | Initial unified flow implementation |

---

**Status:** ✅ Production Ready | App Store Compliant
