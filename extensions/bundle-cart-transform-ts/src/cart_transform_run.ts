// Import utility functions
import { normalizeProductId } from './cart-transform-bundle-utils-v2';

// Define types for cart transform function following official Shopify standard
export interface CartTransformInput {
  cart: {
    lines: Array<{
      id: string;
      quantity: number;
      // Cart line attribute for bundle ID (line item properties become attributes)
      attribute?: {
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
          all_bundles_data?: {
            value: string;
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
    // Cart-level bundle configurations metafield
    bundleConfig?: {
      value: string;
    };
    // Legacy fallback
    allBundlesConfig?: {
      value: string;
      jsonValue?: any;
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
        value: number;
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
        value: number;
      };
    };
  };
}

export interface CartTransformResult {
  operations: CartTransformOperation[];
}

// Main function - matches the export name expected by Shopify Functions
export function run(input: CartTransformInput): CartTransformResult {
  return cartTransformRun(input);
}

// Internal function - keeping for compatibility
export function cartTransformRun(
  input: CartTransformInput,
): CartTransformResult {
  console.log("🔍 [CART TRANSFORM DEBUG] Cart Transform function called!");
  console.log("🔍 [CART TRANSFORM DEBUG] Function execution started at:", new Date().toISOString());
  console.log("🔍 [CART TRANSFORM DEBUG] Input cart:", JSON.stringify(input.cart, null, 2));

  if (!input.cart.lines.length) {
    console.log("🔍 [CART TRANSFORM DEBUG] Empty cart, no transformation needed");
    return { operations: [] };
  }

  // Try multiple approaches for maximum compatibility

  // 1. PRIORITY: Check for cart line attributes (widget-based bundles)
  // Line item properties added via cart add become accessible as attributes in cart transform
  const hasCartLineAttributes = input.cart.lines.some(line => line.attribute?.value);

  if (hasCartLineAttributes) {
    console.log("🔍 [CART TRANSFORM DEBUG] Detected cart line attributes - using widget-based bundle approach");

    // Try to get bundle configs from product metafields (all_bundles_data)
    let bundleConfigsMap: any = {};

    // Check each product in cart for all_bundles_data metafield
    for (const line of input.cart.lines) {
      if (line.merchandise?.product?.all_bundles_data?.value) {
        try {
          const bundleConfigsArray = JSON.parse(line.merchandise.product.all_bundles_data.value);
          console.log("🔍 [CART TRANSFORM DEBUG] Found all_bundles_data on product:", line.merchandise.product.id);
          console.log("🔍 [CART TRANSFORM DEBUG] Bundle configs:", bundleConfigsArray);

          // Convert array to map indexed by bundle ID
          if (Array.isArray(bundleConfigsArray)) {
            bundleConfigsArray.forEach((config: any) => {
              const bundleId = config.id || config.bundleId;
              if (bundleId && !bundleConfigsMap[bundleId]) {
                bundleConfigsMap[bundleId] = config;
                console.log(`🔍 [CART TRANSFORM DEBUG] Mapped bundle config for ID: ${bundleId}`);
              }
            });
          }
        } catch (error) {
          console.log("⚠️ [CART TRANSFORM DEBUG] Error parsing all_bundles_data:", error);
        }
      }
    }

    // Process widget bundles WITH bundle configs from product metafields
    return processCartTransformWithWidgetBundles(input.cart, bundleConfigsMap);
  }

  // 2. Check for cart-level bundle configurations (legacy approach)
  if (input.cart.allBundlesConfig?.value || input.cart.allBundlesConfig?.jsonValue) {
    try {
      console.log("🔍 [CART TRANSFORM DEBUG] Using cart-level allBundlesConfig metafield approach");
      const bundleConfigsJson = input.cart.allBundlesConfig.jsonValue || input.cart.allBundlesConfig.value;
      const bundleConfigs = typeof bundleConfigsJson === 'string' ? JSON.parse(bundleConfigsJson) : bundleConfigsJson;
      return processCartTransformWithBundleConfigs(input.cart, bundleConfigs);
    } catch (error) {
      console.log("🔍 [CART TRANSFORM DEBUG] Error parsing allBundlesConfig metafield:", error);
    }
  }

  // 3. Check for cart bundleConfig metafield
  if (input.cart.bundleConfig?.value) {
    try {
      console.log("🔍 [CART TRANSFORM DEBUG] Using cart-level bundleConfig metafield approach");
      const bundleConfigs = JSON.parse(input.cart.bundleConfig.value);
      return processCartTransformWithBundleConfigs(input.cart, bundleConfigs);
    } catch (error) {
      console.log("🔍 [CART TRANSFORM DEBUG] Error parsing bundleConfig metafield:", error);
    }
  }

  // 4. Check for product-level metafields (also legacy but from product level)
  const hasProductMetafields = input.cart.lines.some(line =>
    line.merchandise?.product?.bundle_config?.value
  );

  if (hasProductMetafields) {
    console.log("🔍 [CART TRANSFORM DEBUG] Using product-level bundle configurations approach");
    return processCartTransformWithProductMetafields(input.cart);
  }

  // 5. Standard Shopify metafields approach (official)
  console.log("🔍 [CART TRANSFORM DEBUG] Using official Shopify standard metafields approach");
  return processCartTransformWithStandardMetafields(input.cart);
}

// NEW: Widget-based bundle processing (using cart line attributes)
function processCartTransformWithWidgetBundles(cart: any, bundleConfigs: any): CartTransformResult {
  console.log("🔍 [WIDGET BUNDLES] Processing widget-based bundles");
  console.log("🔍 [WIDGET BUNDLES] Bundle configs map:", JSON.stringify(bundleConfigs, null, 2));
  const operations = [];

  // Group cart lines by bundle instance ID
  // Bundle instance ID format: bundleId_hash (e.g., "bundle123_456789")
  // This allows same bundle with different products to be separate line items
  const bundleGroups = new Map<string, any[]>();

  for (const line of cart.lines) {
    // Extract bundle instance ID from attribute (line item properties become attributes in cart transform)
    const bundleInstanceId = line.attribute?.value;

    if (bundleInstanceId) {
      if (!bundleGroups.has(bundleInstanceId)) {
        bundleGroups.set(bundleInstanceId, []);
      }
      bundleGroups.get(bundleInstanceId)!.push(line);
      console.log(`🔍 [WIDGET BUNDLES] Found line ${line.id} with bundle instance ID: ${bundleInstanceId}`);
    }
  }

  console.log(`🔍 [WIDGET BUNDLES] Found ${bundleGroups.size} bundle instance groups`);
  console.log(`🔍 [WIDGET BUNDLES] Bundle group keys:`, Array.from(bundleGroups.keys()));

  // Process each bundle group
  for (const [bundleInstanceId, lines] of bundleGroups.entries()) {
    console.log(`🔍 [WIDGET BUNDLES] Processing bundle instance ${bundleInstanceId} with ${lines.length} lines`);

    // Extract base bundle ID from instance ID (format: bundleId_hash)
    const baseBundleId = bundleInstanceId.split('_')[0];
    console.log(`🔍 [WIDGET BUNDLES] Base bundle ID: ${baseBundleId}`);
    console.log(`🔍 [WIDGET BUNDLES] Full instance ID: ${bundleInstanceId}`);

    // Try to get bundle config from cart line product metafields
    // Priority 1: Check product metafields on cart line products
    let bundleConfig = null;

    for (const line of lines) {
      if (line.merchandise?.product?.bundle_config?.value) {
        try {
          const productBundleConfig = JSON.parse(line.merchandise.product.bundle_config.value);
          console.log(`🔍 [WIDGET BUNDLES] Found bundle config on product ${line.merchandise.product.id}:`, JSON.stringify(productBundleConfig, null, 2));

          // Match by base bundle ID (strip hash suffix)
          const configId = productBundleConfig.bundleId || productBundleConfig.id;
          console.log(`🔍 [WIDGET BUNDLES] Comparing configId: ${configId} with baseBundleId: ${baseBundleId} and instanceId: ${bundleInstanceId}`);

          if (configId === baseBundleId || configId === bundleInstanceId) {
            bundleConfig = productBundleConfig;
            console.log(`✅ [WIDGET BUNDLES] Matched bundle config: ${bundleConfig.name} (Base ID: ${baseBundleId})`);
            break;
          } else {
            console.log(`❌ [WIDGET BUNDLES] No match: ${configId} !== ${baseBundleId}`);
          }
        } catch (error) {
          console.log(`⚠️ [WIDGET BUNDLES] Error parsing product bundle config:`, error);
        }
      }
    }

    // Priority 2: Fallback to passed bundleConfigs object (from cart transform metafield - if available)
    // Try both instance ID and base ID
    if (!bundleConfig && (bundleConfigs[bundleInstanceId] || bundleConfigs[baseBundleId])) {
      bundleConfig = bundleConfigs[bundleInstanceId] || bundleConfigs[baseBundleId];
      console.log(`🔍 [WIDGET BUNDLES] Using bundle config from cart transform metafield`);
    }

    if (bundleConfig) {
      console.log(`🔍 [WIDGET BUNDLES] Found config for bundle: ${bundleConfig.name}`);
    } else {
      console.log(`🔍 [WIDGET BUNDLES] No config found for bundle ${baseBundleId} - using minimal merge`);
    }

    // Get bundle container product variant ID
    let bundleContainerVariantId = null;

    // PRIORITY 1: Use explicit bundleParentVariantId if available (most reliable)
    if (bundleConfig?.bundleParentVariantId) {
      bundleContainerVariantId = bundleConfig.bundleParentVariantId;
      console.log(`🔍 [WIDGET BUNDLES] Using explicit bundleParentVariantId: ${bundleContainerVariantId}`);
    }
    // PRIORITY 2: Use shopifyProductId to construct variant ID
    else if (bundleConfig?.shopifyProductId) {
      const productId = bundleConfig.shopifyProductId;
      console.log(`🔍 [WIDGET BUNDLES] Found shopifyProductId: ${productId}`);

      // Convert Product GID to ProductVariant GID by extracting numeric ID
      if (productId.includes('/Product/')) {
        // Extract numeric ID from GID (e.g., "gid://shopify/Product/8375848042692" → "8375848042692")
        const numericId = productId.split('/Product/')[1];
        // We need the actual first variant ID - for now, log warning that we need it from metafield
        console.log(`⚠️ [WIDGET BUNDLES] WARNING: Cannot construct variant ID from product ID alone`);
        console.log(`⚠️ [WIDGET BUNDLES] Product ID: ${productId}, Numeric ID: ${numericId}`);
        console.log(`⚠️ [WIDGET BUNDLES] Bundle config must include bundleParentVariantId for merge operations to work`);
        bundleContainerVariantId = null; // Cannot merge without valid variant ID
      }
    }

    // If we don't have a valid variant ID, skip this bundle
    if (!bundleContainerVariantId) {
      console.log(`❌ [WIDGET BUNDLES] Cannot create merge operation: missing bundleParentVariantId in bundle config`);
      console.log(`❌ [WIDGET BUNDLES] Bundle ${baseBundleId} will not be merged - please ensure bundleParentVariantId is set in metafield`);
      continue; // Skip this bundle
    }

    console.log(`✅ [WIDGET BUNDLES] Using bundle container variant: ${bundleContainerVariantId}`);

    // Calculate total original price
    const totalAmount = lines.reduce((sum: number, line: any) => {
      const amount = parseFloat(line.cost?.totalAmount?.amount || '0');
      return sum + amount;
    }, 0);

    // Create merge operation
    const mergeOperation: any = {
      parentVariantId: bundleContainerVariantId,
      cartLines: lines.map(line => ({
        cartLineId: line.id,
        quantity: line.quantity
      })),
      title: bundleConfig?.name || `Bundle ${baseBundleId}`,
      attributes: [
        {
          key: "_bundle_id",
          value: bundleInstanceId // Use full instance ID to preserve unique bundle configurations
        },
        {
          key: "_bundle_base_id",
          value: baseBundleId // Keep base ID for reference
        }
      ]
    };

    // Apply pricing if available and add discount information to attributes
    if (bundleConfig?.pricing) {
      const pricingResult = calculateBundlePriceFromConfig(bundleConfig, lines);
      if (pricingResult) {
        mergeOperation.price = pricingResult.priceAdjustment;

        // Add discount savings information as cart attributes for display
        if (pricingResult.savingsAmount > 0) {
          mergeOperation.attributes.push(
            {
              key: "_bundle_savings",
              value: pricingResult.savingsAmount.toFixed(2)
            },
            {
              key: "_bundle_original_price",
              value: totalAmount.toFixed(2)
            },
            {
              key: "_bundle_discount_type",
              value: bundleConfig.pricing.method || 'unknown'
            }
          );
        }
      }
    }

    operations.push({ merge: mergeOperation });
    console.log(`✅ [WIDGET BUNDLES] Created merge operation for bundle instance ${bundleInstanceId} (base: ${baseBundleId})`);
  }

  console.log(`🔍 [WIDGET BUNDLES] Completed with ${operations.length} operations`);
  console.log(`📦 [WIDGET BUNDLES] Each unique bundle configuration is a separate cart line`);
  console.log(`🔍 [WIDGET BUNDLES] Operations:`, JSON.stringify(operations, null, 2));

  return { operations };
}

// Helper function to calculate bundle price from config
function calculateBundlePriceFromConfig(bundleConfig: any, lines: any[]): any {
  const pricing = bundleConfig.pricing;
  if (!pricing || !pricing.enabled) {
    return null;
  }

  const rules = pricing.rules || [];
  if (rules.length === 0) {
    return null;
  }

  // Get the first rule (can be enhanced for multiple rules)
  const rule = rules[0];

  // Calculate total quantity and amount
  const totalQuantity = lines.reduce((sum: number, line: any) => sum + line.quantity, 0);
  const totalAmount = lines.reduce((sum: number, line: any) => {
    const amount = parseFloat(line.cost?.totalAmount?.amount || '0');
    return sum + amount;
  }, 0);

  console.log(`🔍 [BUNDLE PRICING] Bundle pricing: method=${pricing.method}, totalQty=${totalQuantity}, totalAmt=${totalAmount}`);

  // Apply discount based on method
  switch (pricing.method) {
    case 'percentage_off': {
      const discountPercent = parseFloat(rule.discountValue || '0');
      if (discountPercent > 0) {
        const savingsAmount = (totalAmount * discountPercent) / 100;
        return {
          priceAdjustment: {
            percentageDecrease: {
              value: discountPercent
            }
          },
          savingsAmount: savingsAmount
        };
      }
      break;
    }

    case 'fixed_amount_off': {
      const discountAmount = parseFloat(rule.discountValue || '0');
      if (discountAmount > 0 && totalAmount > 0) {
        const discountPercent = (discountAmount / totalAmount) * 100;
        return {
          priceAdjustment: {
            percentageDecrease: {
              value: Math.min(100, discountPercent)
            }
          },
          savingsAmount: Math.min(discountAmount, totalAmount)
        };
      }
      break;
    }

    case 'fixed_bundle_price': {
      // Fixed bundle price: Calculate discount based on ACTUAL cart total
      // rule.fixedBundlePrice contains the target price (e.g., ₹30)
      // rule.price is a fallback if fixedBundlePrice isn't set
      const fixedBundlePrice = parseFloat(rule.fixedBundlePrice || rule.price || '0');

      if (fixedBundlePrice > 0 && totalAmount > fixedBundlePrice) {
        // Calculate discount percentage based on actual cart total
        const discountAmount = totalAmount - fixedBundlePrice;
        const discountPercent = (discountAmount / totalAmount) * 100;

        console.log(`🔍 [BUNDLE PRICING] Fixed bundle price: ₹${fixedBundlePrice}`);
        console.log(`🔍 [BUNDLE PRICING] Cart total: ₹${totalAmount}`);
        console.log(`🔍 [BUNDLE PRICING] Calculated discount: ${discountPercent.toFixed(2)}%`);
        console.log(`💰 [BUNDLE PRICING] Savings amount: ₹${discountAmount.toFixed(2)}`);

        return {
          priceAdjustment: {
            percentageDecrease: {
              value: Math.min(100, Math.round(discountPercent * 100) / 100)
            }
          },
          savingsAmount: discountAmount
        };
      } else {
        console.log(`🔍 [BUNDLE PRICING] Fixed bundle price not applicable: price=${fixedBundlePrice}, total=${totalAmount}`);
      }
      break;
    }
  }

  return null;
}

// NEW: Official Shopify standard metafields approach (following sample.md)
function processCartTransformWithStandardMetafields(cart: any): CartTransformResult {
  const operations = [];

  // Process expand operations first (bundle products → individual components)
  const expandOperations = getExpandOperations(cart.lines);
  operations.push(...expandOperations);

  // Process merge operations (individual components → bundle products)
  const mergeOperations = getMergeOperations(cart.lines);
  operations.push(...mergeOperations);

  console.log(`🔍 [CART TRANSFORM DEBUG] Cart Transform completed with ${operations.length} operations`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Operations:`, JSON.stringify(operations, null, 2));

  return { operations };
}

// LEGACY: Primary approach using bundle configurations from product metafields or cart attributes
function processCartTransformWithBundleConfigs(cart: any, bundleConfigs: any): CartTransformResult {
  try {
    console.log("🔍 [CART TRANSFORM BUNDLE] Processing with bundle configurations");
    console.log("🔍 [CART TRANSFORM BUNDLE] Bundle configs:", JSON.stringify(bundleConfigs, null, 2));
    
    const operations = [];
    
    // Process each bundle configuration - bundleConfigs can be object with bundle IDs as keys or array
    const bundleConfigArray = Array.isArray(bundleConfigs) 
      ? bundleConfigs 
      : Object.values(bundleConfigs);
    
    for (const bundleConfig of bundleConfigArray) {
      if (bundleConfig && typeof bundleConfig === 'object') {
        console.log(`🔍 [CART TRANSFORM BUNDLE] Processing bundle: ${bundleConfig.name || 'Unnamed Bundle'}`);
        
        // Find products in cart that match this bundle
        const bundleOperations = processBundleConfiguration(cart, bundleConfig);
        operations.push(...bundleOperations);
      }
    }
    
    console.log(`🔍 [CART TRANSFORM BUNDLE] Generated ${operations.length} operations`);
    console.log("🔍 [CART TRANSFORM BUNDLE] Operations:", JSON.stringify(operations, null, 2));
    
    return { operations };
  } catch (error) {
    console.error("🔍 [CART TRANSFORM BUNDLE] Error processing bundle configs:", error);
    return { operations: [] };
  }
}

// FALLBACK: Original approach using product metafields (less reliable due to propagation delays)
function processCartTransformWithProductMetafields(cart: any): CartTransformResult {
  const operations = [];
  console.log("🔍 [PRODUCT METAFIELDS] Starting to process product-level bundle configurations");

  // Collect all bundle configurations from product metafields
  const bundleConfigurations: any[] = [];

  for (const line of cart.lines) {
    if (line.merchandise?.product?.bundle_config?.value) {
      try {
        const productBundleConfig = JSON.parse(line.merchandise.product.bundle_config.value);
        console.log(`🔍 [PRODUCT METAFIELDS] Found bundle config in product ${line.merchandise.product.id}:`, JSON.stringify(productBundleConfig, null, 2));

        // This is a structured bundle config - process it directly
        bundleConfigurations.push(productBundleConfig);
      } catch (error) {
        console.log(`🔍 [PRODUCT METAFIELDS] Error parsing product bundle config: ${error}`);
      }
    }
  }

  // Process each bundle configuration found
  for (const bundleConfig of bundleConfigurations) {
    console.log(`🔍 [PRODUCT METAFIELDS] Processing bundle configuration: ${bundleConfig.name} (ID: ${bundleConfig.bundleId})`);

    // Check if we have the required cart lines for this bundle
    const bundleOperations = processBundleConfiguration(cart, bundleConfig);
    operations.push(...bundleOperations);
  }

  // If no bundle configurations were found, fall back to standard metafields approach
  if (bundleConfigurations.length === 0) {
    console.log("🔍 [PRODUCT METAFIELDS] No product bundle configs found, using standard metafields");

    // Process expand operations first (bundle products → individual components)
    const expandOperations = getExpandOperations(cart.lines);
    operations.push(...expandOperations);

    // Process merge operations (individual components → bundle products)
    const mergeOperations = getMergeOperations(cart.lines);
    operations.push(...mergeOperations);
  }

  console.log(`🔍 [PRODUCT METAFIELDS] Cart Transform completed with ${operations.length} operations`);
  console.log(`🔍 [PRODUCT METAFIELDS] Operations:`, JSON.stringify(operations, null, 2));

  return { operations };
}

// NEW: Process bundle configuration using cart transform metafield data
function processBundleConfiguration(cart: any, bundleConfig: any): CartTransformOperation[] {
  const operations: CartTransformOperation[] = [];

  const bundleId = bundleConfig.bundleId || bundleConfig.id;
  console.log(`🔍 [BUNDLE CONFIG] Processing bundle: ${bundleConfig.name} (ID: ${bundleId})`);

  // Extract all product IDs from bundle configuration (supports multiple formats)
  const bundleProductIds: string[] = [];

  // Format 1: Legacy format with direct allBundleProductIds array (from metafield)
  if (bundleConfig.allBundleProductIds && Array.isArray(bundleConfig.allBundleProductIds)) {
    console.log(`🔍 [BUNDLE CONFIG] Using allBundleProductIds format:`, bundleConfig.allBundleProductIds);
    bundleProductIds.push(...bundleConfig.allBundleProductIds);
  }

  // Format 2: Steps-based format (from admin configuration)
  const steps = bundleConfig.steps || [];
  for (const step of steps) {
    // Handle both formats: products[] array and productIds[] array
    const stepProducts = step.products || [];
    const stepProductIds = step.productIds || [];

    // Add from products array (format: [{id: "gid://...", title: "..."}])
    for (const product of stepProducts) {
      if (product.id) {
        bundleProductIds.push(product.id);
      }
    }

    // Add from productIds array (format: ["gid://...", "gid://..."])
    bundleProductIds.push(...stepProductIds);
  }

  // Normalize all product IDs to ensure consistent matching
  const normalizedBundleProductIds = bundleProductIds.map(id => normalizeProductId(id));

  console.log(`🔍 [BUNDLE CONFIG] Bundle products (original): ${JSON.stringify(bundleProductIds)}`);
  console.log(`🔍 [BUNDLE CONFIG] Bundle products (normalized): ${JSON.stringify(normalizedBundleProductIds)}`);

  // Find cart lines that match this bundle's products using normalized IDs
  const matchingLines = cart.lines.filter((line: any) => {
    const productId = line.merchandise?.product?.id;
    if (!productId) return false;

    const normalizedLineProductId = normalizeProductId(productId);
    const isMatch = normalizedBundleProductIds.includes(normalizedLineProductId);

    if (isMatch) {
      console.log(`🔍 [BUNDLE CONFIG] Found matching line: ${line.id} for product ${productId} (normalized: ${normalizedLineProductId})`);
    } else {
      console.log(`🔍 [BUNDLE CONFIG] No match for line product ${productId} (normalized: ${normalizedLineProductId}) against bundle products: ${JSON.stringify(normalizedBundleProductIds)}`);
    }

    return isMatch;
  });

  console.log(`🔍 [BUNDLE CONFIG] Found ${matchingLines.length} matching lines for bundle ${bundleConfig.name}`);

  if (matchingLines.length === 0) {
    console.log(`🔍 [BUNDLE CONFIG] No matching products in cart for bundle ${bundleConfig.name}`);
    return operations;
  }

  // ENHANCED: Bundle Container Product Logic
  // The parent product acts as a pure container - users never add it directly to cart
  // Instead, when they build a bundle, they add component products with bundle properties
  // The cart transform then merges these components under the container product

  // Check if we have bundle component lines that need to be merged
  const bundleComponentLines = matchingLines.filter((line: any) => {
    // Look for bundle ID in line properties or metadata
    const lineProperties = line.properties || {};
    const bundleProperty = lineProperties._wolfpack_bundle_id || lineProperties['_bundle_id'];
    return bundleProperty === bundleId || bundleProperty === bundleConfig.id;
  });

  console.log(`🔍 [BUNDLE CONFIG] Found ${bundleComponentLines.length} bundle component lines for bundle ${bundleId}`);

  if (bundleComponentLines.length > 0) {
    // Create a virtual bundle container for merging
    // The parentVariantId should be the bundle product's first variant ID
    const bundleContainerProductId = bundleConfig.bundleProductId || bundleConfig.shopifyProductId;

    if (bundleContainerProductId) {
      console.log(`🔍 [BUNDLE CONFIG] Creating merge operation for bundle container: ${bundleContainerProductId}`);

      // Get the first variant of the bundle container product
      const bundleVariantId = bundleConfig.bundleVariantId || `${bundleContainerProductId.replace('Product', 'ProductVariant')}`;

      const mergeOperation: CartTransformMergeOperation = {
        parentVariantId: bundleVariantId,
        cartLines: bundleComponentLines.map((line: any) => ({
          cartLineId: line.id,
          quantity: line.quantity
        })),
        title: bundleConfig.name || `${bundleConfig.bundleName} Bundle`,
        price: calculateBundlePrice(bundleConfig, bundleComponentLines)
      };

      operations.push({ merge: mergeOperation });
      console.log(`🔍 [BUNDLE CONFIG] Created merge operation:`, JSON.stringify(mergeOperation, null, 2));
    } else {
      console.log(`🔍 [BUNDLE CONFIG] No bundle container product ID found for bundle ${bundleId}`);
    }
  }

  // FALLBACK: Legacy bundle product line handling (for backward compatibility)
  const legacyBundleProductLine = cart.lines.find((line: any) =>
    line.merchandise?.product?.bundle_config?.value
  );

  if (legacyBundleProductLine && bundleComponentLines.length === 0) {
    console.log(`🔍 [BUNDLE CONFIG] Found bundle product line: ${legacyBundleProductLine.id}`);

    // Find component lines (products that are in the bundle but NOT the bundle product itself)
    const componentLines = matchingLines.filter((line: any) =>
      line.id !== legacyBundleProductLine.id
    );

    if (componentLines.length > 0) {
      console.log(`🔍 [BUNDLE CONFIG] Found ${componentLines.length} component lines to merge`);

      // Create merge operation: merge component lines into the bundle product
      const mergeOperation = createMergeOperationForBundle(bundleProductLine, componentLines, bundleConfig);
      if (mergeOperation) {
        operations.push({ merge: mergeOperation });
        console.log(`🔍 [BUNDLE CONFIG] Created merge operation for bundle ${bundleConfig.name}`);
      }
    } else {
      console.log(`🔍 [BUNDLE CONFIG] No component lines to merge for bundle ${bundleConfig.name}`);
    }
  } else {
    console.log(`🔍 [BUNDLE CONFIG] No bundle product found in cart for bundle ${bundleConfig.name}`);
  }

  return operations;
}

// Check if bundle conditions are satisfied
function checkBundleConditions(cartLines: any[], bundleConfig: any): boolean {
  const steps = bundleConfig.steps || [];
  
  // Check step-level conditions
  for (const step of steps) {
    const stepProductIds = step.productIds || [];
    const minQuantity = step.minQuantity || 1;
    
    // Count how many products from this step are in the cart
    let stepQuantity = 0;
    for (const line of cartLines) {
      const productId = line.merchandise?.product?.id;
      if (stepProductIds.includes(productId)) {
        stepQuantity += line.quantity;
      }
    }
    
    console.log(`🔍 [BUNDLE CONDITIONS] Step "${step.name}": need ${minQuantity}, have ${stepQuantity}`);
    
    if (stepQuantity < minQuantity) {
      console.log(`🔍 [BUNDLE CONDITIONS] Step "${step.name}" not satisfied (${stepQuantity} < ${minQuantity})`);
      return false;
    }
  }
  
  // Check bundle-level pricing conditions
  const pricing = bundleConfig.pricing;
  if (pricing && pricing.rules && pricing.rules.length > 0) {
    for (const rule of pricing.rules) {
      if (rule.discountOn === "quantity" && rule.minimumQuantity) {
        // Calculate total quantity for this bundle
        let totalQuantity = 0;
        for (const line of cartLines) {
          totalQuantity += line.quantity;
        }
        
        console.log(`🔍 [BUNDLE CONDITIONS] Pricing rule: need ${rule.minimumQuantity}, have ${totalQuantity}`);
        
        if (totalQuantity < rule.minimumQuantity) {
          console.log(`🔍 [BUNDLE CONDITIONS] Pricing rule not satisfied (${totalQuantity} < ${rule.minimumQuantity})`);
          return false;
        }
      } else if (rule.discountOn === "amount" && rule.minimumAmount) {
        // Calculate total amount for this bundle
        let totalAmount = 0;
        for (const line of cartLines) {
          totalAmount += parseFloat(line.cost?.totalAmount?.amount || 0);
        }
        
        console.log(`🔍 [BUNDLE CONDITIONS] Pricing rule: need $${rule.minimumAmount}, have $${totalAmount}`);
        
        if (totalAmount < rule.minimumAmount) {
          console.log(`🔍 [BUNDLE CONDITIONS] Pricing rule not satisfied ($${totalAmount} < $${rule.minimumAmount})`);
          return false;
        }
      }
    }
  }
  
  console.log("🔍 [BUNDLE CONDITIONS] All bundle conditions satisfied");
  return true;
}

// Create merge operation for bundle
function createMergeOperation(cartLines: any[], bundleConfig: any): any {
  const cartLinesForMerge = cartLines.map(line => ({
    cartLineId: line.id,
    quantity: line.quantity
  }));
  
  // Use bundleParentVariantId if available, otherwise create a synthetic parent ID
  const parentVariantId = bundleConfig.bundleParentVariantId || 
                         bundleConfig.parentVariantId ||
                         `gid://shopify/ProductVariant/bundle_${bundleConfig.id}`;
  
  const mergeOperation: any = {
    cartLines: cartLinesForMerge,
    parentVariantId: parentVariantId,
    title: bundleConfig.name,
    attributes: [
      { key: "_bundle_id", value: bundleConfig.id }
    ]
  };
  
  // Apply pricing if configured
  if (bundleConfig.pricing && bundleConfig.pricing.enableDiscount && bundleConfig.pricing.rules) {
    const rules = bundleConfig.pricing.rules || [];
    if (rules.length > 0) {
      const rule = rules[0];
      
      if (bundleConfig.pricing.discountMethod === 'percentage_off' && rule.percentageOff) {
        mergeOperation.price = {
          percentageDecrease: {
            value: parseFloat(rule.percentageOff) || 0
          }
        };
        console.log(`🔍 [MERGE OPERATION] Applied ${rule.percentageOff}% discount to ${bundleConfig.name}`);
      } else if (bundleConfig.pricing.discountMethod === 'fixed_amount_off' && rule.fixedAmountOff) {
        // For fixed amount discounts, we need to calculate the percentage based on original price
        let totalOriginalAmount = 0;
        for (const line of cartLines) {
          totalOriginalAmount += parseFloat(line.cost?.totalAmount?.amount || 0);
        }
        
        const discountPercentage = totalOriginalAmount > 0 ? (rule.fixedAmountOff / totalOriginalAmount) * 100 : 0;
        
        mergeOperation.price = {
          percentageDecrease: {
            value: Math.min(100, Math.max(0, discountPercentage)) // Ensure it's between 0-100%
          }
        };
        console.log(`🔍 [MERGE OPERATION] Applied $${rule.fixedAmountOff} discount (${discountPercentage.toFixed(2)}%) to ${bundleConfig.name}`);
      } else if (bundleConfig.pricing.discountMethod === 'fixed_bundle_price' && bundleConfig.pricing.fixedPrice) {
        // For fixed bundle price, calculate discount percentage from original total
        let totalOriginalAmount = 0;
        for (const line of cartLines) {
          totalOriginalAmount += parseFloat(line.cost?.totalAmount?.amount || 0);
        }
        
        const fixedPrice = parseFloat(bundleConfig.pricing.fixedPrice);
        const discountAmount = totalOriginalAmount - fixedPrice;
        const discountPercentage = totalOriginalAmount > 0 ? (discountAmount / totalOriginalAmount) * 100 : 0;
        
        mergeOperation.price = {
          percentageDecrease: {
            value: Math.min(100, Math.max(0, discountPercentage)) // Ensure it's between 0-100%
          }
        };
        console.log(`🔍 [MERGE OPERATION] Applied fixed price $${fixedPrice} (${discountPercentage.toFixed(2)}% discount) to ${bundleConfig.name}`);
      }
    }
  }
  
  console.log(`🔍 [MERGE OPERATION] Created merge operation: ${JSON.stringify(mergeOperation, null, 2)}`);
  return mergeOperation;
}

// Expand operations: Convert bundle products to individual components
function getExpandOperations(cartLines: any[]): CartTransformOperation[] {
  const operations: CartTransformOperation[] = [];

  for (const cartLine of cartLines) {
    const expandOperation = buildExpandOperation(cartLine);
    if (expandOperation) {
      operations.push({ expand: expandOperation });
    }
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Found ${operations.length} expand operations`);
  return operations;
}

function buildExpandOperation(cartLine: any) {
  const { id: cartLineId, merchandise } = cartLine;
  
  if (merchandise.__typename !== "ProductVariant") {
    return null;
  }

  // Check for null metafields (the current issue)
  if (!merchandise.component_reference?.value || !merchandise.component_quantities?.value) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Product ${merchandise.id} has null metafields - no expand needed`);
    return null;
  }

  const hasExpandMetafields = 
    !!merchandise.component_reference && !!merchandise.component_quantities;
    
  if (!hasExpandMetafields) {
    return null;
  }

  try {
    // Handle list.product_reference metafield - value should be JSON array string
    let componentReferences = [];
    if (merchandise.component_reference.value) {
      try {
        componentReferences = JSON.parse(merchandise.component_reference.value);
        // Ensure array format
        if (!Array.isArray(componentReferences)) {
          componentReferences = [componentReferences];
        }
      } catch {
        // If not JSON, treat as single value
        componentReferences = [merchandise.component_reference.value];
      }
    }

    // Handle list.number_integer metafield - value should be JSON array string
    let componentQuantities = [];
    if (merchandise.component_quantities.value) {
      try {
        componentQuantities = JSON.parse(merchandise.component_quantities.value);
        // Ensure array format and convert to numbers
        if (!Array.isArray(componentQuantities)) {
          componentQuantities = [parseInt(componentQuantities) || 1];
        } else {
          componentQuantities = componentQuantities.map(q => parseInt(q) || 1);
        }
      } catch {
        // If not JSON, treat as single numeric value
        componentQuantities = [parseInt(merchandise.component_quantities.value) || 1];
      }
    }

    console.log(`🔍 [CART TRANSFORM DEBUG] Expanding bundle variant ${merchandise.id}`);
    console.log(`🔍 [CART TRANSFORM DEBUG] Component references:`, componentReferences);
    console.log(`🔍 [CART TRANSFORM DEBUG] Component quantities:`, componentQuantities);

    if (
      componentReferences.length !== componentQuantities.length ||
      componentReferences.length === 0
    ) {
      console.error("🔍 [CART TRANSFORM DEBUG] Invalid bundle composition");
      return null;
    }

    const expandedCartItems = componentReferences.map(
      (merchandiseId: string, index: number) => ({
        merchandiseId,
        quantity: componentQuantities[index],
      })
    );

    if (expandedCartItems.length > 0) {
      const expandOperation: any = {
        cartLineId, 
        expandedCartItems,
        title: `${merchandise.title || 'Bundle'} (Components)`,
      };

      // Apply price adjustment if specified
      if (merchandise.price_adjustment) {
        try {
          // Handle number_decimal metafield: value should be a number
          let priceAdjustmentValue = merchandise.price_adjustment.value;
          
          // Convert to number if it's a string
          if (typeof priceAdjustmentValue === 'string') {
            priceAdjustmentValue = parseFloat(priceAdjustmentValue);
          }
          
          if (typeof priceAdjustmentValue === 'number' && !isNaN(priceAdjustmentValue) && priceAdjustmentValue > 0) {
            expandOperation.price = {
              percentageDecrease: {
                value: priceAdjustmentValue,
              },
            };
            console.log(`🔍 [CART TRANSFORM DEBUG] Applied ${priceAdjustmentValue}% discount to expand operation`);
          }
        } catch (error) {
          console.error("🔍 [CART TRANSFORM DEBUG] Error parsing expand price adjustment:", error);
        }
      }
      
      return expandOperation;
    }
  } catch (error) {
    console.error("🔍 [CART TRANSFORM DEBUG] Error parsing expand metafields:", error);
  }

  return null;
}

// Merge operations: Convert individual components to bundle products  
function getMergeOperations(cartLines: any[]): CartTransformOperation[] {
  const operations: CartTransformOperation[] = [];

  // Find all potential bundle parents (components that have component_parents metafield)
  const bundleParentDefinitions = getBundleParentDefinitions(cartLines);
  
  for (const parentDef of bundleParentDefinitions) {
    const mergeOperation = buildMergeOperation(cartLines, parentDef);
    if (mergeOperation) {
      operations.push({ merge: mergeOperation });
    }
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Found ${operations.length} merge operations`);
  return operations;
}

function getBundleParentDefinitions(cartLines: any[]) {
  const parentDefs: Map<string, any> = new Map();

  for (const cartLine of cartLines) {
    const { merchandise } = cartLine;
    
    if (merchandise.__typename !== "ProductVariant" || !merchandise.component_parents?.value) {
      console.log(`🔍 [CART TRANSFORM DEBUG] Product ${merchandise.id} has null component_parents metafield - skipping`);
      continue;
    }

    try {
      const componentParents = JSON.parse(merchandise.component_parents.value);
      
      // Each component can belong to multiple bundles
      for (const parent of componentParents) {
        const parentId = parent.id;
        if (!parentDefs.has(parentId)) {
          parentDefs.set(parentId, parent);
        }
      }
    } catch (error) {
      console.error("🔍 [CART TRANSFORM DEBUG] Error parsing component_parents:", error);
    }
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Found ${parentDefs.size} potential bundle parents`);
  return Array.from(parentDefs.values());
}

function buildMergeOperation(cartLines: any[], parentDef: any) {
  // Parse the official component_parents metafield structure
  if (!parentDef.component_reference?.value || !parentDef.component_quantities?.value) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${parentDef.id} missing component_reference or component_quantities`);
    return null;
  }

  const componentReferences = parentDef.component_reference.value;
  const componentQuantities = parentDef.component_quantities.value;

  if (componentReferences.length !== componentQuantities.length) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${parentDef.id} mismatched component arrays: ${componentReferences.length} references vs ${componentQuantities.length} quantities`);
    return null;
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Processing bundle ${parentDef.id} with ${componentReferences.length} components`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Component references:`, componentReferences);
  console.log(`🔍 [CART TRANSFORM DEBUG] Component quantities:`, componentQuantities);

