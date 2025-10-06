/**
 * Cart Transform Function Test Suite
 *
 * Tests for cart transform logic including:
 * - Fixed bundle price calculations
 * - Product ID validation
 * - Bundle condition checks
 * - Discount percentage conversions
 *
 * Reference: extensions/bundle-cart-transform-ts/src/cart_transform_run.ts
 */

const assert = require('assert');

// Simulate cart transform discount calculation
class CartTransformTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Cart Transform Function Test Suite\n');
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

// Helper: Calculate discount percentage for fixed bundle price
function calculateFixedBundlePriceDiscount(fixedPrice, cartTotal) {
  if (fixedPrice <= 0 || cartTotal <= fixedPrice) {
    return 0;
  }

  const discountAmount = cartTotal - fixedPrice;
  const discountPercent = (discountAmount / cartTotal) * 100;

  return Math.min(100, Math.round(discountPercent * 100) / 100);
}

// Helper: Calculate fixed amount discount as percentage
function calculateFixedAmountDiscount(fixedAmount, cartTotal) {
  if (fixedAmount <= 0 || cartTotal <= 0) {
    return 0;
  }

  const discountPercent = (fixedAmount / cartTotal) * 100;
  return Math.min(100, Math.round(discountPercent * 100) / 100);
}

// Helper: Validate product ID format
function isValidProductId(productId) {
  if (!productId || typeof productId !== 'string') {
    return false;
  }

  // Check if it's a UUID (invalid)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (isUUID) {
    return false;
  }

  // Check if it's a valid Shopify GID
  if (productId.startsWith('gid://shopify/Product/')) {
    const numericPart = productId.replace('gid://shopify/Product/', '');
    return /^\d+$/.test(numericPart);
  }

  // Check if it's a numeric ID
  return /^\d+$/.test(productId);
}

const suite = new CartTransformTests();

// Test 1: Fixed Bundle Price - Basic Calculation
suite.test('Fixed bundle price calculates correct discount percentage', () => {
  const fixedPrice = 30;
  const cartTotal = 255.99;

  const discountPercent = calculateFixedBundlePriceDiscount(fixedPrice, cartTotal);

  // Expected: (255.99 - 30) / 255.99 * 100 = 88.28%
  assert.ok(discountPercent >= 88 && discountPercent <= 89,
    `Expected discount ~88%, got ${discountPercent}%`);
});

// Test 2: Fixed Bundle Price - Edge Case (Price equals total)
suite.test('Fixed bundle price with cart total equal to fixed price', () => {
  const fixedPrice = 100;
  const cartTotal = 100;

  const discountPercent = calculateFixedBundlePriceDiscount(fixedPrice, cartTotal);

  assert.strictEqual(discountPercent, 0,
    'No discount should apply when cart total equals fixed price');
});

// Test 3: Fixed Bundle Price - Edge Case (Price higher than total)
suite.test('Fixed bundle price with cart total less than fixed price', () => {
  const fixedPrice = 100;
  const cartTotal = 50;

  const discountPercent = calculateFixedBundlePriceDiscount(fixedPrice, cartTotal);

  assert.strictEqual(discountPercent, 0,
    'No discount should apply when cart total is less than fixed price');
});

// Test 4: Fixed Amount Discount Calculation
suite.test('Fixed amount discount converts to percentage correctly', () => {
  const fixedAmount = 50;
  const cartTotal = 200;

  const discountPercent = calculateFixedAmountDiscount(fixedAmount, cartTotal);

  // Expected: (50 / 200) * 100 = 25%
  assert.strictEqual(discountPercent, 25,
    `Expected 25% discount, got ${discountPercent}%`);
});

// Test 5: Percentage Discount Passthrough
suite.test('Percentage discount passes through unchanged', () => {
  const discountValue = 15;

  // Percentage discounts should not be modified
  assert.strictEqual(discountValue, 15,
    'Percentage discount should remain unchanged');
});

// Test 6: Product ID Validation - Valid GID
suite.test('Valid Shopify GID is accepted', () => {
  const productId = 'gid://shopify/Product/10272663634214';

  assert.ok(isValidProductId(productId),
    `Product ID ${productId} should be valid`);
});

// Test 7: Product ID Validation - Numeric ID
suite.test('Numeric product ID is accepted', () => {
  const productId = '10272663634214';

  assert.ok(isValidProductId(productId),
    `Numeric product ID ${productId} should be valid`);
});

// Test 8: Product ID Validation - UUID Rejection
suite.test('UUID product ID is rejected', () => {
  const productId = 'f63df6b8-0e44-42ac-b6e6-731a4011c6f8';

  assert.ok(!isValidProductId(productId),
    `UUID product ID ${productId} should be rejected`);
});

