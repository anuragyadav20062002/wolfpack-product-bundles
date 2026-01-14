# Widget Installation Refactor Plan

## Current Problem

**Duplicate App Blocks Issue**:
- `addAppBlockId` parameter adds a NEW block every time theme editor link is opened
- Users click "Add to Storefront" for each bundle → Multiple duplicate blocks
- Confusing UX: Implies widget needs to be added per-bundle

**Current Flow** (Per-Bundle):
```
User creates Bundle 1 → Click "Add to Storefront" → Opens theme editor with addAppBlockId → Adds block #1
User creates Bundle 2 → Click "Add to Storefront" → Opens theme editor with addAppBlockId → Adds block #2 (DUPLICATE!)
User creates Bundle 3 → Click "Add to Storefront" → Opens theme editor with addAppBlockId → Adds block #3 (DUPLICATE!)
```

## Solution: One-Time Installation

### Architecture Change

**New Flow** (One-Time + Auto-Detection):
```
App Installation → One-time widget setup → Merchant adds block ONCE

Bundle 1 created → Metafield set automatically → Widget shows on product page (no theme editor)
Bundle 2 created → Metafield set automatically → Widget shows on product page (no theme editor)
Bundle 3 created → Metafield set automatically → Widget shows on product page (no theme editor)
```

### Phase 1: Create One-Time Setup Flow

#### 1.1 Add Installation Status Tracking

**File**: `prisma/schema.prisma`

```prisma
model Shop {
  id                    String         @id @default(uuid())
  shopDomain            String         @unique
  // ... existing fields ...

  // NEW: Track widget installation status
  widgetInstalled       Boolean        @default(false)
  widgetInstalledAt     DateTime?

  // Track which widget types are installed
  productPageWidgetInstalled  Boolean  @default(false)
  fullPageWidgetInstalled     Boolean  @default(false)
}
```

Migration:
```bash
npx prisma migrate dev --name add_widget_installation_tracking
```

#### 1.2 Create Onboarding Modal Component

**File**: `app/components/WidgetOnboardingModal.tsx`

```typescript
import { Modal, Text, BlockStack, Button, InlineStack, Icon } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

interface WidgetOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  installationLink: string;
  widgetType: 'product_page' | 'full_page';
}

export function WidgetOnboardingModal({
  open,
  onClose,
  onComplete,
  installationLink,
  widgetType
}: WidgetOnboardingModalProps) {
  const isProductPage = widgetType === 'product_page';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="One-time Widget Setup"
      primaryAction={{
        content: "Open Theme Editor",
        onAction: () => {
          window.open(installationLink, '_blank');
          onComplete();
        }
      }}
      secondaryActions={[{
        content: "I'll do this later",
        onAction: onClose
      }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p">
            Add the Bundle Widget to your theme once. After this, all your bundles will automatically appear when configured.
          </Text>

          <BlockStack gap="200">
            <Text variant="headingSm">What you'll do:</Text>
            <InlineStack gap="200" blockAlign="start">
              <Icon source={CheckCircleIcon} tone="success" />
              <Text>Click "Open Theme Editor" below</Text>
            </InlineStack>
            <InlineStack gap="200" blockAlign="start">
              <Icon source={CheckCircleIcon} tone="success" />
              <Text>
                Add the "Bundle Widget" block to your {isProductPage ? 'product template' : 'page template'}
              </Text>
            </InlineStack>
            <InlineStack gap="200" blockAlign="start">
              <Icon source={CheckCircleIcon} tone="success" />
              <Text>Click "Save" in the theme editor</Text>
            </InlineStack>
            <InlineStack gap="200" blockAlign="start">
              <Icon source={CheckCircleIcon} tone="success" />
              <Text>Return here - you won't need to do this again!</Text>
            </InlineStack>
          </BlockStack>

          <Text as="p" tone="subdued">
            This is a one-time setup. Future bundles will work automatically without opening the theme editor.
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
```

#### 1.3 Create Onboarding Route

**File**: `app/routes/app.onboarding.widget.tsx`

```typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Button, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { WidgetOnboardingModal } from "../components/WidgetOnboardingModal";
import { useState } from "react";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Check installation status
  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop },
    select: {
      productPageWidgetInstalled: true,
      fullPageWidgetInstalled: true
    }
  });

  const apiKey = process.env.SHOPIFY_API_KEY || '';
  const shopDomain = session.shop.replace('.myshopify.com', '');

  // Generate one-time installation links
  const productPageLink = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?addAppBlockId=${apiKey}/bundle-product-page&target=mainSection&template=product`;
  const fullPageLink = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?addAppBlockId=${apiKey}/bundle-full-page&target=mainSection&template=page`;

  return json({
    productPageWidgetInstalled: shop?.productPageWidgetInstalled || false,
    fullPageWidgetInstalled: shop?.fullPageWidgetInstalled || false,
    productPageLink,
    fullPageLink,
    shop: session.shop
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const widgetType = formData.get("widgetType") as 'product_page' | 'full_page';

  // Mark widget as installed
  await db.shop.upsert({
    where: { shopDomain: session.shop },
    create: {
      shopDomain: session.shop,
      productPageWidgetInstalled: widgetType === 'product_page',
      fullPageWidgetInstalled: widgetType === 'full_page',
      widgetInstalledAt: new Date()
    },
    update: {
      [widgetType === 'product_page' ? 'productPageWidgetInstalled' : 'fullPageWidgetInstalled']: true,
      widgetInstalledAt: new Date()
    }
  });

  return json({ success: true });
};

export default function WidgetOnboarding() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showProductPageModal, setShowProductPageModal] = useState(false);
  const [showFullPageModal, setShowFullPageModal] = useState(false);

  const handleComplete = async (widgetType: 'product_page' | 'full_page') => {
    // Mark as installed
    const formData = new FormData();
    formData.append('widgetType', widgetType);

    await fetch('/app/onboarding/widget', {
      method: 'POST',
      body: formData
    });

    // Close modal and redirect
    setShowProductPageModal(false);
    setShowFullPageModal(false);
    shopify.toast.show('Widget setup completed! You can now create bundles.', { duration: 5000 });

    // Redirect based on widget type
    navigate(widgetType === 'product_page'
      ? '/app/bundles/product-page-bundle/new'
      : '/app/bundles/full-page-bundle/new'
    );
  };

  return (
    <Page
      title="Widget Setup"
      subtitle="One-time setup to display bundles on your storefront"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <Text>
              Add the Bundle Widget to your theme once. After this setup, all your bundles will automatically display when configured - no need to open the theme editor again!
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Product Page Bundles</Text>
              <Text>
                Display bundles on product pages. Perfect for upselling and product customization.
              </Text>

              {data.productPageWidgetInstalled ? (
                <Banner tone="success">
                  <Text>✅ Product page widget is installed and ready to use!</Text>
                </Banner>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowProductPageModal(true)}
                >
                  Set Up Product Page Widget
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Full Page Bundles</Text>
              <Text>
                Create dedicated bundle pages with custom URLs. Ideal for marketing campaigns.
              </Text>

              {data.fullPageWidgetInstalled ? (
                <Banner tone="success">
                  <Text>✅ Full page widget is installed and ready to use!</Text>
                </Banner>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowFullPageModal(true)}
                >
                  Set Up Full Page Widget
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <WidgetOnboardingModal
        open={showProductPageModal}
        onClose={() => setShowProductPageModal(false)}
        onComplete={() => handleComplete('product_page')}
        installationLink={data.productPageLink}
        widgetType="product_page"
      />

      <WidgetOnboardingModal
        open={showFullPageModal}
        onClose={() => setShowFullPageModal(false)}
        onComplete={() => handleComplete('full_page')}
        installationLink={data.fullPageLink}
        widgetType="full_page"
      />
    </Page>
  );
}
```

### Phase 2: Refactor Bundle Configure Pages

#### 2.1 Remove `addAppBlockId` from Configure Pages

**File**: `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`

**BEFORE** (Line ~3053):
```typescript
const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?template=${template.handle}&addAppBlockId=${appBlockId}&target=newAppsSection&bundleId=${bundle.id}`;
```

**AFTER**:
```typescript
// Check if widget is installed
if (!widgetInstallation.installed) {
  // Redirect to one-time setup
  return redirect('/app/onboarding/widget?type=product_page');
}

// Widget is installed - just set metafield, no theme editor needed!
// The metafield is already set in updateBundleProductMetafields()
// Widget will automatically detect and display the bundle