  const componentsInCart = getComponentsInCart(cartLines, componentReferences, componentQuantities);
  
  if (componentsInCart.length !== componentReferences.length) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${parentDef.id} missing components: ${componentReferences.length} required, ${componentsInCart.length} found`);
    return null;
  }

  // Check if we have sufficient quantities
  const hasRequiredQuantities = componentsInCart.every((component, index) => {
    const requiredQuantity = componentQuantities[index];
    return component.totalQuantity >= requiredQuantity;
  });

  if (!hasRequiredQuantities) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Bundle ${parentDef.id} insufficient quantities`);
    return null;
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Creating merge operation for bundle ${parentDef.id}`);

  // Create cart lines for merge
  const cartLinesToMerge = componentsInCart.map((component, index) => ({
    cartLineId: component.cartLineId,
    quantity: componentQuantities[index], // Use the required quantity for the bundle
  }));

  const mergeOperation = {
    cartLines: cartLinesToMerge,
    parentVariantId: parentDef.id, // Use parentDef.id as the bundle parent variant ID
    title: `Bundle ${parentDef.id}`,
    attributes: [
      {
        key: "_bundle_id",
        value: parentDef.id,
      },
    ],
  };

  // Apply price adjustment if specified (official Shopify format)
  if (parentDef.price_adjustment?.value) {
    try {
      // Handle number_decimal metafield: value should be a number
      let priceAdjustmentValue = parentDef.price_adjustment.value;
      
      // Convert to number if it's a string
      if (typeof priceAdjustmentValue === 'string') {
        priceAdjustmentValue = parseFloat(priceAdjustmentValue);
      }
      
      if (typeof priceAdjustmentValue === 'number' && priceAdjustmentValue > 0) {
        mergeOperation.price = {
          percentageDecrease: {
            value: priceAdjustmentValue,
          },
        };
        console.log(`🔍 [CART TRANSFORM DEBUG] Applied ${priceAdjustmentValue}% discount to bundle ${parentDef.id}`);
      }
    } catch (error) {
      console.error("🔍 [CART TRANSFORM DEBUG] Error parsing price adjustment:", error);
    }
  }

  return mergeOperation;
}

function getComponentsInCart(cartLines: any[], componentReferences: string[], componentQuantities: number[]) {
  const componentsInCart = [];

  // Process each component reference with its corresponding quantity
  for (let i = 0; i < componentReferences.length; i++) {
    const requiredVariantId = componentReferences[i];
    const requiredQuantity = componentQuantities[i];
    let totalQuantity = 0;
    let cartLineId = null;

    // Find matching cart lines for this component
    for (const cartLine of cartLines) {
      const { merchandise } = cartLine;
      if (merchandise.__typename === "ProductVariant" && merchandise.id === requiredVariantId) {
        totalQuantity += cartLine.quantity;
        cartLineId = cartLine.id; // Use the last matching cart line ID
      }
    }

    if (totalQuantity > 0) {
      componentsInCart.push({
        merchandiseId: requiredVariantId,
        totalQuantity,
        requiredQuantity,
        cartLineId,
      });
      
      console.log(`🔍 [CART TRANSFORM DEBUG] Found component ${requiredVariantId}: ${totalQuantity} in cart, ${requiredQuantity} required`);
    } else {
      console.log(`🔍 [CART TRANSFORM DEBUG] Missing component ${requiredVariantId} (required: ${requiredQuantity})`);
    }
  }

  return componentsInCart;
}

// Create a merge operation for bundle products + component products
function createMergeOperationForBundle(bundleProductLine: any, componentLines: any[], bundleConfig: any): any {
  console.log(`🔍 [MERGE OPERATION] Creating merge operation for bundle: ${bundleConfig.name}`);
  console.log(`🔍 [MERGE OPERATION] Bundle product line: ${bundleProductLine.id}`);
  console.log(`🔍 [MERGE OPERATION] Component lines: ${componentLines.map((line: any) => line.id).join(', ')}`);

  // Create the merge operation structure
  const mergeOperation = {
    parentVariantId: bundleProductLine.merchandise.id,
    cartLines: [
      // Include the bundle product itself
      {
        cartLineId: bundleProductLine.id,
        quantity: bundleProductLine.quantity,
      },
      // Include all component product lines
      ...componentLines.map((line: any) => ({
        cartLineId: line.id,
        quantity: line.quantity,
      })),
    ],
    title: `${bundleConfig.name} Bundle`,
    attributes: [
      {
        key: "Bundle",
        value: bundleConfig.name,
      },
      {
        key: "Bundle ID",
        value: bundleConfig.bundleId || bundleConfig.id,
      },
    ],
  };

  // Apply discount if configured
  const pricing = bundleConfig.pricing;
  if (pricing?.enabled && pricing.rules && pricing.rules.length > 0) {
    const rule = pricing.rules[0];
    if (pricing.method === "percentage_off" && rule.discountValue) {
      mergeOperation.price = {
        percentageDecrease: {
          value: parseFloat(rule.discountValue),
        },
      };
      console.log(`🔍 [MERGE OPERATION] Applied ${rule.discountValue}% discount to bundle`);
    }
  }

  console.log(`🔍 [MERGE OPERATION] Created merge operation:`, JSON.stringify(mergeOperation, null, 2));

  return mergeOperation;
}

// ENHANCED: Calculate bundle pricing for container product merge operations
function calculateBundlePrice(bundleConfig: any, componentLines: any[]): any {
  console.log(`🔍 [BUNDLE PRICING] Calculating price for bundle: ${bundleConfig.name}`);
  console.log(`🔍 [BUNDLE PRICING] Component lines:`, componentLines.length);

  // Check if bundle has pricing configuration
  const pricing = bundleConfig.pricing;
  if (!pricing || !pricing.enabled) {
    console.log(`🔍 [BUNDLE PRICING] No pricing configuration found - using component sum`);
    return null; // No discount, use sum of component prices
  }

  // Check if there are pricing rules
  const rules = pricing.rules || [];
  if (rules.length === 0) {
    console.log(`🔍 [BUNDLE PRICING] No pricing rules found`);
    return null;
  }

  // Find the first applicable rule (enhanced logic can be added for multiple rules)
  const rule = rules[0];

  // Calculate total component quantity
  const totalQuantity = componentLines.reduce((sum: number, line: any) => sum + line.quantity, 0);

  // Calculate total component price
  const totalComponentPrice = componentLines.reduce((sum: number, line: any) => {
    const amount = parseFloat(line.cost?.totalAmount?.amount || '0');
    return sum + amount;
  }, 0);

  console.log(`🔍 [BUNDLE PRICING] Total quantity: ${totalQuantity}, Total price: ${totalComponentPrice}`);
  console.log(`🔍 [BUNDLE PRICING] Rule method: ${pricing.method}, Rule value: ${rule.discountValue}`);

  // Apply pricing based on method
  switch (pricing.method) {
    case 'percentage_off': {
      const discountPercent = parseFloat(rule.discountValue || '0');
      if (discountPercent > 0) {
        console.log(`🔍 [BUNDLE PRICING] Applying ${discountPercent}% discount`);
        return {
          percentageDecrease: {
            value: discountPercent
          }
        };
      }
      break;
    }

    case 'fixed_amount_off': {
      const discountAmount = parseFloat(rule.discountValue || '0');
      if (discountAmount > 0) {
        console.log(`🔍 [BUNDLE PRICING] Applying ${discountAmount} fixed discount`);
        return {
          percentageDecrease: {
            value: (discountAmount / totalComponentPrice) * 100
          }
        };
      }
      break;
    }

    case 'fixed_bundle_price': {
      // Fixed bundle price: Calculate discount based on ACTUAL component total
      const fixedBundlePrice = parseFloat(rule.fixedBundlePrice || rule.price || '0');

      if (fixedBundlePrice > 0 && totalComponentPrice > fixedBundlePrice) {
        const discountAmount = totalComponentPrice - fixedBundlePrice;
        const discountPercent = (discountAmount / totalComponentPrice) * 100;

        console.log(`🔍 [BUNDLE PRICING] Fixed bundle price: ₹${fixedBundlePrice}, Component total: ₹${totalComponentPrice}, Discount: ${discountPercent.toFixed(2)}%`);

        return {
          percentageDecrease: {
            value: Math.min(100, Math.round(discountPercent * 100) / 100)
          }
        };
      }
      break;
    }

    default: {
      console.log(`🔍 [BUNDLE PRICING] Unknown pricing method: ${pricing.method}`);
      break;
    }
  }

  console.log(`🔍 [BUNDLE PRICING] No applicable pricing found - using component sum`);
  return null; // No discount applied
}


