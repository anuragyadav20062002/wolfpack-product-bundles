// Import utility functions
import { normalizeProductId } from './cart-transform-bundle-utils';
import { CartTransformLogger as Logger } from './cart-transform-logger';

// Define types for cart transform function following official Shopify standard
export interface CartTransformInput {
  cart: {
    lines: Array<{
      id: string;
      quantity: number;
      bundleId?: {
        value: string;
      };
      merchandise: {
        __typename: string;
        id: string;
        title?: string;
        component_reference?: {
          value: string;
        };
        component_quantities?: {
          value: string;
        };
        component_parents?: {
          value: string;
        };
        price_adjustment?: {
          value: string;
        };
        product?: {
          id: string;
          title: string;
          bundle_config?: {
            value: string;
            jsonValue?: any;
          };
        };
      };
      cost: {
        amountPerQuantity: {
          amount: string;
          currencyCode: string;
        };
        totalAmount: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
    cost?: {
      totalAmount: {
        amount: string;
        currencyCode: string;
      };
      subtotalAmount: {
        amount: string;
        currencyCode: string;
      };
    };
    bundleConfig?: {
      value: string;
    };
  };
  shop?: {
    all_bundles?: {
      value: string;
    };
  };
}

export interface CartTransformOperation {
  merge?: {
    cartLines: Array<{
      cartLineId: string;
      quantity: number;
    }>;
    parentVariantId: string;
    title?: string;
    image?: {
      url: string;
    };
    attributes?: Array<{
      key: string;
      value: string;
    }>;
    price?: {
      percentageDecrease: {
        value: string;
      };
    };
  };
  expand?: {
    cartLineId: string;
    expandedCartItems: Array<{
      merchandiseId: string;
      quantity: number;
    }>;
    title?: string;
    price?: {
      percentageDecrease: {
        value: string;
      };
    };
  };
}

export interface CartTransformResult {
  operations: CartTransformOperation[];
}

// Bundle ID normalization function
function normalizeBundleId(bundleInstanceId: string): string {
  if (!bundleInstanceId || typeof bundleInstanceId !== 'string') {
    Logger.warn('Invalid bundle instance ID', { phase: 'normalization' }, { bundleInstanceId });
    return bundleInstanceId || '';
  }

  Logger.debug('Normalizing bundle ID', { phase: 'normalization' }, { input: bundleInstanceId });

  let baseBundleId = bundleInstanceId;

  // Check if it contains an underscore (indicating hash suffix)
  if (bundleInstanceId.includes('_')) {
    const parts = bundleInstanceId.split('_');
    baseBundleId = parts[0];
    Logger.debug('Extracted base ID from hash format', { phase: 'normalization' }, {
      original: bundleInstanceId,
      base: baseBundleId,
      hash: parts.slice(1).join('_')
    });
  }

  // Handle GID format normalization
  if (baseBundleId.startsWith('gid://shopify/')) {
    Logger.debug('Detected GID format', { phase: 'normalization' }, { bundleId: baseBundleId });
  }

  baseBundleId = baseBundleId.trim();

  if (!baseBundleId) {
    Logger.warn('Empty base bundle ID after normalization', { phase: 'normalization' }, { original: bundleInstanceId });
    return bundleInstanceId;
  }

  Logger.debug('Bundle ID normalized successfully', { phase: 'normalization' }, {
    input: bundleInstanceId,
    output: baseBundleId
  });

  return baseBundleId;
}

// Simplified bundle ID matching function - only exact base ID match
function matchBundleConfiguration(baseBundleId: string, bundleInstanceId: string, bundleConfigs: any): any {
  const context = { phase: 'matching', bundleId: baseBundleId };

  Logger.debug('Attempting bundle configuration match', context, {
    baseBundleId,
    availableConfigs: Object.keys(bundleConfigs)
  });

  // Simple exact match with base bundle ID
  if (bundleConfigs[baseBundleId]) {
    Logger.info('Found base ID match', context, { matchedId: baseBundleId });
    return bundleConfigs[baseBundleId];
  }

  Logger.warn('No configuration found for bundle ID', context, {
    baseBundleId,
    availableConfigs: Object.keys(bundleConfigs)
  });
  return null;
}

// Enhanced merge operation validation function
function validateMergeOperationRequirements(
  bundleContainerVariantId: string | null,
  lines: any[],
  bundleConfig: any,
  baseBundleId: string,
  bundleInstanceId: string
): { isValid: boolean; reason: string } {

  const context = { phase: 'validation', bundleId: baseBundleId };

  Logger.debug('Validating merge operation requirements', context, {
    hasContainerVariantId: !!bundleContainerVariantId,
    lineCount: lines?.length || 0
  });

  // Validation 1: Check bundleParentVariantId
  if (!bundleContainerVariantId) {
    const reason = 'Missing bundleParentVariantId in bundle configuration';
    Logger.error(reason, context, { bundleConfig });
    return { isValid: false, reason };
  }

  // Validation 2: Check bundleParentVariantId format
  if (typeof bundleContainerVariantId !== 'string' || bundleContainerVariantId.trim() === '') {
    const reason = `Invalid bundleParentVariantId format: expected non-empty string, got ${typeof bundleContainerVariantId}`;
    Logger.error(reason, context);
    return { isValid: false, reason };
  }

  // Validation 3: Check if bundleParentVariantId looks like a valid Shopify GID
  if (!bundleContainerVariantId.includes('ProductVariant') && !bundleContainerVariantId.includes('Product')) {
    Logger.warn('bundleParentVariantId may not be a valid Shopify GID', context, {
      bundleParentVariantId: bundleContainerVariantId
    });
  }

  // Validation 4: Check cart lines
  if (!lines || lines.length === 0) {
    const reason = `No cart lines found for bundle instance ${bundleInstanceId}`;
    Logger.error(reason, context);
    return { isValid: false, reason };
  }

  // Validation 5: Validate individual cart lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.id) {
      const reason = `Cart line ${i} missing required 'id' field`;
      Logger.error(reason, context);
      return { isValid: false, reason };
    }
    if (typeof line.quantity !== 'number' || line.quantity <= 0) {
      const reason = `Cart line ${line.id} has invalid quantity: ${line.quantity}`;
      Logger.error(reason, context, { cartLineId: line.id });
      return { isValid: false, reason };
    }
  }

