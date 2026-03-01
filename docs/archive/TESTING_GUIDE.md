# Testing Guide

## Overview

Comprehensive test suite to prevent regressions and ensure code quality before deployment. This guide covers all test suites, how to run them, and what they validate.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Pre-Deployment Validation
```bash
npm run pre-deploy
```
This runs all tests AND builds the application. Only deploy if this passes.

### Run Individual Test Suites
```bash
# Metafield validation
npm run test:metafields

# Cart transform functions
npm run test:cart-transform

# Bundle configuration
npm run test:bundle-config

# Product ID validation
npm run test:product-ids

# Strict validation
npm run test:strict-validation
```

## Test Suites

### 1. Metafield Validation (`tests/metafield-validation.test.cjs`)

**Purpose**: Prevent metafield namespace mismatches that broke the bundle widget

**What It Tests**:
- ✅ Namespace consistency (custom vs $app)
- ✅ Metafield type correctness (json, list.product_reference, etc.)
- ✅ No duplicate keys
- ✅ Required fields in bundle data
- ✅ Product ID format in metafields
- ✅ No UUID contamination
- ✅ Component reference format
- ✅ Metafield size limits
- ✅ Documentation completeness

**Total Tests**: 12

**Critical Checks**:
- Shop bundles use `custom` namespace (for Liquid access)
- Standard Shopify metafields use `$app` namespace
- Save and read operations use matching namespaces

**Reference**: `docs/METAFIELD_NAMESPACE_FIX.md`

### 2. Cart Transform Tests (`tests/cart-transform.test.cjs`)

**Purpose**: Validate cart transform logic and discount calculations

**What It Tests**:
- ✅ Fixed bundle price calculations
- ✅ Fixed amount discount conversions
- ✅ Percentage discount passthrough
- ✅ Product ID validation
- ✅ Bundle condition checks (quantity, amount)
- ✅ Maximum discount capping (100%)
- ✅ Zero/negative value handling
- ✅ Bundle product ID matching
- ✅ Incomplete bundle detection
- ✅ Multi-bundle handling

**Total Tests**: 18

**Critical Checks**:
- Fixed bundle price: `discountPercent = (cartTotal - fixedPrice) / cartTotal * 100`
- UUID product IDs are rejected
- Conditions validate correctly (equal_to, greater_than, etc.)

**Reference**: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

### 3. Bundle Configuration Tests (`tests/bundle-configuration.test.cjs`)

**Purpose**: Ensure bundle data integrity and validation

**What It Tests**:
- ✅ Bundle structure (required fields)
- ✅ Step structure validation
- ✅ Min/max quantity logic
- ✅ Positive quantity values
- ✅ Discount method validation
- ✅ Discount rules structure
- ✅ Step condition validation
- ✅ Product IDs array format
- ✅ Collections array format
- ✅ Shopify GID format
- ✅ No duplicate step IDs
- ✅ Sequential step positions
- ✅ Pricing rules validation
- ✅ allBundleProductIds population
- ✅ Template name format

**Total Tests**: 20

**Critical Checks**:
- minQuantity ≤ maxQuantity
- Discount methods are valid enum values
- Product IDs are valid Shopify GIDs
- No duplicate step IDs

**Reference**: `prisma/schema.prisma`, `CLAUDE.md`

### 4. Product ID Validation (`test-product-id-validation.cjs`)

**Purpose**: Test product ID normalization logic

**What It Tests**:
- ✅ Full Shopify GIDs preserved
- ✅ Numeric IDs converted to GIDs
- ✅ UUIDs handled with warnings

**Total Tests**: 4

**Reference**: Product ID fix implementation

### 5. Strict Validation (`test-strict-validation.cjs`)

**Purpose**: Test strict product ID validation with error throwing

**What It Tests**:
- ✅ Valid Shopify GIDs accepted
- ✅ Numeric IDs accepted
- ✅ UUIDs rejected with clear errors
- ✅ Empty/null/undefined rejected
- ✅ Non-numeric GIDs rejected
- ✅ Random strings rejected

**Total Tests**: 10

**Reference**: `docs/STRICT_PRODUCT_ID_VALIDATION.md`

## Test Summary

| Suite | Tests | Purpose |
|-------|-------|---------|
| Metafield Validation | 12 | Prevent namespace mismatches |
| Cart Transform | 18 | Validate discount calculations |
| Bundle Configuration | 20 | Ensure data integrity |
| Product ID Validation | 4 | Test normalization logic |
| Strict Validation | 10 | Test error throwing |
| **TOTAL** | **64** | **Complete coverage** |

