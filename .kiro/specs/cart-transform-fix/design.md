# Design Document

## Overview

The cart transform function is currently failing to process bundle products correctly, preventing customers from seeing merged bundle line items with proper discounts during checkout. Based on the requirements analysis, the system must address several critical issues:

1. **Bundle Configuration Access**: The function must reliably access bundle configurations from shop metafields with proper fallback mechanisms
2. **Bundle Processing Logic**: Component products must be correctly merged into single bundle line items with appropriate discount calculations
3. **Error Handling & Logging**: Comprehensive logging and graceful error handling must be implemented to ensure system reliability
4. **Configuration Compatibility**: The system must work with existing bundle configuration formats without requiring data migration
5. **Edge Case Management**: The function must handle various edge cases without breaking the checkout process

The design addresses these requirements by implementing a robust multi-source configuration loading system, comprehensive bundle processing pipeline, extensive logging framework, and graceful error recovery mechanisms.

## Architecture

### Data Flow Architecture

```
Cart Input → Bundle Detection → Configuration Loading → Validation → Merge Operations → Output
     ↓              ↓                    ↓               ↓              ↓            ↓
  Cart Lines    Instance IDs      Shop/Product       Required       Discount     Operations
                                 Metafields         Fields         Calculation    Array
```

### Configuration Loading Strategy

**Priority Order (Requirement 2):**
1. **Shop Metafield** (`shop.all_bundles`) - Primary source for performance and reliability
2. **Product Metafields** (`product.bundle_config`) - Fallback when shop metafield is null/empty
3. **Component Product Metafields** (`product.all_bundles_data`) - Legacy support for existing configurations

**Fallback Logic:**
- If shop metafield is null/empty → automatically fallback to product metafields
- If JSON parsing fails → log error and attempt individual configuration parsing
- If configuration validation fails → attempt data normalization before skipping

### Bundle Processing Pipeline

1. **Input Validation (Requirement 5)**: Verify cart structure, handle empty carts gracefully
2. **Bundle Detection & Grouping (Requirement 1)**: Group cart lines by bundle instance ID, support multiple bundle instances
3. **Configuration Resolution (Requirement 2)**: Load and validate bundle configurations from multiple sources
4. **Bundle ID Matching (Requirement 4)**: Match both instance ID and base bundle ID formats for compatibility
5. **Merge Operation Creation (Requirement 1)**: Build merge operations with discount calculations
6. **Comprehensive Logging (Requirement 3)**: Log each step with detailed context
7. **Error Recovery (Requirement 5)**: Handle missing data gracefully without breaking checkout

## Components and Interfaces

### Core Components

#### 1. Bundle Configuration Resolver
```typescript
interface BundleConfigResolver {
  loadBundleConfigurations(input: CartTransformInput): Map<string, BundleConfig>
  validateBundleConfig(config: any): BundleConfig | null
  normalizeBundleId(instanceId: string): string
  handleConfigurationErrors(error: any, context: string): void
}
```

**Responsibilities (Requirements 2, 4):**
- Load configurations from shop metafield with product metafield fallback
- Validate required fields including bundleParentVariantId
- Handle JSON parsing errors gracefully with detailed logging
- Normalize bundle ID formats for widget compatibility
- Support both instance ID and base bundle ID matching

#### 2. Bundle Processor
```typescript
interface BundleProcessor {
  groupCartLinesByBundle(cartLines: CartLine[]): Map<string, CartLine[]>
  createMergeOperation(lines: CartLine[], config: BundleConfig): MergeOperation | null
  calculateBundleDiscount(config: BundleConfig, lines: CartLine[]): PriceAdjustment | null
  processMultipleBundleInstances(bundleGroups: Map<string, CartLine[]>): MergeOperation[]
  validatePricingCalculation(discount: PriceAdjustment): boolean
}
```

**Responsibilities (Requirements 1, 5):**
- Group cart lines by bundle instance, supporting multiple instances
- Create merge operations for each bundle instance separately
- Calculate discounts based on actual cart totals
- Handle missing parent variant IDs with clear error logging
- Validate pricing calculations and default to no discount for invalid values
- Process bundles independently to prevent single bundle failures from affecting others

#### 3. Error Handler & Logger
```typescript
interface ErrorHandler {
  logError(context: string, error: any, data?: any): void
  logWarning(context: string, message: string, data?: any): void
  logInfo(context: string, message: string, data?: any): void
  logFunctionStart(cartStructure: any, bundleDetection: any): void
  logConfigurationLoading(configCount: number, sources: string[]): void
  logMergeOperations(operations: MergeOperation[]): void
  logFinalOperations(operations: any[]): void
}
```