  // Validation 6: Check minimum bundle requirements
  if (lines.length < 2) {
    Logger.warn('Bundle has only one cart line', context, { lineCount: lines.length });
  }

  // Validation 7: Validate bundle configuration structure
  if (bundleConfig) {
    if (!bundleConfig.name && !bundleConfig.bundleName) {
      Logger.warn('Bundle missing display name', context);
    }

    if (bundleConfig.pricing && bundleConfig.pricing.enabled) {
      if (!bundleConfig.pricing.rules || !Array.isArray(bundleConfig.pricing.rules) || bundleConfig.pricing.rules.length === 0) {
        Logger.warn('Bundle has pricing enabled but no valid rules', context);
      }
    }
  }

  Logger.debug('All validation checks passed', context, { lineCount: lines.length });
  return { isValid: true, reason: 'All validation checks passed' };
}

// Enhanced bundle configuration validation and sanitization function
function validateAndSanitizeBundleConfig(bundleConfig: any, index: number): { isValid: boolean; config?: any; reason?: string } {
  const context = { phase: 'config-validation' };

  try {
    if (!bundleConfig) {
      return {
        isValid: false,
        reason: `Bundle config at index ${index} is null or undefined`
      };
    }

    if (typeof bundleConfig !== 'object') {
      return {
        isValid: false,
        reason: `Bundle config at index ${index} is not an object (type: ${typeof bundleConfig})`
      };
    }

    const configId = bundleConfig.id || bundleConfig.bundleId;
    if (!configId || typeof configId !== 'string' || configId.trim() === '') {
      return {
        isValid: false,
        reason: `Bundle config at index ${index} missing or invalid ID field (id: ${configId})`
      };
    }

    // Sanitize and validate the configuration
    const sanitizedConfig = {
      ...bundleConfig,
      id: configId.trim(),
      name: bundleConfig.name || `Bundle ${configId}`,
    };

    // Validate bundleParentVariantId if present
    if (sanitizedConfig.bundleParentVariantId) {
      const parentVariantId = sanitizedConfig.bundleParentVariantId.trim();
      if (!parentVariantId.includes('ProductVariant') && !parentVariantId.includes('Product')) {
        Logger.warn('bundleParentVariantId may not be a valid Shopify GID', context, {
          bundleId: configId,
          bundleParentVariantId: parentVariantId
        });
      }
    }

    // Validate and sanitize pricing configuration
    if (sanitizedConfig.pricing) {
      try {
        const pricingValidation = validatePricingConfiguration(sanitizedConfig.pricing, configId);
        if (pricingValidation.isValid) {
          sanitizedConfig.pricing = pricingValidation.config;
        } else {
          Logger.warn('Invalid pricing config removed', context, {
            bundleId: configId,
            reason: pricingValidation.reason
          });
          delete sanitizedConfig.pricing;
        }
      } catch (pricingError) {
        Logger.error('Pricing config validation error', context, pricingError);
        delete sanitizedConfig.pricing;
      }
    }

    return {
      isValid: true,
      config: sanitizedConfig
    };
  } catch (error) {
    Logger.error('Bundle config validation failed', context, error);
    return {
      isValid: false,
      reason: `Bundle config at index ${index} validation failed: ${(error as Error).message}`
    };
  }
}