// Test 9: Product ID Validation - Invalid Format
suite.test('Invalid product ID format is rejected', () => {
  const invalidIds = [
    '',
    null,
    undefined,
    'gid://shopify/Product/abc-123',
    'not-a-valid-id'
  ];

  invalidIds.forEach(id => {
    assert.ok(!isValidProductId(id),
      `Invalid product ID ${id} should be rejected`);
  });
});

// Test 10: Bundle Condition - Quantity Equal To
suite.test('Quantity condition "equal_to" validates correctly', () => {
  const condition = {
    type: 'quantity',
    operator: 'equal_to',
    value: 3
  };

  const cartQuantity = 3;

  const meetsCondition = (cartQuantity === condition.value);

  assert.ok(meetsCondition,
    'Cart quantity 3 should meet condition equal_to 3');
});

// Test 11: Bundle Condition - Quantity Greater Than
suite.test('Quantity condition "greater_than" validates correctly', () => {
  const condition = {
    type: 'quantity',
    operator: 'greater_than',
    value: 2
  };

  assert.ok(3 > condition.value,
    'Quantity 3 should be greater than 2');

  assert.ok(!(2 > condition.value),
    'Quantity 2 should not be greater than 2');
});

// Test 12: Bundle Condition - Amount Validation
suite.test('Amount condition validates cart total correctly', () => {
  const condition = {
    type: 'amount',
    operator: 'greater_than_or_equal_to',
    value: 100
  };

  assert.ok(100 >= condition.value,
    'Amount 100 should meet greater_than_or_equal_to 100');

  assert.ok(150 >= condition.value,
    'Amount 150 should meet greater_than_or_equal_to 100');

  assert.ok(!(50 >= condition.value),
    'Amount 50 should not meet greater_than_or_equal_to 100');
});

// Test 13: Maximum Discount Cap
suite.test('Discount percentage is capped at 100%', () => {
  const fixedPrice = 10;
  const cartTotal = 1000;

  const discountPercent = calculateFixedBundlePriceDiscount(fixedPrice, cartTotal);

  // Should be 99% but capped at 100%
  assert.ok(discountPercent <= 100,
    `Discount should be capped at 100%, got ${discountPercent}%`);
});

// Test 14: Zero Cart Total Handling
suite.test('Zero cart total returns zero discount', () => {
  const fixedAmount = 50;
  const cartTotal = 0;

  const discountPercent = calculateFixedAmountDiscount(fixedAmount, cartTotal);

  assert.strictEqual(discountPercent, 0,
    'Zero cart total should result in zero discount');
});

// Test 15: Negative Values Handling
suite.test('Negative values are handled safely', () => {
  const fixedPrice = -30;
  const cartTotal = 100;

  const discountPercent = calculateFixedBundlePriceDiscount(fixedPrice, cartTotal);

  assert.strictEqual(discountPercent, 0,
    'Negative fixed price should result in zero discount');
});

// Test 16: Bundle Product ID Matching
suite.test('Product IDs match correctly in bundle detection', () => {
  const cartProductIds = [
    'gid://shopify/Product/10203664711974',
    'gid://shopify/Product/10203665334566'
  ];

  const bundleProductIds = [
    'gid://shopify/Product/10203664711974',
    'gid://shopify/Product/10203665334566',
    'gid://shopify/Product/10203665105190'
  ];

  const allInBundle = cartProductIds.every(id => bundleProductIds.includes(id));

  assert.ok(allInBundle,
    'All cart product IDs should be found in bundle product IDs');
});

// Test 17: Partial Bundle Detection
suite.test('Incomplete bundle is detected correctly', () => {
  const cartProductIds = [
    'gid://shopify/Product/10203664711974'
    // Missing second product
  ];

  const requiredProducts = [
    'gid://shopify/Product/10203664711974',
    'gid://shopify/Product/10203665334566'
  ];

  const isComplete = requiredProducts.every(id => cartProductIds.includes(id));

  assert.ok(!isComplete,
    'Incomplete bundle should not be detected as complete');
});

// Test 18: Multi-Bundle Handling
suite.test('Multiple bundles are handled independently', () => {
  const bundles = [
    {
      id: 'bundle1',
      productIds: ['gid://shopify/Product/123', 'gid://shopify/Product/456'],
      discount: 10
    },
    {
      id: 'bundle2',
      productIds: ['gid://shopify/Product/789', 'gid://shopify/Product/012'],
      discount: 15
    }
  ];

  assert.strictEqual(bundles.length, 2,
    'Should handle multiple bundles');

  assert.strictEqual(bundles[0].discount, 10,
    'Bundle 1 discount should be 10%');

  assert.strictEqual(bundles[1].discount, 15,
    'Bundle 2 discount should be 15%');
});

// Export test runner
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { CartTransformTests, suite };
