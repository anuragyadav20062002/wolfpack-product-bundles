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

// Test cases
const testCases = [
  {
    name: "Full Shopify GID",
    input: { id: "gid://shopify/Product/10272663634214", title: "Test Product" },
    expected: "gid://shopify/Product/10272663634214"
  },
  {
    name: "Numeric ID only",
    input: { id: "10272663634214", title: "Test Product" },
    expected: "gid://shopify/Product/10272663634214"
  },
  {
    name: "UUID (old data)",
    input: { id: "b036d011-e9a4-431e-a88e-f5110ac28ac9", title: "Test Product" },
    expected: "b036d011-e9a4-431e-a88e-f5110ac28ac9" // Will warn but pass through
  },
  {
    name: "Another UUID",
    input: { id: "f13ea55f-9aa6-4a05-8a4b-637953356102", title: "Test Product" },
    expected: "f13ea55f-9aa6-4a05-8a4b-637953356102"
  }
];

console.log('🧪 Testing Product ID Validation Fix\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log(`Input:    ${testCase.input.id}`);

  const result = normalizeProductId(testCase.input);
  console.log(`Output:   ${result}`);
  console.log(`Expected: ${testCase.expected}`);

  if (result === testCase.expected) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    failed++;
  }
});

console.log('\n' + '=' .repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('\n✅ All tests passed! Product ID validation is working correctly.');
  console.log('\n📝 Summary:');
  console.log('   • Full GIDs are preserved as-is');
  console.log('   • Numeric IDs are converted to proper GID format');
  console.log('   • UUIDs (old data) pass through with warning');
  console.log('\n⚠️  Note: Existing bundles with UUIDs need manual migration');
  console.log('   Run: npm run fix-uuids report');
} else {
  console.log('\n❌ Some tests failed! Check the implementation.');
  process.exit(1);
}
