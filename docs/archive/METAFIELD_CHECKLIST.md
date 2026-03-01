# Metafield Development Checklist

Quick reference checklist to prevent metafield-related issues.

## ✅ Before Writing Metafield Code

- [ ] **Choose the correct namespace:**
  - `custom` - For merchant-facing data, accessible in Liquid ✅
  - `$app:{app_namespace}` - For app-internal data, restricted access
  - `app` - Legacy, avoid for new code

- [ ] **Verify metafield type matches data:**
  - `json` - For objects/arrays
  - `single_line_text_field` - For simple strings
  - `number_integer` - For integers
  - `boolean` - For true/false values

- [ ] **Document the metafield:**
  ```typescript
  /**
   * @metafield
   * @namespace custom
   * @key all_bundles
   * @type json
   * @description Shop-level bundle configuration
   */
  ```

## ✅ After Writing Save Function

- [ ] **Test the save operation:**
  ```typescript
  // 1. Save via admin
  await saveMetafield(namespace, key, value);

  // 2. Query back to verify
  const result = await admin.graphql(`
    query {
      shop {
        metafield(namespace: "${namespace}", key: "${key}") {
          value
        }
      }
    }
  `);

  // 3. Verify value matches
  expect(result.value).toBe(value);
  ```

- [ ] **Check server logs confirm save:**
  ```
  ✅ [METAFIELD] Saved to custom:all_bundles
  ```

- [ ] **Run GraphQL query in admin:**
  ```graphql
  query {
    shop {
      metafield(namespace: "custom", key: "all_bundles") {
        id
        namespace
        key
        value
      }
    }
  }
  ```

## ✅ Before Reading Metafield in Liquid

- [ ] **Verify namespace matches save function:**
  ```liquid
  {% comment %}
  Reading from: custom:all_bundles
  Written by: app/routes/app.bundles.cart-transform.configure.$bundleId.tsx:649
  {% endcomment %}

  {% assign data = shop.metafields.custom.all_bundles.value %}
  ```

- [ ] **Test Liquid can access metafield:**
  ```liquid
  <script>
    console.log('Metafield test:', {{ shop.metafields.custom.all_bundles.value | json }});
  </script>
  ```

- [ ] **Handle null/undefined cases:**
  ```liquid
  {% if shop.metafields.custom.all_bundles.value %}
    {% assign data = shop.metafields.custom.all_bundles.value %}
  {% else %}
    {% comment %} Fallback logic {% endcomment %}
  {% endif %}
  ```

## ✅ After Reading Metafield in JavaScript

- [ ] **Verify data is loaded:**
  ```javascript
  console.log('Metafield loaded:', !!window.allBundlesData);
  console.log('Data keys:', Object.keys(window.allBundlesData || {}));
  ```

- [ ] **Check data structure is correct:**
  ```javascript
  if (window.allBundlesData) {
    const firstBundle = Object.values(window.allBundlesData)[0];
    console.log('Bundle structure:', {
      hasId: !!firstBundle.id,
      hasName: !!firstBundle.name,
      hasSteps: Array.isArray(firstBundle.steps)
    });
  }
  ```

- [ ] **Test with missing data:**
  ```javascript
  // Temporarily set to empty to test fallback
  window.allBundlesData = {};
  // Your code should handle this gracefully
  ```

## ✅ Integration Testing

- [ ] **Full flow test:**
  1. Save data via admin API
  2. Refresh storefront page
  3. Verify JavaScript receives data
  4. Verify UI renders correctly

- [ ] **Cross-namespace test:**
  ```graphql
  query CheckAllNamespaces {
    shop {
      custom: metafield(namespace: "custom", key: "all_bundles") { value }
      app: metafield(namespace: "$app", key: "all_bundles") { value }
    }
  }
  ```

  ✅ Only ONE should have data (the one you're using)

- [ ] **Cache bust test:**
  - Add `?nocache=123` to URL
  - Verify fresh data loads

## 🚨 Red Flags

Watch out for these warning signs:

- ⚠️ Different namespaces in save vs read code
- ⚠️ Hardcoded namespace strings without constants
- ⚠️ No error handling for null metafields
- ⚠️ No logging of namespace in save/read operations
- ⚠️ Comments don't match actual namespace used
- ⚠️ Multiple metafields with similar names in different namespaces

## 🔧 Quick Debug Script

Paste this in browser console if metafield issues occur:

```javascript
// METAFIELD DEBUG SCRIPT
(async function debugMetafields() {
  console.group('🔍 Metafield Debug Report');

  // 1. Check Liquid-loaded data
  console.log('1️⃣ Liquid Data:', window.allBundlesData);

  // 2. Check expected vs actual
  const widgetElement = document.getElementById('bundle-builder-app');
  const expectedBundleId = widgetElement?.dataset.bundleId;
  const containerBundleId = widgetElement?.dataset.containerBundleId;

  console.log('2️⃣ Expected Bundle ID:', expectedBundleId);
  console.log('2️⃣ Container Bundle ID:', containerBundleId);

  // 3. Check if bundle exists
  if (window.allBundlesData && expectedBundleId) {
    const bundle = window.allBundlesData[expectedBundleId];
    console.log('3️⃣ Bundle Found:', !!bundle);

    if (bundle) {
      console.log('3️⃣ Bundle Object ID:', bundle.id);
      console.log('3️⃣ ID Match:', bundle.id === expectedBundleId);

      if (bundle.id !== expectedBundleId) {
        console.error('❌ MISMATCH! Object key != bundle.id');
        console.error('   Key:', expectedBundleId);
        console.error('   Object ID:', bundle.id);
      }
    }
  }

  // 4. List all bundles
  const allBundleIds = window.allBundlesData ? Object.keys(window.allBundlesData) : [];
  console.log('4️⃣ All Bundle IDs in Metafield:', allBundleIds);

  // 5. Check for ID mismatches in all bundles
  if (window.allBundlesData) {
    Object.entries(window.allBundlesData).forEach(([key, bundle]) => {
      if (bundle.id !== key) {
        console.error(`❌ Mismatch in bundle: key="${key}", id="${bundle.id}"`);
      }
    });
  }

  console.groupEnd();
})();
```

## 📝 Code Template

Use this template for consistent metafield operations:

```typescript
// config/metafields.ts
export const METAFIELDS = {
  SHOP_BUNDLES: {
    namespace: 'custom',
    key: 'all_bundles',
    type: 'json',
    owner: 'SHOP'
  },
  BUNDLE_CONFIG: {
    namespace: 'bundle_discounts',
    key: 'cart_transform_config',
    type: 'json',
    owner: 'PRODUCT'
  }
} as const;

// Usage in save function
import { METAFIELDS } from '../config/metafields';

const metafield = {
  ownerId: shopGlobalId,
  ...METAFIELDS.SHOP_BUNDLES,
  value: JSON.stringify(data)
};

// Usage in Liquid (add to template comments)
{% comment %}
Reading from: {{ METAFIELDS.SHOP_BUNDLES.namespace }}:{{ METAFIELDS.SHOP_BUNDLES.key }}
{% endcomment %}
```

---

**Print this checklist and keep it nearby during metafield development!**