function validatePricingConfiguration(pricing: any, bundleId: string): { isValid: boolean; config?: any; reason?: string } {
  if (!pricing || typeof pricing !== 'object') {
    return {
      isValid: false,
      reason: 'Pricing configuration is null or not an object'
    };
  }

  const sanitizedPricing = {
    enabled: Boolean(pricing.enabled),
    method: pricing.method || 'percentage_off',
    rules: []
  };

  // Validate pricing method
  const validMethods = ['percentage_off', 'fixed_amount_off', 'fixed_bundle_price'];
  if (!validMethods.includes(sanitizedPricing.method)) {
    Logger.warn('Unknown pricing method, defaulting to percentage_off', { bundleId }, {
      method: pricing.method
    });
    sanitizedPricing.method = 'percentage_off';
  }

  // Validate and sanitize pricing rules (NEW nested structure only)
  if (pricing.rules && Array.isArray(pricing.rules)) {
    sanitizedPricing.rules = pricing.rules.filter((rule: any) => {
      if (!rule || typeof rule !== 'object') {
        Logger.warn('Invalid pricing rule removed', { bundleId });
        return false;
      }

      // Validate nested condition structure
      if (!rule.condition || typeof rule.condition !== 'object') {
        Logger.warn('Pricing rule missing nested condition object', { bundleId });
        return false;
      }

      if (rule.condition.value === undefined || isNaN(parseFloat(rule.condition.value))) {
        Logger.warn('Pricing rule condition missing valid value', { bundleId });
        return false;
      }

      if (!rule.condition.type || !rule.condition.operator) {
        Logger.warn('Pricing rule condition missing type or operator', { bundleId });
        return false;
      }

      // Validate nested discount structure
      if (!rule.discount || typeof rule.discount !== 'object') {
        Logger.warn('Pricing rule missing nested discount object', { bundleId });
        return false;
      }

      if (rule.discount.value === undefined || isNaN(parseFloat(rule.discount.value))) {
        Logger.warn('Pricing rule discount missing valid value', { bundleId });
        return false;
      }

      if (!rule.discount.method) {
        Logger.warn('Pricing rule discount missing method', { bundleId });
        return false;
      }

      return true;
    });
  }

  // If pricing is enabled but no valid rules, disable it
  if (sanitizedPricing.enabled && sanitizedPricing.rules.length === 0) {
    Logger.warn('Pricing enabled but no valid rules, disabling', { bundleId });
    sanitizedPricing.enabled = false;
  }

  return {
    isValid: true,
    config: sanitizedPricing
  };
}

// Bundle configuration validation function
function validateBundleConfigurations(bundleConfigsMap: any): any {
  const context = { phase: 'config-validation' };
  const validatedConfigs: any = {};

  Logger.debug('Validating bundle configurations', context, {
    totalConfigs: Object.keys(bundleConfigsMap).length
  });

  for (const [bundleId, config] of Object.entries(bundleConfigsMap)) {
    if (validateBundleConfiguration(config as any, bundleId)) {
      validatedConfigs[bundleId] = config;
    } else {
      Logger.warn('Invalid bundle configuration skipped', { ...context, bundleId });
    }
  }

  Logger.summary('Bundle configuration validation', validatedConfigs, context);
  return validatedConfigs;
}

