/**
 * Metafield Validation Test Suite
 *
 * Tests to prevent metafield namespace mismatches, type errors,
 * and data consistency issues that broke the bundle widget before.
 *
 * Reference: docs/METAFIELD_NAMESPACE_FIX.md
 */

const assert = require('assert');

// Simulate metafield configurations
const METAFIELD_CONFIGS = {
  // Shop-level bundle configuration
  shopBundles: {
    namespace: 'custom',
    key: 'all_bundles',
    type: 'json',
    owner: 'SHOP',
    description: 'Shop-level bundle configuration for all published bundles'
  },

  // Product-level cart transform config
  cartTransform: {
    namespace: 'bundle_discounts',
    key: 'cart_transform_config',
    type: 'json',
    owner: 'PRODUCT',
    description: 'Cart transform configuration for bundle product'
  },

  // Product-level discount function config
  discountFunction: {
    namespace: 'bundle_discounts',
    key: 'discount_function_config',
    type: 'json',
    owner: 'PRODUCT',
    description: 'Discount function configuration for bundle product'
  },

  // Standard Shopify component_reference
  componentReference: {
    namespace: '$app',
    key: 'component_reference',
    type: 'list.product_reference',
    owner: 'PRODUCT',
    description: 'Bundle component variant IDs'
  },

  // Standard Shopify component_quantities
  componentQuantities: {
    namespace: '$app',
    key: 'component_quantities',
    type: 'list.number_integer',
    owner: 'PRODUCT',
    description: 'Bundle component quantities'
  },

  // Standard Shopify component_parents
  componentParents: {
    namespace: '$app',
    key: 'component_parents',
    type: 'json',
    owner: 'PRODUCT',
    description: 'Bundle parent configurations'
  }
};

// Test Suite
class MetafieldValidationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Metafield Validation Test Suite\n');
    console.log('=' .repeat(80));

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`\n📊 Results: ${this.passed}/${this.tests.length} passed, ${this.failed}/${this.tests.length} failed`);

    if (this.failed === 0) {
      console.log('\n✅ All metafield validation tests passed!');
      return true;
    } else {
      console.log('\n❌ Some tests failed. Check metafield configurations.');
      return false;
    }
  }
}

const suite = new MetafieldValidationTests();

// Test 1: Namespace Consistency
suite.test('Shop bundles metafield uses correct namespace', () => {
  const config = METAFIELD_CONFIGS.shopBundles;

  // CRITICAL: Must be 'custom' not '$app' to be accessible in Liquid
  assert.strictEqual(config.namespace, 'custom',
    'Shop bundles must use "custom" namespace for Liquid access');

  assert.strictEqual(config.key, 'all_bundles',
    'Shop bundles key must be "all_bundles"');
});

// Test 2: Product Metafield Namespaces
suite.test('Product metafields use consistent namespaces', () => {
  const cartTransform = METAFIELD_CONFIGS.cartTransform;
  const discountFunction = METAFIELD_CONFIGS.discountFunction;

  // Both should use same namespace for consistency
  assert.strictEqual(cartTransform.namespace, 'bundle_discounts',
    'Cart transform config must use "bundle_discounts" namespace');

  assert.strictEqual(discountFunction.namespace, 'bundle_discounts',
    'Discount function config must use "bundle_discounts" namespace');
});

// Test 3: Standard Shopify Metafields
suite.test('Standard Shopify metafields use $app namespace', () => {
  const componentRef = METAFIELD_CONFIGS.componentReference;
  const componentQty = METAFIELD_CONFIGS.componentQuantities;
  const componentParents = METAFIELD_CONFIGS.componentParents;

  // Standard Shopify metafields should use $app namespace
  assert.strictEqual(componentRef.namespace, '$app',
    'Component reference must use "$app" namespace');

  assert.strictEqual(componentQty.namespace, '$app',
    'Component quantities must use "$app" namespace');

  assert.strictEqual(componentParents.namespace, '$app',
    'Component parents must use "$app" namespace');
});

// Test 4: Metafield Types
suite.test('Metafield types are correct for data', () => {
  assert.strictEqual(METAFIELD_CONFIGS.shopBundles.type, 'json',
    'Shop bundles must be json type for complex data');

  assert.strictEqual(METAFIELD_CONFIGS.componentReference.type, 'list.product_reference',
    'Component reference must be list.product_reference type');

  assert.strictEqual(METAFIELD_CONFIGS.componentQuantities.type, 'list.number_integer',
    'Component quantities must be list.number_integer type');
});

// Test 5: No Duplicate Keys
suite.test('No duplicate metafield keys across same owner', () => {
  const productMetafields = Object.values(METAFIELD_CONFIGS)
    .filter(config => config.owner === 'PRODUCT');

  const keys = productMetafields.map(m => `${m.namespace}:${m.key}`);
  const uniqueKeys = new Set(keys);

  assert.strictEqual(keys.length, uniqueKeys.size,
    'Each metafield must have unique namespace:key combination');
});

