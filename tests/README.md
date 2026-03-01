# Shopify Bundle App - Comprehensive Test Suite

This directory contains a comprehensive test suite for the Shopify Bundle App, covering all aspects of the application from unit tests to end-to-end integration tests.

## 📋 Test Structure

```
tests/
├── setup.ts                    # Global test configuration and mocks
├── test-runner.ts              # Comprehensive test orchestrator
├── README.md                   # This documentation
├── unit/                       # Unit tests for individual components
│   ├── services/               # Service layer tests
│   │   ├── bundle-product-manager.test.ts
│   │   ├── cart-transform-service.test.ts
│   │   └── metafield-validation.test.ts
│   ├── extensions/             # Cart transform extension tests
│   │   ├── cart-transform-run.test.ts
│   │   └── cart-transform-bundle-utils.test.ts
│   ├── routes/                 # API route tests
│   │   └── api.bundle-product-manager.test.ts
│   └── assets/                 # Frontend widget tests
│       └── bundle-widget.test.ts
├── integration/                # Integration tests for workflows
│   └── bundle-workflow.test.ts
└── e2e/                       # End-to-end application tests
    └── complete-bundle-flow.test.ts
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
```

### Development & Coverage
```bash
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:ci          # CI/CD optimized run
```

## 🧪 Test Categories

### Unit Tests
Tests individual components in isolation with mocked dependencies.

**Services Tests:**
- `bundle-product-manager.test.ts`: Bundle product creation, publishing, pricing calculations
- `cart-transform-service.test.ts`: Cart transform activation and management
- `metafield-validation.test.ts`: Metafield validation, cleanup, and consistency

**Extensions Tests:**
- `cart-transform-run.test.ts`: Core cart transformation logic
- `cart-transform-bundle-utils.test.ts`: Bundle detection and processing utilities

**Routes Tests:**
- `api.bundle-product-manager.test.ts`: API endpoints for bundle management

**Assets Tests:**
- `bundle-widget.test.ts`: Frontend bundle widget functionality

### Integration Tests
Tests complete workflows across multiple components.

**Bundle Workflow Tests:**
- Complete bundle creation to cart processing flow
- Bundle update and synchronization workflows
- Metafield validation and cleanup integration
- Error handling and recovery scenarios
- Performance and scalability testing

### End-to-End Tests
Tests complete application flows from user perspective.

**Complete Bundle Flow Tests:**
- Full bundle lifecycle from creation to cart processing
- Multi-step bundle configuration and pricing
- Bundle deletion and cleanup workflows
- Error recovery and resilience testing
- Performance under load testing

## 🛠️ Test Configuration

### Jest Configuration
The test suite uses Jest with TypeScript support:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // ... additional configuration
};
```

### Global Setup
`tests/setup.ts` provides:
- Mock environment variables
- Shopify Admin API mocks
- Prisma client mocks
- Test utilities and helpers
- Global test configuration

### Mock Strategy
- **Shopify Admin API**: Mocked GraphQL responses
- **Database**: Mocked Prisma client operations
- **External Services**: Mocked HTTP requests
- **DOM/Browser**: Mocked browser environment for widget tests

## 📊 Test Coverage

The test suite aims for comprehensive coverage:

- **Services**: 90%+ coverage of business logic
- **Extensions**: 95%+ coverage of cart transform logic
- **Routes**: 85%+ coverage of API endpoints
- **Critical Paths**: 100% coverage of core bundle workflows

### Coverage Reports
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory with:
- HTML reports for detailed analysis
- LCOV format for CI/CD integration
- Console summary for quick overview

## 🔍 Test Patterns

### Mocking Strategy
```typescript
// Service mocking
const mockShopifyAdmin = {
  graphql: jest.fn(),
  rest: { /* ... */ }
};

// Database mocking
const mockPrismaClient = {
  bundle: {
    findMany: jest.fn(),
    create: jest.fn(),
    // ...
  }
};
```

### Test Data Factories
```typescript
// Helper functions for creating test data
const createMockBundle = (overrides = {}) => ({
  id: 'test-bundle-1',
  name: 'Test Bundle',
  // ... default properties
  ...overrides
});
```

### Assertion Patterns
```typescript
// Comprehensive assertions
expect(result.success).toBe(true);
expect(result.bundleProduct.id).toBe('gid://shopify/Product/999');
expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(6);
```

## 🚨 Test Quality Standards

### Required Test Coverage
- All public methods must have unit tests
- All API endpoints must have route tests
- All critical workflows must have integration tests
- All user-facing features must have E2E tests

### Test Naming Convention
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should perform expected behavior when condition', () => {
      // Test implementation
    });
    
    it('should handle error case when invalid input', () => {
      // Error handling test
    });
  });
});
```

### Error Testing
Every test suite must include:
- Happy path scenarios
- Error handling scenarios
- Edge cases and boundary conditions
- Network failure scenarios
- Invalid input handling

## 🔧 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npx jest tests/unit/services/bundle-product-manager.test.ts

# Run specific test suite
npx jest --testNamePattern="BundleProductManagerService"

# Run with debugging
npx jest --runInBand --detectOpenHandles
```

### Debug Configuration
```typescript
// Add to test file for debugging
beforeEach(() => {
  console.log('Test starting:', expect.getState().currentTestName);
});
```

## 📈 Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint"
    }
  }
}
```

## 🎯 Test Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review test coverage reports
2. **Monthly**: Update test data and mocks
3. **Per Release**: Run full E2E test suite
4. **Per Feature**: Add corresponding tests

### Test Data Management
- Keep test data minimal and focused
- Use factories for consistent test data creation
- Clean up test data after each test
- Avoid test interdependencies

## 📚 Best Practices

### Writing Effective Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Single Responsibility**: One assertion per test when possible
3. **Descriptive Names**: Test names should explain the scenario
4. **Independent Tests**: Tests should not depend on each other
5. **Fast Execution**: Keep tests fast and focused

### Mock Management
1. **Reset Mocks**: Clear mocks between tests
2. **Realistic Mocks**: Mocks should behave like real services
3. **Mock Verification**: Verify mock interactions
4. **Minimal Mocking**: Only mock what's necessary

### Test Organization
1. **Logical Grouping**: Group related tests together
2. **Consistent Structure**: Follow established patterns
3. **Clear Documentation**: Document complex test scenarios
4. **Regular Refactoring**: Keep tests maintainable

## 🔗 Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Testing](https://typescript-eslint.io/docs/linting/troubleshooting#i-get-errors-from-the-no-undef-rule-about-global-variables-like-process)
- [Shopify App Testing](https://shopify.dev/docs/apps/tools/cli/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing/unit-testing)

## 🆘 Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout
npx jest --testTimeout=30000
```

**Mock not working:**
```typescript
// Ensure mocks are properly reset
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Coverage not accurate:**
```bash
# Clear Jest cache
npx jest --clearCache
```

### Getting Help
1. Check test logs for detailed error messages
2. Review mock configurations
3. Verify test data setup
4. Check for async/await issues
5. Consult team documentation

---

This comprehensive test suite ensures the reliability, maintainability, and quality of the Shopify Bundle App. Regular execution and maintenance of these tests is crucial for successful deployment and ongoing development.