shopify.toast.show('Bundle configured! View it on your storefront.', {
  duration: 5000
});

// Show storefront link instead of theme editor link
const productUrl = `https://${shopDomain}.myshopify.com/products/${bundleProduct.handle}`;
```

#### 2.2 Update Banner Logic

**File**: `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`

**Replace lines ~3192-3235** (Installation banner):

```typescript
{/* ONE-TIME SETUP: Show only if widget not installed */}
{widgetInstallation && !widgetInstallation.installed && (
  <Banner tone="warning">
    <InlineStack gap="400" align="space-between" blockAlign="center">
      <BlockStack gap="100">
        <Text variant="bodyMd" fontWeight="semibold">
          🎯 One-time setup required
        </Text>
        <Text variant="bodySm" tone="subdued">
          Add the Bundle Widget to your theme once. Future bundles will work automatically.
        </Text>
      </BlockStack>
      <Button
        onClick={() => navigate('/app/onboarding/widget?type=product_page')}
        variant="primary"
      >
        Complete Setup
      </Button>
    </InlineStack>
  </Banner>
)}

{/* BUNDLE READY: Show storefront link when widget installed */}
{widgetInstallation && widgetInstallation.installed && bundle.shopifyProductId && bundleProduct && (
  <Banner tone="success">
    <InlineStack gap="400" align="space-between" blockAlign="center">
      <BlockStack gap="100">
        <Text variant="bodyMd" fontWeight="semibold">
          ✅ Bundle is live on your storefront!
        </Text>
        <Text variant="bodySm" tone="subdued">
          The widget automatically detects this bundle. No theme editor configuration needed.
        </Text>
      </BlockStack>
      <Button
        url={`https://${shop.replace('.myshopify.com', '')}.myshopify.com/products/${bundleProduct.handle}`}
        target="_blank"
        external
      >
        View on Storefront
      </Button>
    </InlineStack>
  </Banner>
)}
```

### Phase 3: Update Widget Installation Service

**File**: `app/services/widget-installation.server.ts`

**Add new method**:

```typescript
/**
 * Check if shop has completed one-time widget setup
 * Returns true if widget is installed, false if onboarding needed
 */
static async isShopWidgetInstalled(
  shop: string,
  widgetType: 'product_page' | 'full_page'
): Promise<boolean> {
  const shopRecord = await db.shop.findUnique({
    where: { shopDomain: shop },
    select: {
      productPageWidgetInstalled: true,
      fullPageWidgetInstalled: true
    }
  });

  if (!shopRecord) {
    return false;
  }

  return widgetType === 'product_page'
    ? shopRecord.productPageWidgetInstalled
    : shopRecord.fullPageWidgetInstalled;
}
```

**Update existing methods** to check database flag instead of theme files:

```typescript
static async validateProductBundleWidgetSetup(
  admin: any,
  shop: string,
  apiKey: string,
  bundleId: string,
  shopifyProductId?: string
): Promise<ProductBundleWidgetStatus> {
  // Check database flag (fast, no API call)
  const widgetInstalled = await this.isShopWidgetInstalled(shop, 'product_page');

  if (!widgetInstalled) {
    return {
      widgetInstalled: false,
      requiresOneTimeSetup: true,
      message: 'Complete one-time widget setup to display bundles',
      setupLink: `/app/onboarding/widget?type=product_page`
    };
  }

  // Widget installed - just return storefront link
  if (shopifyProductId) {
    const productHandle = await getProductHandle(admin, shopifyProductId);
    const shopDomain = shop.replace('.myshopify.com', '');

    return {
      widgetInstalled: true,
      requiresOneTimeSetup: false,
      productUrl: `https://${shopDomain}.myshopify.com/products/${productHandle}`,
      message: 'Bundle is live! The widget automatically detects configuration.'
    };
  }

  return {
    widgetInstalled: true,
    requiresOneTimeSetup: false,
    message: 'Widget is installed. Create a bundle product to see it live.'
  };
}
```

### Phase 4: Update App Installation Hook

**File**: `app/shopify.server.ts` or dedicated hook file

```typescript
/**
 * Show onboarding modal on first app installation
 */
