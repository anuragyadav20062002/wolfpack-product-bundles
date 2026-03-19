/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      // Override tsconfig for Jest: force CJS output so jest.mock() hoisting works.
      // The app tsconfig uses ESNext modules (for Vite/Remix) which is incompatible
      // with Jest's require()-based module system.
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
      diagnostics: false,
    }],
    // Transform ES-module .js widget files (pricing-calculator, constants, etc.)
    '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
  },
  // Use V8 (Node built-in) coverage provider to avoid minimatch v9 incompatibility
  // with babel-plugin-istanbul / test-exclude v6 (which calls minimatch as a function,
  // but minimatch v9 exports an object).
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'extensions/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            module: 'commonjs',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
          },
          diagnostics: false,
        }],
        '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
      },
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/app/$1',
        '\\.module\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            module: 'commonjs',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
          },
          diagnostics: false,
        }],
        '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
      },
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/app/$1',
        '\\.module\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            module: 'commonjs',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
          },
          diagnostics: false,
        }],
        '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
      },
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/app/$1',
        '\\.module\\.css$': '<rootDir>/tests/__mocks__/styleMock.js',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
  ],
};