**Responsibilities (Requirement 3):**
- Log function start with input cart structure and bundle detection results
- Log configuration loading with count and sources
- Log merge operation creation with discount calculation details
- Log specific errors with context for failed steps
- Log final operations array before returning
- Preserve error context for debugging
- Monitor performance and execution time

## Data Models

### Enhanced Bundle Configuration
```typescript
interface BundleConfig {
  id: string
  bundleId: string
  name: string
  bundleParentVariantId: string  // REQUIRED - must be present
  shopifyProductId?: string
  pricing?: {
    enabled: boolean
    method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price'
    rules: PricingRule[]
  }
  steps?: BundleStep[]
}
```

### Bundle Instance Mapping
```typescript
interface BundleInstanceGroup {
  instanceId: string      // Full ID: "bundleId_hash"
  baseBundleId: string   // Base ID: "bundleId"
  cartLines: CartLine[]
  config: BundleConfig | null
}
```

### Enhanced Merge Operation
```typescript
interface EnhancedMergeOperation {
  parentVariantId: string
  cartLines: { cartLineId: string; quantity: number }[]
  title: string
  price?: { percentageDecrease: { value: number } }
  attributes: { key: string; value: string }[]
}
```

## Error Handling

### Configuration Loading Errors (Requirement 2)

**Shop Metafield Issues:**
- **Null/Missing**: Log warning with context, automatically fallback to product metafields
- **Invalid JSON**: Log error with parsing details, attempt to parse individual configs
- **Empty Array**: Log info message, continue with product metafields
- **Corrupted Data**: Log error and continue processing other bundles

**Product Metafield Issues:**
- **Missing Config**: Log warning with bundle ID, skip bundle gracefully
- **Invalid Format**: Log error with format details, attempt data normalization
- **Parsing Errors**: Log error with full context, continue processing other bundles

### Edge Case Handling (Requirement 5)

**Empty Cart Scenarios:**
- Return empty operations array without errors
- Log info message about empty cart processing

**Missing Bundle Products:**
- Skip affected bundles without impacting others
- Log warning with missing product details

**Invalid Pricing Calculations:**
- Default to no discount for invalid values
- Log warning with calculation details

### Bundle Processing Errors

**Missing Parent Variant ID (Requirement 4):**
```typescript
if (!config.bundleParentVariantId) {
  logger.logError('MISSING_PARENT_VARIANT', {
    bundleId: config.id,
    bundleName: config.name,
    shopifyProductId: config.shopifyProductId,
    message: 'Bundle configuration missing required bundleParentVariantId field'
  });
  return null; // Skip this bundle without affecting others
}
```

**Invalid Pricing Configuration (Requirement 5):**
```typescript
if (pricing.enabled && (!pricing.rules || pricing.rules.length === 0)) {
  logger.logWarning('INVALID_PRICING_CONFIG', {
    bundleId: config.id,
    pricing: pricing,
    message: 'Pricing enabled but no valid rules found, continuing without discount'
  });
  // Continue without discount to prevent checkout breakage
}

// Validate discount calculation results
if (calculatedDiscount < 0 || calculatedDiscount > 100 || isNaN(calculatedDiscount)) {
  logger.logWarning('INVALID_DISCOUNT_CALCULATION', {
    bundleId: config.id,
    calculatedDiscount: calculatedDiscount,
    message: 'Invalid discount value, defaulting to no discount'
  });
  calculatedDiscount = 0; // Default to no discount
}
```

## Testing Strategy

### Unit Tests

1. **Configuration Loading Tests (Requirement 2)**
   - Test shop metafield parsing with valid and invalid JSON
   - Test automatic fallback to product metafields when shop metafield is null
   - Test JSON parsing error handling with graceful recovery
   - Test configuration validation including required field checks
   - Test data normalization for invalid configuration formats

2. **Bundle Processing Tests (Requirement 1)**
   - Test bundle grouping logic with multiple bundle instances
   - Test merge operation creation with proper discount application
   - Test discount calculations based on actual cart totals
   - Test missing data handling without affecting other bundles
   - Test bundle ID matching for both instance and base formats

3. **Error Handling Tests (Requirements 3, 5)**
   - Test empty cart handling returning empty operations array
   - Test malformed configuration handling with comprehensive logging
   - Test missing parent variant ID handling with clear error messages
   - Test pricing calculation edge cases with default fallbacks
   - Test unexpected error scenarios with graceful recovery