// Validate individual bundle configuration
function validateBundleConfiguration(config: any, bundleId: string): boolean {
  const context = { phase: 'config-validation', bundleId };

  if (!config || typeof config !== 'object') {
    Logger.error('Configuration is null or not an object', context);
    return false;
  }

  // Check required ID field
  const configId = config.id || config.bundleId;
  if (!configId) {
    Logger.error('Missing required ID field', context);
    return false;
  }

  // Check required bundleParentVariantId field
  if (!config.bundleParentVariantId) {
    Logger.error('Missing required bundleParentVariantId field', context, { config });
    return false;
  }

  // Validate bundleParentVariantId format
  if (typeof config.bundleParentVariantId !== 'string' || !config.bundleParentVariantId.includes('ProductVariant')) {
    Logger.error('Invalid bundleParentVariantId format', context, {
      bundleParentVariantId: config.bundleParentVariantId
    });
    return false;
  }

  Logger.debug('Bundle configuration is valid', context);
  return true;
}

// Main function - matches the export name expected by Shopify Functions
export function run(input: CartTransformInput): CartTransformResult {
  return cartTransformRun(input);
}

// Create O(1) bundle configuration lookup map
function createBundleConfigsMap(bundleConfigs: any[]): Record<string, any> {
  const bundleConfigsMap: Record<string, any> = {};
  bundleConfigs.forEach(config => {
    if (config && config.id) {
      bundleConfigsMap[config.id] = config;
    }
  });
  return bundleConfigsMap;
}

// Comprehensive rule evaluation for all condition types (NEW nested structure only)
function evaluateRule(rule: any, totalQuantity: number, originalTotal: number): { meetsCondition: boolean; conditionType: string; conditionValue: number } {
  // Extract condition from nested structure (no fallbacks to old format)
  const condition = rule.condition || {};
  const conditionType = condition.type || 'quantity';
  const conditionValue = condition.value || 0;
  const conditionOperator = condition.operator || 'gte';

  // Get actual value to compare against
  // IMPORTANT: Shopify cart amounts are in decimal format (e.g., "74.99")
  // but condition values for 'amount' are stored in cents/minor units (e.g., 15500 = 155.00)
  // Convert condition value from cents to decimal amount for 'amount' type comparisons
  const conditionValueNormalized = conditionType === 'amount' ? conditionValue / 100 : conditionValue;
  const actualValue = conditionType === 'amount' ? originalTotal : totalQuantity;

  // Evaluate based on operator
  // Use conditionValueNormalized for amount comparisons to match Shopify's cart API format
  let meetsCondition = false;
  switch (conditionOperator) {
    case 'gte':
    case 'greater_than_equal_to':
      meetsCondition = actualValue >= conditionValueNormalized;
      break;
    case 'gt':
    case 'greater_than':
      meetsCondition = actualValue > conditionValueNormalized;
      break;
    case 'lte':
    case 'less_than_equal_to':
      meetsCondition = actualValue <= conditionValueNormalized;
      break;
    case 'lt':
    case 'less_than':
      meetsCondition = actualValue < conditionValueNormalized;
      break;
    case 'eq':
    case 'equal_to':
      meetsCondition = actualValue === conditionValueNormalized;
      break;
    default:
      // Default to greater than or equal
      meetsCondition = actualValue >= conditionValueNormalized;
  }

  return {
    meetsCondition,
    conditionType,
    conditionValue: conditionValueNormalized  // Return converted value for logging
  };
}

// Find the best applicable rule considering all condition types
function findBestApplicableRule(rules: any[], totalQuantity: number, originalTotal: number): any {
  if (!rules || rules.length === 0) {
    return null;
  }

  // Evaluate all rules
  const evaluatedRules = rules.map(rule => ({
    rule,
    evaluation: evaluateRule(rule, totalQuantity, originalTotal)
  }));

  // Filter applicable rules
  const applicableRules = evaluatedRules.filter(evaluated => evaluated.evaluation.meetsCondition);

  if (applicableRules.length === 0) {
    return null;
  }

  // Sort by condition value descending (higher thresholds usually = better discounts)
  applicableRules.sort((a, b) => b.evaluation.conditionValue - a.evaluation.conditionValue);

  return {
    rule: applicableRules[0].rule,
    evaluation: applicableRules[0].evaluation
  };
}

