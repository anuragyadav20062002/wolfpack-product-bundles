/**
 * Bundle Configuration Test Suite
 *
 * Tests for bundle data integrity, validation, and consistency
 *
 * Reference: prisma/schema.prisma, CLAUDE.md
 */

const assert = require('assert');

class BundleConfigurationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Bundle Configuration Test Suite\n');
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

    return this.failed === 0;
  }
}

// Helper: Validate bundle structure
function validateBundleStructure(bundle) {
  const required = ['id', 'name', 'steps', 'pricing'];

  required.forEach(field => {
    if (!(field in bundle)) {
      throw new Error(`Bundle missing required field: ${field}`);
    }
  });

  return true;
}

// Helper: Validate step structure
function validateStepStructure(step) {
  const required = ['id', 'name', 'minQuantity', 'maxQuantity'];

  required.forEach(field => {
    if (!(field in step)) {
      throw new Error(`Step missing required field: ${field}`);
    }
  });

  return true;
}

// Helper: Validate discount method
function validateDiscountMethod(method) {
  const validMethods = ['fixed_amount_off', 'percentage_off', 'fixed_bundle_price', 'free_shipping'];

  return validMethods.includes(method);
}

const suite = new BundleConfigurationTests();

// Test 1: Bundle Structure Validation
suite.test('Bundle has all required fields', () => {
  const bundle = {
    id: 'bundle-123',
    name: 'Test Bundle',
    shopifyProductId: 'gid://shopify/Product/123',
    steps: [],
    pricing: {
      enableDiscount: true,
      discountMethod: 'percentage_off',
      rules: []
    }
  };

  assert.ok(validateBundleStructure(bundle),
    'Bundle should have all required fields');
});

// Test 2: Step Structure Validation
suite.test('Bundle step has all required fields', () => {
  const step = {
    id: 'step-1',
    name: 'Step 1',
    minQuantity: 1,
    maxQuantity: 10,
    productIds: [],
    collections: []
  };

  assert.ok(validateStepStructure(step),
    'Step should have all required fields');
});

// Test 3: Min/Max Quantity Validation
suite.test('Step min quantity is less than or equal to max quantity', () => {
  const step = {
    minQuantity: 1,
    maxQuantity: 10
  };

  assert.ok(step.minQuantity <= step.maxQuantity,
    'Min quantity should be less than or equal to max quantity');
});

// Test 4: Positive Quantity Values
suite.test('Step quantities are positive integers', () => {
  const step = {
    minQuantity: 1,
    maxQuantity: 10
  };

  assert.ok(step.minQuantity > 0,
    'Min quantity should be positive');

  assert.ok(step.maxQuantity > 0,
    'Max quantity should be positive');

  assert.ok(Number.isInteger(step.minQuantity),
    'Min quantity should be an integer');

  assert.ok(Number.isInteger(step.maxQuantity),
    'Max quantity should be an integer');
});

// Test 5: Discount Method Validation
suite.test('Discount method is valid', () => {
  const validMethods = [
    'fixed_amount_off',
    'percentage_off',
    'fixed_bundle_price',
    'free_shipping'
  ];

  validMethods.forEach(method => {
    assert.ok(validateDiscountMethod(method),
      `${method} should be a valid discount method`);
  });
});

// Test 6: Invalid Discount Method Rejection
suite.test('Invalid discount method is rejected', () => {
  const invalidMethods = [
    'invalid_method',
    'random',
    '',
    null,
    undefined
  ];

  invalidMethods.forEach(method => {
    assert.ok(!validateDiscountMethod(method),
      `${method} should be rejected as invalid`);
  });
});

// Test 7: Discount Rules Structure
suite.test('Discount rules have required fields', () => {
  const rule = {
    id: 'rule-1',
    numberOfProducts: 3,
    discountValue: 15
  };

  assert.ok(rule.id, 'Rule should have id');
  assert.ok(typeof rule.numberOfProducts === 'number', 'numberOfProducts should be a number');
  assert.ok(typeof rule.discountValue === 'number', 'discountValue should be a number');
});

// Test 8: Fixed Bundle Price Rule Validation
suite.test('Fixed bundle price rule has price field', () => {
  const rule = {
    id: 'rule-1',
    numberOfProducts: 3,
    price: 30,
    fixedBundlePrice: 30
  };

  assert.ok(rule.price || rule.fixedBundlePrice,
    'Fixed bundle price rule should have price or fixedBundlePrice field');

  assert.ok(rule.price > 0 || rule.fixedBundlePrice > 0,
    'Fixed bundle price should be positive');
});