export async function afterAuth({ session, admin }: { session: Session; admin: any }) {
  // Check if this is first installation
  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop }
  });

  const isFirstInstall = !shop || !shop.widgetInstalled;

  if (isFirstInstall) {
    // Redirect to onboarding
    return redirect('/app/onboarding/widget');
  }

  // Existing shop - go to dashboard
  return redirect('/app');
}
```

### Phase 5: Testing Checklist

#### New Installation Flow
- [ ] Fresh install redirects to onboarding
- [ ] Onboarding shows both widget types
- [ ] Product page setup link includes `addAppBlockId` ONCE
- [ ] Full page setup link includes `addAppBlockId` ONCE
- [ ] Completing setup marks database flag as true
- [ ] Can create bundles after setup without theme editor

#### Existing Users (Backward Compatibility)
- [ ] Existing installations still work
- [ ] Can detect if widget already installed (via metafield flags)
- [ ] No duplicate blocks created
- [ ] Seamless transition from old flow to new flow

#### Bundle Creation
- [ ] Product page bundles show on product pages automatically
- [ ] Full page bundles show on custom pages automatically
- [ ] No theme editor link shown after widget installed
- [ ] Storefront link works correctly
- [ ] Multiple bundles on same product work

#### Edge Cases
- [ ] User clicks setup but doesn't save → Can retry
- [ ] User uninstalls app → Widget removed automatically
- [ ] User switches themes → Guided to reinstall widget
- [ ] Widget disabled in theme editor → Detected and shown warning

---

## Benefits of This Approach

### For Merchants
✅ **Simpler UX**: Setup once, create unlimited bundles
✅ **No confusion**: Clear one-time setup vs per-bundle configuration
✅ **Faster workflow**: No theme editor for each bundle
✅ **No duplicate blocks**: Impossible to add duplicates

### For Developers
✅ **Shopify compliant**: No prohibited theme modifications
✅ **Cleaner code**: Separation of installation vs configuration
✅ **Better tracking**: Database flag instead of theme file parsing
✅ **Easier debugging**: Clear installation state

### For Performance
✅ **Fewer API calls**: No theme file reads for status checks
✅ **Faster page loads**: Metafield lookups are instant
✅ **Scalable**: Works with unlimited bundles without performance impact

---

## Migration Strategy (For Existing Users)

### Auto-Migration on Next Login

```typescript
// app/routes/app._index.tsx (Dashboard)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Check if user has old-style installation (metafield flags but no database flag)
  const hasMetafieldFlag = await WidgetInstallationFlagsService.isWidgetInstalled(
    admin,
    session.shop,
    'product_page'
  );

  const hasProductPageFlag = await db.shop.findUnique({
    where: { shopDomain: session.shop },
    select: { productPageWidgetInstalled: true }
  });

  // Migrate: If metafield flag exists but database flag doesn't
  if (hasMetafieldFlag && !hasProductPageFlag?.productPageWidgetInstalled) {
    await db.shop.upsert({
      where: { shopDomain: session.shop },
      create: {
        shopDomain: session.shop,
        productPageWidgetInstalled: true,
        widgetInstalledAt: new Date()
      },
      update: {
        productPageWidgetInstalled: true,
        widgetInstalledAt: new Date()
      }
    });

    console.log(`[MIGRATION] Migrated widget installation flag for ${session.shop}`);
  }

  // ... rest of loader
};
```

---

## Timeline

**Phase 1** (Database + Onboarding): 2 days
**Phase 2** (Configure Pages Refactor): 2 days
**Phase 3** (Service Updates): 1 day
**Phase 4** (Installation Hook): 1 day
**Phase 5** (Testing): 2 days

**Total**: ~8 days / 1-2 weeks

---

## Rollout Plan

### Week 1: Development
- Implement database schema
- Create onboarding flow
- Refactor configure pages
- Update services

### Week 2: Testing
- Test with fresh installs
- Test with existing users
- Test edge cases
- Fix bugs

### Week 3: Staged Rollout
- Deploy to 10% of new installs
- Monitor for issues
- Deploy to 50% of new installs
- Deploy to 100%

### Week 4: Migration
- Auto-migrate existing users
- Deprecate old flow
- Update documentation

---

**Status**: Ready for Implementation
**Risk**: Low (backward compatible)
**Impact**: High (better UX, no duplicates, faster workflow)
