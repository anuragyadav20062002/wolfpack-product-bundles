/**
 * Comprehensive Test Runner for Shopify Bundle App
 * Orchestrates all test suites and provides detailed reporting
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface TestSummary {
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  overallCoverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite for Shopify Bundle App\n');
    console.log('=' .repeat(80));
    console.log('📋 Test Plan:');
    console.log('  • Unit Tests: Services, Extensions, Routes, Assets');
    console.log('  • Integration Tests: Complete workflows');
    console.log('  • End-to-End Tests: Full application flows');
    console.log('=' .repeat(80));
    console.log('');

    try {
      // Run unit tests
      await this.runTestSuite('Unit Tests - Services', 'tests/unit/services/**/*.test.ts');
      await this.runTestSuite('Unit Tests - Extensions', 'tests/unit/extensions/**/*.test.ts');
      await this.runTestSuite('Unit Tests - Routes', 'tests/unit/routes/**/*.test.ts');
      await this.runTestSuite('Unit Tests - Assets', 'tests/unit/assets/**/*.test.ts');

      // Run integration tests
      await this.runTestSuite('Integration Tests', 'tests/integration/**/*.test.ts');

      // Run end-to-end tests
      await this.runTestSuite('End-to-End Tests', 'tests/e2e/**/*.test.ts');

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(suiteName: string, pattern: string): Promise<void> {
    console.log(`\n🧪 Running ${suiteName}...`);
    console.log('-'.repeat(50));

    const startTime = Date.now();

    try {
      const command = `npx jest --testPathPattern="${pattern}" --verbose --coverage=false`;
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const duration = Date.now() - startTime;
      const result = this.parseJestOutput(output, suiteName, duration);
      this.results.push(result);

      console.log(`✅ ${suiteName} completed in ${duration}ms`);
      console.log(`   Passed: ${result.passed}, Failed: ${result.failed}, Skipped: ${result.skipped}`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout || error.message;
      const result = this.parseJestOutput(output, suiteName, duration);
      this.results.push(result);

      console.log(`❌ ${suiteName} had failures in ${duration}ms`);
      console.log(`   Passed: ${result.passed}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
      
      if (result.failed > 0) {
        console.log(`\n📋 Failure Details for ${suiteName}:`);
        console.log(output);
      }
    }
  }

  /**
   * Parse Jest output to extract test results
   */
  private parseJestOutput(output: string, suiteName: string, duration: number): TestResult {
    const result: TestResult = {
      suite: suiteName,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration
    };

    // Parse test results from Jest output
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    if (passedMatch) result.passed = parseInt(passedMatch[1]);
    if (failedMatch) result.failed = parseInt(failedMatch[1]);
    if (skippedMatch) result.skipped = parseInt(skippedMatch[1]);

    // Parse coverage if available
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      result.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }

    return result;
  }

  /**
   * Generate comprehensive final report
   */
  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const summary = this.calculateSummary();

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));

    // Overall summary
    console.log('\n📈 Overall Results:');
    console.log(`   Total Test Suites: ${summary.totalSuites}`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.totalPassed}`);
    console.log(`   ❌ Failed: ${summary.totalFailed}`);
    console.log(`   ⏭️  Skipped: ${summary.totalSkipped}`);
    console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);

    // Success rate
    const successRate = summary.totalTests > 0 
      ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1)
      : '0';
    console.log(`   📊 Success Rate: ${successRate}%`);

    // Suite breakdown
    console.log('\n📋 Suite Breakdown:');
    this.results.forEach(result => {
      const suiteTotal = result.passed + result.failed + result.skipped;
      const suiteSuccessRate = suiteTotal > 0 
        ? ((result.passed / suiteTotal) * 100).toFixed(1)
        : '0';
      
      console.log(`   ${result.suite}:`);
      console.log(`     Tests: ${suiteTotal} | Passed: ${result.passed} | Failed: ${result.failed} | Success: ${suiteSuccessRate}%`);
      console.log(`     Duration: ${result.duration}ms`);
    });

    // Coverage summary (if available)
    if (summary.overallCoverage) {
      console.log('\n📊 Code Coverage Summary:');
      console.log(`   Lines: ${summary.overallCoverage.lines.toFixed(1)}%`);
      console.log(`   Functions: ${summary.overallCoverage.functions.toFixed(1)}%`);
      console.log(`   Branches: ${summary.overallCoverage.branches.toFixed(1)}%`);
      console.log(`   Statements: ${summary.overallCoverage.statements.toFixed(1)}%`);
    }

    // Test quality assessment
    console.log('\n🎯 Test Quality Assessment:');
    this.assessTestQuality(summary);

    // Recommendations
    console.log('\n💡 Recommendations:');
    this.generateRecommendations(summary);

    // Final status
    console.log('\n' + '='.repeat(80));
    if (summary.totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! Your Shopify Bundle App is ready for deployment.');
    } else {
      console.log(`⚠️  ${summary.totalFailed} TEST(S) FAILED. Please review and fix before deployment.`);
    }
    console.log('='.repeat(80));

    // Generate detailed report file
    this.generateDetailedReport(summary, totalDuration);
  }

  /**
   * Calculate overall test summary
   */
  private calculateSummary(): TestSummary {
    const summary: TestSummary = {
      totalSuites: this.results.length,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration: 0
    };

    this.results.forEach(result => {
      summary.totalTests += result.passed + result.failed + result.skipped;
      summary.totalPassed += result.passed;
      summary.totalFailed += result.failed;
      summary.totalSkipped += result.skipped;
      summary.totalDuration += result.duration;
    });

    // Calculate average coverage if available
    const coverageResults = this.results.filter(r => r.coverage);
    if (coverageResults.length > 0) {
      summary.overallCoverage = {
        lines: coverageResults.reduce((sum, r) => sum + r.coverage!.lines, 0) / coverageResults.length,
        functions: coverageResults.reduce((sum, r) => sum + r.coverage!.functions, 0) / coverageResults.length,
        branches: coverageResults.reduce((sum, r) => sum + r.coverage!.branches, 0) / coverageResults.length,
        statements: coverageResults.reduce((sum, r) => sum + r.coverage!.statements, 0) / coverageResults.length
      };
    }

    return summary;
  }

  /**
   * Assess test quality based on results
   */
  private assessTestQuality(summary: TestSummary): void {
    const successRate = summary.totalTests > 0 
      ? (summary.totalPassed / summary.totalTests) * 100
      : 0;

    if (successRate >= 95) {
      console.log('   🌟 Excellent: Test success rate is outstanding (≥95%)');
    } else if (successRate >= 85) {
      console.log('   ✅ Good: Test success rate is solid (≥85%)');
    } else if (successRate >= 70) {
      console.log('   ⚠️  Fair: Test success rate needs improvement (≥70%)');
    } else {
      console.log('   ❌ Poor: Test success rate requires immediate attention (<70%)');
    }

    if (summary.overallCoverage) {
      const avgCoverage = (
        summary.overallCoverage.lines +
        summary.overallCoverage.functions +
        summary.overallCoverage.branches +
        summary.overallCoverage.statements
      ) / 4;

      if (avgCoverage >= 80) {
        console.log('   🎯 Excellent: Code coverage is comprehensive (≥80%)');
      } else if (avgCoverage >= 60) {
        console.log('   📊 Good: Code coverage is adequate (≥60%)');
      } else {
        console.log('   📈 Needs Improvement: Code coverage should be increased (>60%)');
      }
    }

    console.log(`   📝 Test Density: ${summary.totalTests} tests across ${summary.totalSuites} suites`);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(summary: TestSummary): void {
    const recommendations: string[] = [];

    if (summary.totalFailed > 0) {
      recommendations.push('🔧 Fix failing tests before deployment');
      recommendations.push('📋 Review test failure logs for root causes');
    }

    if (summary.overallCoverage && summary.overallCoverage.lines < 80) {
      recommendations.push('📈 Increase test coverage, especially for critical business logic');
    }

    if (summary.totalSkipped > 0) {
      recommendations.push('⏭️  Review and implement skipped tests');
    }

    const avgTestsPerSuite = summary.totalTests / summary.totalSuites;
    if (avgTestsPerSuite < 5) {
      recommendations.push('📝 Consider adding more comprehensive test cases');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 Test suite is in excellent condition!');
      recommendations.push('🚀 Consider adding performance benchmarks');
      recommendations.push('🔄 Set up continuous integration for automated testing');
    }

    recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  /**
   * Generate detailed report file
   */
  private generateDetailedReport(summary: TestSummary, totalDuration: number): void {
    const reportPath = path.join(process.cwd(), 'test-report.json');
    
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary,
      totalDuration,
      suites: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.warn(`⚠️  Could not save detailed report: ${error}`);
    }
  }

  /**
   * Run specific test type
   */
  async runTestType(type: 'unit' | 'integration' | 'e2e'): Promise<void> {
    console.log(`🧪 Running ${type} tests only...\n`);

    switch (type) {
      case 'unit':
        await this.runTestSuite('Unit Tests - Services', 'tests/unit/services/**/*.test.ts');
        await this.runTestSuite('Unit Tests - Extensions', 'tests/unit/extensions/**/*.test.ts');
        await this.runTestSuite('Unit Tests - Routes', 'tests/unit/routes/**/*.test.ts');
        await this.runTestSuite('Unit Tests - Assets', 'tests/unit/assets/**/*.test.ts');
        break;
      case 'integration':
        await this.runTestSuite('Integration Tests', 'tests/integration/**/*.test.ts');
        break;
      case 'e2e':
        await this.runTestSuite('End-to-End Tests', 'tests/e2e/**/*.test.ts');
        break;
    }

    this.generateFinalReport();
  }
}

// CLI interface
const args = process.argv.slice(2);
const testRunner = new TestRunner();

if (args.length === 0) {
  void testRunner.runAllTests();
} else {
  const testType = args[0] as 'unit' | 'integration' | 'e2e';
  if (['unit', 'integration', 'e2e'].includes(testType)) {
    void testRunner.runTestType(testType);
  } else {
    console.error('❌ Invalid test type. Use: unit, integration, or e2e');
    process.exit(1);
  }
}