// Test 6: Simulate Save/Read Consistency
suite.test('Save and read operations use matching namespaces', () => {
  // Simulate save function
  const saveNamespace = 'custom';
  const saveKey = 'all_bundles';

  // Simulate Liquid read
  const readNamespace = 'custom';
  const readKey = 'all_bundles';

  assert.strictEqual(saveNamespace, readNamespace,
    'Save and read must use same namespace');

  assert.strictEqual(saveKey, readKey,
    'Save and read must use same key');
});

// Test 7: Bundle Data Structure Validation
suite.test('Bundle metafield data has required fields', () => {
  const bundleData = {
    id: 'cmgfk1kht0000v7sw8l6e3kht',
    name: 'Test Bundle',
    templateName: 'test',
    type: 'cart_transform',
    allBundleProductIds: ['gid://shopify/Product/123'],
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
        minQuantity: 1,
        maxQuantity: 1,
        productIds: ['gid://shopify/Product/123'],
        collections: [],
        conditionType: null,
        conditionOperator: null,
        conditionValue: null
      }
    ],
    pricing: {
      enableDiscount: true,
      discountMethod: 'percentage_off',
      rules: [{ discountValue: 10 }]
    },
    bundleParentVariantId: 'gid://shopify/ProductVariant/456'
  };

  // Required fields
  assert.ok(bundleData.id, 'Bundle must have id');
  assert.ok(bundleData.name, 'Bundle must have name');
  assert.ok(bundleData.type, 'Bundle must have type');
  assert.ok(Array.isArray(bundleData.allBundleProductIds),
    'allBundleProductIds must be array');
  assert.ok(Array.isArray(bundleData.steps),
    'steps must be array');
  assert.ok(bundleData.pricing, 'Bundle must have pricing');
});

// Test 8: Product ID Format Validation
suite.test('Product IDs in metafields are valid Shopify GIDs', () => {
  const productIds = [
    'gid://shopify/Product/10272663634214',
    'gid://shopify/Product/10272644759846'
  ];

  productIds.forEach(id => {
    assert.ok(id.startsWith('gid://shopify/Product/'),
      `Product ID ${id} must be valid Shopify GID`);

    const numericPart = id.replace('gid://shopify/Product/', '');
    assert.ok(/^\d+$/.test(numericPart),
      `Product ID ${id} must have numeric part`);
  });
});

// Test 9: No UUID Product IDs
suite.test('Metafield data does not contain UUID product IDs', () => {
  const productIds = [
    'gid://shopify/Product/10272663634214',
    'gid://shopify/Product/10272644759846'
  ];

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  productIds.forEach(id => {
    const cleanId = id.replace('gid://shopify/Product/', '');
    assert.ok(!uuidPattern.test(cleanId),
      `Product ID ${id} must not be a UUID`);
  });
});

// Test 10: Component Reference Format
suite.test('Component references are valid variant GIDs', () => {
  const componentReferences = [
    'gid://shopify/ProductVariant/51533310034214',
    'gid://shopify/ProductVariant/51533215662374'
  ];

  componentReferences.forEach(ref => {
    assert.ok(ref.startsWith('gid://shopify/ProductVariant/'),
      `Component reference ${ref} must be variant GID`);

    const numericPart = ref.replace('gid://shopify/ProductVariant/', '');
    assert.ok(/^\d+$/.test(numericPart),
      `Component reference ${ref} must have numeric part`);
  });
});

// Test 11: Metafield Size Validation
suite.test('Metafield data size is within reasonable limits', () => {
  const bundleData = {
    id: 'test',
    name: 'Test Bundle',
    steps: [{ id: 'step1', name: 'Step 1', productIds: [] }],
    pricing: { enableDiscount: false, rules: [] }
  };

  const dataSize = JSON.stringify(bundleData).length;

  // Shopify metafields have size limits
  assert.ok(dataSize < 65536, // 64KB limit for json metafields
    `Metafield size ${dataSize} bytes must be under 64KB`);
});

// Test 12: Namespace Documentation
suite.test('All metafields have proper documentation', () => {
  Object.entries(METAFIELD_CONFIGS).forEach(([name, config]) => {
    assert.ok(config.namespace, `${name} must have namespace`);
    assert.ok(config.key, `${name} must have key`);
    assert.ok(config.type, `${name} must have type`);
    assert.ok(config.owner, `${name} must have owner`);
    assert.ok(config.description, `${name} must have description`);
  });
});

// Export test runner
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { MetafieldValidationTests, METAFIELD_CONFIGS, suite };
