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

// Test cases
const testCases = [
  // ✅ Valid cases (should PASS)
  {
    name: "Valid Shopify GID",
    input: { id: "gid://shopify/Product/10272663634214", title: "Test Product" },
    shouldPass: true,
    expected: "gid://shopify/Product/10272663634214"
  },
  {
    name: "Valid numeric ID",
    input: { id: "10272663634214", title: "Test Product" },
    shouldPass: true,
    expected: "gid://shopify/Product/10272663634214"
  },

  // ❌ Invalid cases (should FAIL)
  {
    name: "UUID (from old data)",
    input: { id: "b036d011-e9a4-431e-a88e-f5110ac28ac9", title: "Amber Essence" },
    shouldPass: false,
    expectedError: "UUID detected"
  },
  {
    name: "Another UUID",
    input: { id: "f63df6b8-0e44-42ac-b6e6-731a4011c6f8", title: "Crystal Lagoon" },
    shouldPass: false,
    expectedError: "UUID detected"
  },
  {
    name: "Empty string",
    input: { id: "", title: "Test Product" },
    shouldPass: false,
    expectedError: "required and must be a string"
  },
  {
    name: "Null ID",
    input: { id: null, title: "Test Product" },
    shouldPass: false,
    expectedError: "required and must be a string"
  },
  {
    name: "Undefined ID",
    input: { id: undefined, title: "Test Product" },
    shouldPass: false,
    expectedError: "required and must be a string"
  },
  {
    name: "Non-numeric GID",
    input: { id: "gid://shopify/Product/abc-123", title: "Test Product" },
    shouldPass: false,
    expectedError: "must be numeric"
  },
  {
    name: "Random string",
    input: { id: "not-a-valid-id", title: "Test Product" },
    shouldPass: false,
    expectedError: "Expected Shopify GID"
  },
  {
    name: "Prisma UUID (internal record ID)",
    input: { id: "5188eb38-13b1-454b-8b09-0a13e9ec60cf", title: "Test Product" },
    shouldPass: false,
    expectedError: "UUID detected"
  }
];

console.log('🧪 Testing Strict Product ID Validation\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log(`   Input ID: ${testCase.input.id}`);
  console.log(`   Product:  ${testCase.input.title}`);
  console.log(`   Expected: ${testCase.shouldPass ? '✅ PASS' : '❌ FAIL'}`);

  try {
    const result = validateProductId(testCase.input);

    if (testCase.shouldPass) {
      if (result === testCase.expected) {
        console.log(`   Result:   ✅ PASSED - Got: ${result}`);
        passed++;
      } else {
        console.log(`   Result:   ❌ FAILED - Got: ${result}, Expected: ${testCase.expected}`);
        failed++;
      }
    } else {
      console.log(`   Result:   ❌ FAILED - Should have thrown error but got: ${result}`);
      failed++;
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      if (error.message.includes(testCase.expectedError)) {
        console.log(`   Result:   ✅ PASSED - Correctly rejected with error`);
        console.log(`   Error:    "${error.message}"`);
        passed++;
      } else {
        console.log(`   Result:   ❌ FAILED - Wrong error message`);
        console.log(`   Got:      "${error.message}"`);
        console.log(`   Expected: Message containing "${testCase.expectedError}"`);
        failed++;
      }
    } else {
      console.log(`   Result:   ❌ FAILED - Unexpected error: ${error.message}`);
      failed++;
    }
  }
});

console.log('\n' + '=' .repeat(80));
console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed, ${failed}/${testCases.length} failed`);

if (failed === 0) {
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
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED! Check the validation logic.');
  process.exit(1);
}