// Internal function - keeping for compatibility
export function cartTransformRun(input: CartTransformInput): CartTransformResult {
  try {
    Logger.info('Cart transform started', { phase: 'init' }, {
      cartLines: input?.cart?.lines?.length || 0,
      hasShopMetafield: !!input?.shop?.all_bundles?.value
    });

    // Edge case handling
    if (!input?.cart?.lines || input.cart.lines.length === 0) {
      Logger.info('Empty cart, no transformation needed', { phase: 'init' });
      return { operations: [] };
    }

    // Bundle detection
    const bundleLines = input.cart.lines.filter(line =>
      line.bundleId && line.bundleId.value && line.bundleId.value.trim() !== ''
    );

    Logger.info('Bundle detection completed', { phase: 'detection' }, {
      totalLines: input.cart.lines.length,
      bundleLines: bundleLines.length,
      bundleIds: bundleLines.map(line => line.bundleId?.value).filter(Boolean)
    });

    if (bundleLines.length === 0) {
      Logger.info('No bundle lines found', { phase: 'detection' });
      return { operations: [] };
    }

    // Configuration loading - NEW: Load from per-product metafields
    const bundleConfigs: Record<string, any> = {};
    let configsLoadedCount = 0;

    for (const line of bundleLines) {
      const configValue = line.merchandise?.product?.cartTransformConfig?.value;

      if (configValue) {
        try {
          const config = JSON.parse(configValue);

          // Validate config structure
          if (!config.id || !config.parentVariantId) {
            Logger.warn('Invalid config structure', { phase: 'config-loading' }, {
              hasId: !!config.id,
              hasParentVariantId: !!config.parentVariantId,
              lineId: line.id
            });
            continue;
          }

          // Map parentVariantId to bundleParentVariantId for compatibility with existing code
          bundleConfigs[config.id] = {
            ...config,
            bundleParentVariantId: config.parentVariantId
          };

          configsLoadedCount++;
        } catch (error) {
          Logger.error('Failed to parse cart transform config', { phase: 'config-loading' }, {
            error,
            lineId: line.id
          });
        }
      }
    }

    Logger.info('Configuration loading completed', { phase: 'config-loading' }, {
      bundleConfigsFound: configsLoadedCount,
      uniqueBundles: Object.keys(bundleConfigs).length
    });

    if (Object.keys(bundleConfigs).length === 0) {
      Logger.warn('No bundle configurations found', { phase: 'config-loading' });
      return { operations: [] };
    }

    // bundleConfigs is already a map (Record<string, any>), no need to transform

    Logger.debug('Bundle configuration map created', { phase: 'config-loading' }, {
      availableBundleIds: Object.keys(bundleConfigs)
    });

    // Process bundles by instance ID (supports multiple bundle instances)
    const operations: CartTransformOperation[] = [];
    const processedInstances = new Set<string>();

    for (const line of bundleLines) {
      const bundleInstanceId = line.bundleId?.value;
      if (!bundleInstanceId || processedInstances.has(bundleInstanceId)) {
        continue;
      }

      // Normalize bundle ID to find configuration
      const baseBundleId = normalizeBundleId(bundleInstanceId);
      const bundleConfig = bundleConfigs[baseBundleId]; // O(1) lookup

      Logger.debug('Processing bundle instance', { phase: 'processing' }, {
        instanceId: bundleInstanceId,
        baseBundleId: baseBundleId,
        configFound: !!bundleConfig
      });

      if (!bundleConfig || !bundleConfig.bundleParentVariantId) {
        Logger.warn('Bundle configuration not found or invalid', { phase: 'processing' }, {
          baseBundleId,
          hasConfig: !!bundleConfig,
          hasParentVariant: !!bundleConfig?.bundleParentVariantId
        });
        continue;
      }

      // Find all lines for this specific bundle instance
      const bundleLinesForInstance = bundleLines.filter(l =>
        l.bundleId?.value === bundleInstanceId
      );

      // Calculate totals for rule evaluation
      const totalQuantity = bundleLinesForInstance.reduce((sum, l) => sum + l.quantity, 0);
      const originalTotal = bundleLinesForInstance.reduce((sum, l) =>
        sum + (parseFloat(l.cost.totalAmount.amount) || 0), 0
      );

      // Check if bundle has pricing rules (but don't require them to be met for merging)
      const hasPricingRules = bundleConfig.pricing?.enabled && bundleConfig.pricing?.rules?.length > 0;
      
      Logger.debug('Bundle pricing analysis', { phase: 'processing' }, {
        baseBundleId,
        totalQuantity,
        originalTotal,
        hasPricingRules,
        availableRules: bundleConfig.pricing?.rules?.map((r: any) => ({
          conditionType: r.conditionType || 'quantity',
          value: r.value || r.minimumQuantity || r.numberOfProducts,
          discount: r.percentageOff || r.fixedBundlePrice || r.fixedAmountOff
        })) || []
      });

      // Comprehensive discount calculation with all condition types
      let discountPercentage = 0;
      let appliedRuleResult: any = null;

      if (hasPricingRules) {
        // Find the best applicable rule considering all condition types
        try {
          appliedRuleResult = findBestApplicableRule(bundleConfig.pricing.rules, totalQuantity, originalTotal);
        } catch (error) {
          Logger.error('Best rule selection failed', { phase: 'processing' }, {
            baseBundleId,
            rules: bundleConfig.pricing.rules,
            error
          });
          appliedRuleResult = null;
        }

        if (appliedRuleResult) {
          const appliedRule = appliedRuleResult.rule;
          const evaluation = appliedRuleResult.evaluation;

          // Extract discount value from NEW nested structure only
          const discount = appliedRule.discount || {};
          const discountMethod = discount.method || bundleConfig.pricing.method;
          const discountValue = parseFloat(discount.value || 0);

          if (discountMethod === 'fixed_bundle_price') {
            // For fixed price, value is stored in cents, convert to decimal
            const fixedPrice = discountValue / 100;
            if (originalTotal > 0 && fixedPrice < originalTotal) {
              discountPercentage = ((originalTotal - fixedPrice) / originalTotal) * 100;
            }
          } else if (discountMethod === 'percentage_off') {
            // Percentage is stored as-is
            discountPercentage = discountValue;
          } else if (discountMethod === 'fixed_amount_off') {
            // For fixed amount off, value is stored in cents, convert to decimal
            const fixedAmountOff = discountValue / 100;
            if (originalTotal > 0 && fixedAmountOff > 0) {
              discountPercentage = (fixedAmountOff / originalTotal) * 100;
            }
          }

          Logger.debug('Discount applied', { phase: 'processing' }, {
            baseBundleId,
            method: bundleConfig.pricing.method,
            originalTotal,
            totalQuantity,
            appliedRule: {
              conditionType: appliedRuleResult.evaluation.conditionType,
              conditionValue: appliedRuleResult.evaluation.conditionValue,
              meetsCondition: appliedRuleResult.evaluation.meetsCondition,
              discountMethod,
              discountValue: appliedRuleResult.rule.discount?.value || 0
            },
            discountPercentage: discountPercentage.toFixed(2),
            finalPrice: (originalTotal * (1 - discountPercentage / 100)).toFixed(2)
          });
        } else {
          Logger.info('No applicable discount rules met, merging without discount', { phase: 'processing' }, {
            baseBundleId,
            totalQuantity,
            originalTotal,
            availableRules: bundleConfig.pricing.rules?.length || 0
          });
        }
      } else {
        Logger.info('Bundle has no pricing rules, merging without discount', { phase: 'processing' }, {
          baseBundleId,
          totalQuantity,
          originalTotal
        });
      }

      // Create merge operation
      const mergeOperation: CartTransformOperation = {
        merge: {
          cartLines: bundleLinesForInstance.map(l => ({
            cartLineId: l.id,
            quantity: l.quantity
          })),
          parentVariantId: bundleConfig.bundleParentVariantId,
          title: bundleConfig.name || `Bundle ${baseBundleId}`,
          ...(discountPercentage > 0 && {
            price: {
              percentageDecrease: {
                value: discountPercentage.toString()
              }
            }
          })
        }
      };

      operations.push(mergeOperation);
      processedInstances.add(bundleInstanceId);

      Logger.info('Merge operation created', { phase: 'processing' }, {
        baseBundleId,
        cartLines: bundleLinesForInstance.length,
        discount: discountPercentage.toFixed(2) + '%'
      });
    }

    Logger.info('Cart transform completed', { phase: 'complete' }, {
      operationsCreated: operations.length,
      bundleInstancesProcessed: processedInstances.size
    });

    return { operations };

  } catch (error) {
    Logger.error('Cart transform failed', { phase: 'error' }, error);
    return { operations: [] };
  }
}