## Pre-Deployment Checklist

Before deploying to production, run:

```bash
npm run pre-deploy
```

This command:
1. ✅ Runs all 64 test cases
2. ✅ Builds the application
3. ✅ Exits with error if any step fails

**DO NOT DEPLOY if `npm run pre-deploy` fails!**

## Test Output

### Success Output
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                   ✓ ALL TESTS PASSED - READY TO DEPLOY ✓                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

✓ Code quality checks passed
✓ Business logic validated
✓ No regressions detected
✓ Safe to deploy
```

### Failure Output
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ✗ TESTS FAILED - DO NOT DEPLOY ✗                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

✗ N test(s) failed
⚠  Fix failing tests before deploying
⚠  Review error messages above
```

## Adding New Tests

### 1. Create Test File

```javascript
// tests/my-feature.test.cjs
const assert = require('assert');

class MyFeatureTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 My Feature Test Suite\n');
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
    console.log(`\n📊 Results: ${this.passed}/${this.tests.length} passed`);

    return this.failed === 0;
  }
}

const suite = new MyFeatureTests();

// Add tests
suite.test('Feature works correctly', () => {
  assert.strictEqual(1 + 1, 2, 'Math should work');
});

// Export
if (require.main === module) {
  suite.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { MyFeatureTests, suite };
```

### 2. Add to Test Runner

Edit `run-all-tests.cjs`:

```javascript
const loaded = await Promise.all([
  // ... existing tests
  this.loadTestSuite('My Feature', './tests/my-feature.test.cjs'),
]);
```

### 3. Add npm Script

Edit `package.json`:

```json
"scripts": {
  "test:my-feature": "node tests/my-feature.test.cjs"
}
```

## Continuous Integration

### GitHub Actions Example

```.yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run build
```

## Common Test Failures

### 1. Metafield Namespace Mismatch

**Error**: `Save and read must use same namespace`

**Fix**: Check that backend save and frontend read use matching namespace/key

**Files to Check**:
- Backend: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
- Frontend: `extensions/bundle-builder/blocks/bundle.liquid`

### 2. Invalid Product ID Format

**Error**: `Product ID ... must be valid Shopify GID`

**Fix**: Ensure product IDs are in format `gid://shopify/Product/123`

**Run**: `npm run fix-uuids report` to find affected bundles

### 3. Discount Calculation Error

**Error**: `Expected discount X%, got Y%`

**Fix**: Review discount calculation logic in cart transform

**File**: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

### 4. Bundle Structure Validation

**Error**: `Bundle missing required field: X`

**Fix**: Ensure bundle objects have all required fields

**Reference**: `prisma/schema.prisma` for required fields

## Best Practices

### 1. Run Tests Before Committing
```bash
git add .
npm test
git commit -m "Your message"
```

### 2. Run Pre-Deploy Before Deploying
```bash
npm run pre-deploy
# Only deploy if this passes!
shopify app deploy
```

### 3. Add Tests for Bug Fixes

When fixing a bug:
1. Write a test that reproduces the bug
2. Verify test fails
3. Fix the bug
4. Verify test passes
5. Commit both fix and test

### 4. Keep Tests Fast

- Use mocks for external API calls
- Avoid database operations in unit tests
- Keep test suite under 1 minute

### 5. Make Tests Descriptive

Good test name:
```javascript
suite.test('Fixed bundle price calculates correct discount percentage', () => {
  // ...
});
```

Bad test name:
```javascript
suite.test('Test 1', () => {
  // ...
});
```

## Troubleshooting

### Tests Won't Run

```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules
npm install

# Check file extensions
ls tests/*.cjs  # Should be .cjs not .js
```

### Tests Pass Locally But Fail in CI

- Check Node version matches
- Check environment variables
- Check file permissions
- Check database state

### Specific Test Fails

```bash
# Run just that suite
npm run test:metafields

# Add debug logging
console.log('Debug:', value);

# Use --verbose if available
npm test -- --verbose
```

## Related Documentation

- [Metafield Namespace Fix](./METAFIELD_NAMESPACE_FIX.md)
- [Metafield Checklist](./METAFIELD_CHECKLIST.md)
- [Strict Product ID Validation](./STRICT_PRODUCT_ID_VALIDATION.md)
- [Verification Report](../VERIFICATION_REPORT.md)
- [Project Documentation](../CLAUDE.md)

## Support

If tests are failing unexpectedly:
1. Review error messages carefully
2. Check related documentation above
3. Run individual test suites to isolate the issue
4. Check git history for recent changes
5. Contact development team if issue persists
