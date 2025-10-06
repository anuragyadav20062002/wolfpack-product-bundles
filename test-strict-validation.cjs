/**
 * Test script to verify strict product ID validation
 *
 * This simulates the validation logic that now throws errors for invalid IDs
 */

// Simulate the strict validation logic
function validateProductId(product) {
  let productId = product.id;

  if (!productId || typeof productId !== 'string') {
    throw new Error(`Invalid product ID: Product ID is required and must be a string. Got: ${typeof productId}`);
  }

  // Check if it's a UUID (reject immediately)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (isUUID) {
    throw new Error(
      `Invalid product ID: UUID detected "${productId}" for product "${product.title || product.name}". ` +
      `Only Shopify product IDs are allowed. Please re-select the product using the product picker.`
    );
  }

  // Normalize to Shopify GID format
  if (productId.startsWith('gid://shopify/Product/')) {
    // Already in correct format - validate it's numeric after the prefix
    const numericId = productId.replace('gid://shopify/Product/', '');
    if (!/^\d+$/.test(numericId)) {
      throw new Error(
        `Invalid product ID format: "${productId}" for product "${product.title || product.name}". ` +
        `Shopify product IDs must be numeric. Expected format: gid://shopify/Product/123456`
      );
    }
    // Valid Shopify GID
    return productId;
  } else if (/^\d+$/.test(productId)) {
    // Numeric ID - convert to GID
    return `gid://shopify/Product/${productId}`;
  } else {
    // Invalid format - reject
    throw new Error(
      `Invalid product ID format: "${productId}" for product "${product.title || product.name}". ` +
      `Expected Shopify GID (gid://shopify/Product/123456) or numeric ID (123456).`
    );
  }
}

// Test Suite Class
class StrictValidationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Testing Strict Product ID Validation\n');
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
    console.log(`\n📊 Test Results: ${this.passed}/${this.tests.length} passed, ${this.failed}/${this.tests.length} failed`);

    if (this.failed === 0) {
      console.log('\n✅ ALL TESTS PASSED! Strict validation is working correctly.');
      console.log('\n📝 Validation Rules:');
      console.log('   ✅ Accept: Shopify GIDs (gid://shopify/Product/123456)');
      console.log('   ✅ Accept: Numeric IDs (123456) - auto-converted to GID');
      console.log('   ❌ Reject: UUIDs (any UUID format)');
      console.log('   ❌ Reject: Empty/null/undefined');
      console.log('   ❌ Reject: Non-numeric GIDs');
      console.log('   ❌ Reject: Random strings');
      console.log('\n⚠️  Impact:');
      console.log('   • Bundles with UUID product IDs CANNOT be saved');
      console.log('   • User will see clear error message');
      console.log('   • Forces migration of old bundles before re-saving');
      return true;
    } else {
      console.log('\n❌ SOME TESTS FAILED! Check the validation logic.');
      return false;
    }
  }
}

const suite = new StrictValidationTests();

// Test 1: Valid Shopify GID
suite.test('Valid Shopify GID is accepted', () => {
  const input = { id: "gid://shopify/Product/10272663634214", title: "Test Product" };
  const result = validateProductId(input);
  if (result !== "gid://shopify/Product/10272663634214") {
    throw new Error(`Expected gid://shopify/Product/10272663634214, got ${result}`);
  }
});

// Test 2: Valid numeric ID
suite.test('Valid numeric ID is accepted and converted', () => {
  const input = { id: "10272663634214", title: "Test Product" };
  const result = validateProductId(input);
  if (result !== "gid://shopify/Product/10272663634214") {
    throw new Error(`Expected gid://shopify/Product/10272663634214, got ${result}`);
  }
});

// Test 3: UUID (should be rejected)
suite.test('UUID is rejected with clear error', () => {
  const input = { id: "b036d011-e9a4-431e-a88e-f5110ac28ac9", title: "Amber Essence" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for UUID');
  } catch (error) {
    if (!error.message.includes('UUID detected')) {
      throw new Error(`Expected "UUID detected" in error, got: ${error.message}`);
    }
  }
});

// Test 4: Another UUID
suite.test('Another UUID is rejected', () => {
  const input = { id: "f63df6b8-0e44-42ac-b6e6-731a4011c6f8", title: "Crystal Lagoon" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for UUID');
  } catch (error) {
    if (!error.message.includes('UUID detected')) {
      throw new Error(`Expected "UUID detected" in error, got: ${error.message}`);
    }
  }
});

// Test 5: Empty string
suite.test('Empty string is rejected', () => {
  const input = { id: "", title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for empty string');
  } catch (error) {
    if (!error.message.includes('required and must be a string')) {
      throw new Error(`Expected "required and must be a string" in error, got: ${error.message}`);
    }
  }
});

// Test 6: Null ID
suite.test('Null ID is rejected', () => {
  const input = { id: null, title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for null');
  } catch (error) {
    if (!error.message.includes('required and must be a string')) {
      throw new Error(`Expected "required and must be a string" in error, got: ${error.message}`);
    }
  }
});

// Test 7: Undefined ID
suite.test('Undefined ID is rejected', () => {
  const input = { id: undefined, title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for undefined');
  } catch (error) {
    if (!error.message.includes('required and must be a string')) {
      throw new Error(`Expected "required and must be a string" in error, got: ${error.message}`);
    }
  }
});

// Test 8: Non-numeric GID
suite.test('Non-numeric GID is rejected', () => {
  const input = { id: "gid://shopify/Product/abc-123", title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for non-numeric GID');
  } catch (error) {
    if (!error.message.includes('must be numeric')) {
      throw new Error(`Expected "must be numeric" in error, got: ${error.message}`);
    }
  }
});

// Test 9: Random string
suite.test('Random string is rejected', () => {
  const input = { id: "not-a-valid-id", title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for random string');
  } catch (error) {
    if (!error.message.includes('Expected Shopify GID')) {
      throw new Error(`Expected "Expected Shopify GID" in error, got: ${error.message}`);
    }
  }
});

// Test 10: Prisma UUID (internal record ID)
suite.test('Prisma UUID is rejected', () => {
  const input = { id: "5188eb38-13b1-454b-8b09-0a13e9ec60cf", title: "Test Product" };
  try {
    validateProductId(input);
    throw new Error('Should have thrown error for Prisma UUID');
  } catch (error) {
    if (!error.message.includes('UUID detected')) {
      throw new Error(`Expected "UUID detected" in error, got: ${error.message}`);
    }
  }
});

// Export test runner
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { StrictValidationTests, suite };
