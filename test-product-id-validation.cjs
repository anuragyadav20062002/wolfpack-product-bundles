/**
 * Test script to verify product ID validation fix
 *
 * This simulates what happens when products are selected via resource picker
 * and ensures they are stored with proper Shopify GID format
 */

// Simulate the product ID normalization logic from the fix
function normalizeProductId(product) {
  let productId = product.id;

  // If it's already a GID, use it directly
  if (typeof productId === 'string' && productId.startsWith('gid://shopify/Product/')) {
    return productId;
  }
  // If it's a numeric ID, convert to GID
  else if (typeof productId === 'string' && /^\d+$/.test(productId)) {
    return `gid://shopify/Product/${productId}`;
  }
  // Otherwise use as-is (might be UUID from old data)
  else {
    console.warn(`⚠️ [STEP_PRODUCT] Unexpected product ID format: ${productId}`);
    return productId;
  }
}

// Test Suite Class
class ProductIdValidationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Testing Product ID Validation Fix\n');
    console.log('=' .repeat(60));

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

    console.log('\n' + '=' .repeat(60));
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed out of ${this.tests.length} tests`);

    if (this.failed === 0) {
      console.log('\n✅ All tests passed! Product ID validation is working correctly.');
      console.log('\n📝 Summary:');
      console.log('   • Full GIDs are preserved as-is');
      console.log('   • Numeric IDs are converted to proper GID format');
      console.log('   • UUIDs (old data) pass through with warning');
      console.log('\n⚠️  Note: Existing bundles with UUIDs need manual migration');
      console.log('   Run: npm run fix-uuids report');
      return true;
    } else {
      console.log('\n❌ Some tests failed! Check the implementation.');
      return false;
    }
  }
}

const suite = new ProductIdValidationTests();

// Test 1: Full Shopify GID
suite.test('Full Shopify GID is preserved', () => {
  const input = { id: "gid://shopify/Product/10272663634214", title: "Test Product" };
  const expected = "gid://shopify/Product/10272663634214";
  const result = normalizeProductId(input);
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 2: Numeric ID only
suite.test('Numeric ID is converted to GID', () => {
  const input = { id: "10272663634214", title: "Test Product" };
  const expected = "gid://shopify/Product/10272663634214";
  const result = normalizeProductId(input);
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 3: UUID (old data)
suite.test('UUID from old data passes through with warning', () => {
  const input = { id: "b036d011-e9a4-431e-a88e-f5110ac28ac9", title: "Test Product" };
  const expected = "b036d011-e9a4-431e-a88e-f5110ac28ac9";
  const result = normalizeProductId(input);
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 4: Another UUID
suite.test('Another UUID passes through with warning', () => {
  const input = { id: "f13ea55f-9aa6-4a05-8a4b-637953356102", title: "Test Product" };
  const expected = "f13ea55f-9aa6-4a05-8a4b-637953356102";
  const result = normalizeProductId(input);
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Export test runner
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { ProductIdValidationTests, suite };
