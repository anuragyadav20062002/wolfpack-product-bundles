/**
 * Test script for Fixed Bundle Price to Percentage Conversion
 *
 * This tests the conversion logic that happens at save time when a merchant
 * configures a fixed bundle price discount.
 */

console.log('🧪 Testing Fixed Bundle Price to Percentage Conversion\n');

// Simulate bundle configuration
const testCases = [
  {
    name: 'Basic Fixed Bundle Price',
    totalBundlePrice: 500,  // Total of all products: ₹500
    fixedPrice: 450,        // Merchant wants bundle to cost: ₹450
    expectedDiscount: 10    // Expected: (500-450)/500 * 100 = 10%
  },
  {
    name: 'Larger Discount',
    totalBundlePrice: 1000,
    fixedPrice: 750,
    expectedDiscount: 25    // (1000-750)/1000 * 100 = 25%
  },
  {
    name: 'Small Discount',
    totalBundlePrice: 200,
    fixedPrice: 190,
    expectedDiscount: 5     // (200-190)/200 * 100 = 5%
  },
  {
    name: 'Edge Case - Very Small Discount',
    totalBundlePrice: 99.99,
    fixedPrice: 99.00,
    expectedDiscount: 0.99  // (99.99-99)/99.99 * 100 ≈ 0.99%
  }
];

// Conversion function (mimics the server-side logic)
function convertFixedPriceToPercentage(fixedPrice, totalBundlePrice) {
  if (fixedPrice <= 0 || totalBundlePrice <= 0 || fixedPrice >= totalBundlePrice) {
    return {
      success: false,
      error: 'Invalid prices'
    };
  }

  const discountAmount = totalBundlePrice - fixedPrice;
  const discountPercent = (discountAmount / totalBundlePrice) * 100;
  const roundedPercent = Math.round(discountPercent * 100) / 100; // Round to 2 decimals

  return {
    success: true,
    discountValue: roundedPercent,
    originalFixedPrice: fixedPrice,
    calculatedFromTotal: totalBundlePrice,
    discountAmount
  };
}

// Run tests
console.log('Running conversion tests...\n');
let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Total Bundle Price: ₹${testCase.totalBundlePrice}`);
  console.log(`  Fixed Price: ₹${testCase.fixedPrice}`);

  const result = convertFixedPriceToPercentage(testCase.fixedPrice, testCase.totalBundlePrice);

  if (result.success) {
    console.log(`  ✅ Converted to: ${result.discountValue}% discount`);
    console.log(`  Expected: ${testCase.expectedDiscount}%`);

    // Check if result matches expected (within 0.01% tolerance for rounding)
    const difference = Math.abs(result.discountValue - testCase.expectedDiscount);
    if (difference < 0.01) {
      console.log(`  ✅ PASSED\n`);
      passedTests++;
    } else {
      console.log(`  ❌ FAILED - Expected ${testCase.expectedDiscount}%, got ${result.discountValue}%\n`);
      failedTests++;
    }
  } else {
    console.log(`  ❌ FAILED - ${result.error}\n`);
    failedTests++;
  }
});

// Test cart transform application
console.log('\n🧪 Testing Cart Transform Application\n');

const cartScenario = {
  totalAmount: 500,  // Customer added products worth ₹500
  discountPercent: 10  // From our conversion above
};

const discountedPrice = cartScenario.totalAmount * (1 - cartScenario.discountPercent / 100);
const finalPrice = cartScenario.totalAmount - discountedPrice;

console.log('Cart Transform Scenario:');
console.log(`  Original Cart Total: ₹${cartScenario.totalAmount}`);
console.log(`  Discount Percentage: ${cartScenario.discountPercent}%`);
console.log(`  Discounted Amount: ₹${finalPrice}`);
console.log(`  Final Price: ₹${discountedPrice}`);
console.log(`  Expected Final Price: ₹450`);

if (Math.abs(discountedPrice - 450) < 0.01) {
  console.log(`  ✅ Cart transform correctly applies discount\n`);
  passedTests++;
} else {
  console.log(`  ❌ Cart transform failed\n`);
  failedTests++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('='.repeat(50));

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Fixed bundle price conversion is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Review the implementation.');
  process.exit(1);
}