### Integration Tests

1. **End-to-End Bundle Processing (Requirements 1, 4)**
   - Test complete cart transform flow with real bundle configurations
   - Test multiple bundle instances processing separately
   - Test mixed bundle and non-bundle products in same cart
   - Test various pricing methods with actual discount calculations
   - Test compatibility with existing widget-based bundle configurations

2. **Performance Tests (Requirement 5)**
   - Test with large cart sizes to ensure checkout doesn't break
   - Test with many bundle configurations to validate scalability
   - Test instruction count limits to stay within Shopify constraints
   - Test execution time limits for optimal checkout performance

3. **Logging Integration Tests (Requirement 3)**
   - Test comprehensive logging throughout the entire process
   - Test error context preservation in production scenarios
   - Test log output format and structure for debugging purposes

### Test Data Scenarios

**Scenario 1: Normal Bundle Processing**
- Cart with 3 component products
- Valid bundle configuration with pricing
- Expected: Single merge operation with discount

**Scenario 2: Missing Configuration Data**
- Cart with bundle products
- Null shop metafield
- Expected: Fallback to product metafields

**Scenario 3: Invalid Parent Variant ID**
- Valid bundle configuration
- Missing bundleParentVariantId
- Expected: Skip bundle, log error

**Scenario 4: Multiple Bundle Instances (Requirement 1)**
- Cart with 2 different bundle instances
- Both have valid configurations
- Expected: 2 separate merge operations processed independently

**Scenario 5: Edge Case Handling (Requirement 5)**
- Empty cart input
- Expected: Empty operations array without errors

**Scenario 6: Configuration Compatibility (Requirement 4)**
- Widget-based bundle with instance ID format
- Configuration lookup using base bundle ID
- Expected: Successful configuration matching and processing

## Implementation Plan

### Phase 1: Configuration Loading Fix
1. Implement robust shop metafield parsing
2. Add product metafield fallback logic
3. Add configuration validation
4. Implement comprehensive logging

### Phase 2: Bundle Processing Enhancement
1. Fix bundle ID matching logic
2. Implement parent variant ID validation
3. Enhance merge operation creation
4. Add discount calculation validation

### Phase 3: Error Handling & Logging
1. Add comprehensive error logging
2. Implement graceful error recovery
3. Add performance monitoring
4. Add debug information output

### Phase 4: Testing & Validation
1. Create comprehensive test suite
2. Test with real bundle configurations
3. Validate against Shopify limits
4. Performance optimization

## Key Design Decisions

### 1. Configuration Source Priority (Requirement 2)
**Decision**: Prioritize shop metafield over product metafields with automatic fallback
**Rationale**: Better performance and reliability, single source of truth, avoids propagation delays. Automatic fallback ensures system continues working when shop metafield is null/empty.

### 2. Bundle ID Matching Strategy (Requirement 4)
**Decision**: Support both instance ID and base bundle ID matching
**Rationale**: Maintains compatibility with existing widget implementation without requiring configuration migration. Allows seamless transition between different bundle ID formats.

### 3. Error Recovery Approach (Requirement 5)
**Decision**: Skip individual bundles on errors, continue processing others
**Rationale**: Prevents single bundle issues from breaking entire cart transform and checkout process. Ensures customer can still complete purchase even if some bundles have configuration issues.

### 4. Comprehensive Logging Strategy (Requirement 3)
**Decision**: Log every major step with structured data and context
**Rationale**: Essential for debugging production issues in Shopify Functions where direct debugging is not possible. Provides complete audit trail of function execution.

### 5. Validation and Normalization Approach (Requirements 2, 4)
**Decision**: Validate configurations before processing with normalization attempts
**Rationale**: Prevents runtime errors, provides clear error messages, and attempts to recover from minor data format issues. Supports existing configuration formats while ensuring data integrity.

### 6. Independent Bundle Processing (Requirement 1)
**Decision**: Process each bundle instance separately and independently
**Rationale**: Allows multiple bundle instances in the same cart to be handled correctly. Prevents issues with one bundle from affecting others, ensuring partial functionality when possible.

### 7. Graceful Degradation (Requirement 5)
**Decision**: Default to no discount for invalid pricing calculations
**Rationale**: Ensures checkout process never breaks due to pricing calculation errors. Customer can still purchase bundle at regular price rather than experiencing checkout failure.