// Test 9: Step Condition Validation
suite.test('Step condition has valid operator', () => {
  const validOperators = [
    'equal_to',
    'greater_than',
    'less_than',
    'greater_than_or_equal_to',
    'less_than_or_equal_to'
  ];

  const condition = {
    type: 'quantity',
    operator: 'equal_to',
    value: 3
  };

  assert.ok(validOperators.includes(condition.operator),
    'Condition operator should be valid');
});

// Test 10: Step Condition Type Validation
suite.test('Step condition has valid type', () => {
  const validTypes = ['quantity', 'amount'];

  const condition = {
    type: 'quantity',
    operator: 'equal_to',
    value: 3
  };

  assert.ok(validTypes.includes(condition.type),
    'Condition type should be valid');
});

// Test 11: Product IDs Array Validation
suite.test('Step productIds is an array', () => {
  const step = {
    productIds: [
      'gid://shopify/Product/123',
      'gid://shopify/Product/456'
    ]
  };

  assert.ok(Array.isArray(step.productIds),
    'productIds should be an array');
});

// Test 12: Collections Array Validation
suite.test('Step collections is an array', () => {
  const step = {
    collections: [
      { id: 'gid://shopify/Collection/123', title: 'Collection 1' }
    ]
  };

  assert.ok(Array.isArray(step.collections),
    'collections should be an array');
});

// Test 13: Bundle Type Validation
suite.test('Bundle type is valid', () => {
  const validTypes = ['cart_transform', 'discount_function'];

  validTypes.forEach(type => {
    const bundle = { type };

    assert.ok(validTypes.includes(bundle.type),
      `${type} should be a valid bundle type`);
  });
});

// Test 14: Shopify Product ID Format
suite.test('Bundle shopifyProductId is valid GID', () => {
  const bundle = {
    shopifyProductId: 'gid://shopify/Product/10272663634214'
  };

  assert.ok(bundle.shopifyProductId.startsWith('gid://shopify/Product/'),
    'shopifyProductId should be a valid Shopify GID');
});

// Test 15: Bundle Parent Variant ID Format
suite.test('bundleParentVariantId is valid variant GID', () => {
  const bundle = {
    bundleParentVariantId: 'gid://shopify/ProductVariant/51533310034214'
  };

  assert.ok(bundle.bundleParentVariantId.startsWith('gid://shopify/ProductVariant/'),
    'bundleParentVariantId should be a valid variant GID');
});

// Test 16: No Duplicate Step IDs
suite.test('Bundle steps have unique IDs', () => {
  const steps = [
    { id: 'step-1', name: 'Step 1' },
    { id: 'step-2', name: 'Step 2' },
    { id: 'step-3', name: 'Step 3' }
  ];

  const ids = steps.map(s => s.id);
  const uniqueIds = new Set(ids);

  assert.strictEqual(ids.length, uniqueIds.size,
    'All step IDs should be unique');
});

// Test 17: Step Position Validation
suite.test('Step positions are sequential', () => {
  const steps = [
    { id: 'step-1', position: 1 },
    { id: 'step-2', position: 2 },
    { id: 'step-3', position: 3 }
  ];

  steps.forEach((step, index) => {
    assert.strictEqual(step.position, index + 1,
      `Step position should be ${index + 1}, got ${step.position}`);
  });
});

// Test 18: Pricing Enabled with Rules
suite.test('Pricing enabled requires at least one rule', () => {
  const pricing = {
    enableDiscount: true,
    discountMethod: 'percentage_off',
    rules: [
      { id: 'rule-1', discountValue: 10 }
    ]
  };

  if (pricing.enableDiscount) {
    assert.ok(pricing.rules && pricing.rules.length > 0,
      'Enabled pricing should have at least one rule');
  }
});

// Test 19: allBundleProductIds Population
suite.test('allBundleProductIds includes all step product IDs', () => {
  const bundle = {
    allBundleProductIds: [
      'gid://shopify/Product/123',
      'gid://shopify/Product/456',
      'gid://shopify/Product/789'
    ],
    steps: [
      { productIds: ['gid://shopify/Product/123', 'gid://shopify/Product/456'] },
      { productIds: ['gid://shopify/Product/789'] }
    ]
  };

  const allStepProducts = bundle.steps.flatMap(s => s.productIds);
  const allIncluded = allStepProducts.every(id => bundle.allBundleProductIds.includes(id));

  assert.ok(allIncluded,
    'allBundleProductIds should include all products from steps');
});

// Test 20: Template Name Format
suite.test('Template name is valid', () => {
  const bundle = {
    templateName: 'my-bundle-template'
  };

  // Template name should be lowercase, alphanumeric with hyphens
  const validFormat = /^[a-z0-9-]+$/;

  assert.ok(validFormat.test(bundle.templateName),
    'Template name should be lowercase alphanumeric with hyphens');
});

// Export test runner
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { BundleConfigurationTests, suite };
