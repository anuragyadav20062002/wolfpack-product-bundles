#!/usr/bin/env node

/**
 * Unified Test Runner
 *
 * Runs all test suites before deployment to ensure code quality
 * and prevent regressions in business logic.
 *
 * Usage:
 *   node run-all-tests.js
 *   npm test
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.suites = [];
    this.totalTests = 0;
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.startTime = Date.now();
  }

  async loadTestSuite(name, path) {
    try {
      const suite = require(path);
      this.suites.push({ name, suite: suite.suite, path });
      return true;
    } catch (error) {
      console.error(`${colors.red}✗ Failed to load ${name}: ${error.message}${colors.reset}`);
      return false;
    }
  }

  async runAllSuites() {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    🚀 WOLFPACK BUNDLE APP TEST SUITE 🚀                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);

    console.log(`${colors.blue}📦 Loading test suites...${colors.reset}`);

    // Load all test suites
    const loaded = await Promise.all([
      this.loadTestSuite('Product ID Validation', './test-product-id-validation.cjs'),
      this.loadTestSuite('Strict Validation', './test-strict-validation.cjs'),
      this.loadTestSuite('Metafield Validation', './tests/metafield-validation.test.cjs'),
      this.loadTestSuite('Cart Transform', './tests/cart-transform.test.cjs'),
      this.loadTestSuite('Bundle Configuration', './tests/bundle-configuration.test.cjs')
    ]);

    const loadedCount = loaded.filter(Boolean).length;
    console.log(`${colors.green}✓ Loaded ${loadedCount}/${loaded.length} test suites${colors.reset}\n`);

    if (loadedCount === 0) {
      console.log(`${colors.red}✗ No test suites loaded. Aborting.${colors.reset}`);
      return false;
    }

    // Run each suite
    for (const { name, suite } of this.suites) {
      console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);
      console.log(`${colors.cyan}${colors.bright}Running: ${name}${colors.reset}`);
      console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);

      const success = await suite.run();

      this.totalTests += (suite.passed + suite.failed);
      this.totalPassed += suite.passed;
      this.totalFailed += suite.failed;

      if (!success) {
        console.log(`${colors.red}✗ ${name} suite failed${colors.reset}\n`);
      } else {
        console.log(`${colors.green}✓ ${name} suite passed${colors.reset}\n`);
      }
    }

    this.printSummary();

    return this.totalFailed === 0;
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}                           TEST SUMMARY                                   ${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);

    console.log(`${colors.bright}Total Suites:${colors.reset}     ${this.suites.length}`);
    console.log(`${colors.bright}Total Tests:${colors.reset}      ${this.totalTests}`);
    console.log(`${colors.green}${colors.bright}Passed:${colors.reset}           ${this.totalPassed}`);
    console.log(`${colors.red}${colors.bright}Failed:${colors.reset}           ${this.totalFailed}`);
    console.log(`${colors.bright}Duration:${colors.reset}         ${duration}s\n`);

    if (this.totalFailed === 0) {
      console.log(`${colors.green}${colors.bright}╔══════════════════════════════════════════════════════════════════════════════╗`);
      console.log(`║                   ✓ ALL TESTS PASSED - READY TO DEPLOY ✓                    ║`);
      console.log(`╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

      console.log(`${colors.green}✓ Code quality checks passed${colors.reset}`);
      console.log(`${colors.green}✓ Business logic validated${colors.reset}`);
      console.log(`${colors.green}✓ No regressions detected${colors.reset}`);
      console.log(`${colors.green}✓ Safe to deploy${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bright}╔══════════════════════════════════════════════════════════════════════════════╗`);
      console.log(`║                    ✗ TESTS FAILED - DO NOT DEPLOY ✗                         ║`);
      console.log(`╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

      console.log(`${colors.red}✗ ${this.totalFailed} test(s) failed${colors.reset}`);
      console.log(`${colors.yellow}⚠  Fix failing tests before deploying${colors.reset}`);
      console.log(`${colors.yellow}⚠  Review error messages above${colors.reset}\n`);
    }

    console.log(`${colors.bright}${'═'.repeat(80)}${colors.reset}\n`);
  }

  async runContinuousIntegration() {
    console.log(`${colors.cyan}${colors.bright}Running in CI mode...${colors.reset}\n`);

    const success = await this.runAllSuites();

    if (success) {
      console.log(`${colors.green}CI: Tests passed ✓${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}CI: Tests failed ✗${colors.reset}`);
      process.exit(1);
    }
  }
}

// Run tests
async function main() {
  const runner = new TestRunner();

  // Check if running in CI mode
  const isCI = process.env.CI === 'true' || process.argv.includes('--ci');

  if (isCI) {
    await runner.runContinuousIntegration();
  } else {
    const success = await runner.runAllSuites();
    process.exit(success ? 0 : 1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error: ${error}${colors.reset}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { TestRunner };
