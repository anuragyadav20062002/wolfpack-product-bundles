import { CartTransformLogger as Logger } from './cart-transform-logger';

export interface DiscountRule {
  discountOn: string;
  numberOfProducts?: number; // Cart transform bundles legacy field
  minimumQuantity: number; // Minimum quantity required for this discount rule
  fixedAmountOff: number;
  percentageOff: number;
}

export interface BundleProduct {
  id: string;
  title: string;
  variants?: Array<{ id: string; title: string; price?: string }>;
}

export interface BundleStep {
  id: string;
  name: string;
  products: BundleProduct[];
  collections: Array<{ id: string; title: string }>;
  minQuantity: number;
  maxQuantity: number;
  conditionType?: string;
  conditionValue?: number;
  enabled?: boolean;
}

export interface BundleData {
  id: string;
  name: string;
  allBundleProductIds: string[]; 
  componentReferences?: string[]; // Shopify standard component variant IDs
  componentQuantities?: number[]; // Corresponding quantities for each component
  bundleParentVariantId?: string; // The parent bundle product variant ID
  pricing: {
    enableDiscount: boolean;
    discountMethod: string;
    rules: DiscountRule[];
    fixedPrice?: number; 
    bundleVariantId?: string;
  } | null;
}

export interface BundleMatchResult {
  bundle: BundleData;
  matchingLines: any[];
  bundleParentLine?: any; // The bundle parent product line (if exists)
  componentLines: any[]; // Individual component lines to be merged
  totalBundleQuantity: number;
  meetsConditions: boolean;
  totalOriginalCost: number;
  totalDiscountedCost: number;
}

/**
 * Utility function to normalize product ID formats for consistent matching
 * Handles both full GIDs and extracted IDs
 */
export function normalizeProductId(id: string): string {
  if (!id) return '';
  
  // If it's already a GID, return as-is
  if (id.startsWith('gid://shopify/Product/')) {
    return id;
  }
  
  // If it's just a number or simple string, assume it's a product ID and create GID
  if (/^\d+$/.test(id)) {
    return `gid://shopify/Product/${id}`;
  }
  
  // Handle test product IDs (like "product1", "product2") - convert to GID for consistency
  if (/^product\d+$/.test(id)) {
    const testId = id.replace('product', '');
    return `gid://shopify/Product/${testId}`;
  }
  
  // For other formats, try to extract if it contains the pattern
  const gidMatch = id.match(/gid:\/\/shopify\/Product\/(\d+)/);
  if (gidMatch) {
    return `gid://shopify/Product/${gidMatch[1]}`;
  }
  
  // For non-numeric IDs that might be valid product identifiers, create a test GID
  if (/^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0) {
    return `gid://shopify/Product/${id}`;
  }
  
  // If all else fails, return the original ID
  Logger.warn('Could not normalize product ID', { phase: 'normalization' }, { id });
  return id;
}

/**
 * Extract product ID from variant GID for product matching
 */
export function extractProductIdFromVariantGid(variantGid: string): string {
  // First check if this is actually a product GID (not variant)
  if (variantGid.includes('gid://shopify/Product/')) {
    return variantGid; // It's already a product GID
  }
  
  // For variant GIDs, we need to look up the product via the cart data
  Logger.warn('Cannot extract product ID from variant GID without product data', 
    { phase: 'id-extraction' }, { variantGid });
  return variantGid;
}

/**
 * Enhanced bundle detection following Shopify's best practices for cart transforms
 */
export function getAllBundleDataFromCart(cart: any, shop: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  Logger.info('Starting bundle detection', { phase: 'detection' }, { 
    cartLines: cart.lines.length 
  });

  // Method 1: Look for Bundle Parent Products with component metafields (Shopify standard approach)
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];

    if (line.merchandise.__typename === "ProductVariant" && line.merchandise.product) {
      
      // Check if this variant has bundle component metafields (indicating it's a bundle parent)
      if (line.merchandise.componentReference?.value || line.merchandise.bundleConfig?.value) {
        Logger.debug('Found potential bundle parent variant', { phase: 'detection' }, { 
          variantId: line.merchandise.id 
        });
        
        let bundleData: BundleData | null = null;
        
        // Try to parse from our custom bundle config first
        if (line.merchandise.bundleConfig?.value) {
          bundleData = parseBundleDataFromMetafield(line.merchandise.bundleConfig.value);
          if (bundleData) {
            bundleData.bundleParentVariantId = line.merchandise.id;
            Logger.debug('Parsed bundle from bundleConfig', { phase: 'detection' }, { 
              bundleName: bundleData.name 
            });
          }
        }
        
        // If no custom config, try to create from standard Shopify component metafields
        if (!bundleData && line.merchandise.componentReference?.value) {
          bundleData = parseBundleFromComponentMetafields(line.merchandise, line.merchandise.product);
          Logger.debug('Parsed bundle from component metafields', { phase: 'detection' }, { 
            bundleName: bundleData?.name 
          });
        }
        
        if (bundleData && !processedBundles.has(bundleData.id)) {
          bundles.push(bundleData);
          processedBundles.add(bundleData.id);
          Logger.info('Added bundle parent', { phase: 'detection', bundleId: bundleData.id });
        }
      }
      
      // Method 2: Check if this is a Bundle Product with our legacy metafields
      else if (line.merchandise.product.metafield?.value) {
        const bundleData = parseBundleDataFromMetafield(line.merchandise.product.metafield.value);
        
        if (bundleData && !processedBundles.has(bundleData.id)) {
          bundles.push(bundleData);
          processedBundles.add(bundleData.id);
          Logger.info('Added legacy bundle product', { phase: 'detection', bundleId: bundleData.id });
        }
      }
      
      // Method 3: Check if this line has bundle ID attributes (for widget-added components)
      else if (line.attribute && line.attribute.key === '_wolfpack_bundle_id' && line.attribute.value) {
        const bundleId = line.attribute.value;
        Logger.debug('Found component with bundle ID', { phase: 'detection', bundleId });
        
        if (!processedBundles.has(bundleId)) {
          // Look up bundle data from shop metafields
          const bundleData = getBundleDataFromShopMetafields(bundleId, shop);
          if (bundleData) {
            bundles.push(bundleData);
            processedBundles.add(bundleId);
            Logger.info('Added bundle from shop metafields', { phase: 'detection', bundleId });
          }
        }
      }
    }
  }

  Logger.summary('Bundle detection completed', bundles, { phase: 'detection' });
  return bundles;
}

/**
 * Enhanced bundle condition checking with proper merge/expand logic
 */
export function checkCartMeetsBundleConditions(
  cart: any,
  bundleData: BundleData,
): BundleMatchResult {
  const result: BundleMatchResult = {
    bundle: bundleData,
    matchingLines: [],
    bundleParentLine: null,
    componentLines: [],
    totalBundleQuantity: 0,
    meetsConditions: false,
    totalOriginalCost: 0,
    totalDiscountedCost: 0,
  };

  const context = { phase: 'condition-check', bundleId: bundleData.id };
  Logger.debug('Checking bundle conditions', context);
  
  // Strategy 1: If we have a bundle parent variant in cart, look for it and its components
  if (bundleData.bundleParentVariantId) {
    Logger.debug('Looking for bundle parent variant', context, { 
      bundleParentVariantId: bundleData.bundleParentVariantId 
    });
    
    // Find the bundle parent line
    const bundleParentLine = cart.lines.find((line: any) => 
      line.merchandise?.id === bundleData.bundleParentVariantId
    );
    
    if (bundleParentLine) {
      Logger.info('Found bundle parent line', context, { cartLineId: bundleParentLine.id });
      result.bundleParentLine = bundleParentLine;
      
      // For bundle parent products, we should EXPAND them into components
      result.matchingLines = [bundleParentLine];
      result.totalBundleQuantity = bundleParentLine.quantity;
      result.totalOriginalCost = parseFloat(bundleParentLine.cost.totalAmount.amount);
      result.meetsConditions = true; // Bundle parent always meets conditions
      
      return result;
    }
  }
  
  // Strategy 2: Look for individual components to merge into a bundle
  const componentLines: any[] = [];
  let totalQuantity = 0;
  let totalOriginalCost = 0;
  
  // Populate allBundleProductIds during matching if not already populated
  const bundleProductIds = new Set<string>();

  for (const line of cart.lines) {
    let isComponentLine = false;
    
    Logger.debug('Checking cart line for bundle components', context, { 
      cartLineId: line.id,
      hasAttribute: !!line.attribute,
      productId: line.merchandise?.product?.id
    });
    
    // Match by product ID (for Bundle Product pages or component matching)
    const productId = line.merchandise?.product?.id;
    if (productId) {
      const normalizedProductId = normalizeProductId(productId);
      
      // Check if this product is in our bundle configuration
      const isInBundleConfig = bundleData.allBundleProductIds.some(configProductId => 
        normalizeProductId(configProductId) === normalizedProductId
      );
      
      if (isInBundleConfig) {
        isComponentLine = true;
        bundleProductIds.add(normalizedProductId);
        Logger.debug('Found component by product ID', context, { 
          cartLineId: line.id, 
          productId: normalizedProductId 
        });
      } else {
        // Also check if this line's product corresponds to any of our component references
        if (bundleData.componentReferences && bundleData.componentReferences.includes(line.merchandise?.id)) {
          isComponentLine = true;
          bundleProductIds.add(normalizedProductId);
          Logger.debug('Found component by variant reference', context, { 
            cartLineId: line.id, 
            variantId: line.merchandise?.id,
            productId: normalizedProductId 
          });
        }
      }
    }
    
    // Match by bundle ID attribute (for widget-added products)
    if (!isComponentLine && line.attribute && line.attribute.value === bundleData.id) {
      isComponentLine = true;
      if (productId) {
        bundleProductIds.add(normalizeProductId(productId));
      }
      Logger.debug('Found component by attribute', context, { 
        cartLineId: line.id 
      });
    }
    
    if (isComponentLine) {
      componentLines.push(line);
      totalQuantity += line.quantity;
      totalOriginalCost += parseFloat(line.cost.totalAmount.amount);
    }
  }
  
  // Update bundle data with discovered product IDs if it was empty
  if (bundleData.allBundleProductIds.length === 0 && bundleProductIds.size > 0) {
    bundleData.allBundleProductIds = Array.from(bundleProductIds);
    Logger.debug('Populated bundle product IDs', context, { 
      productIds: bundleData.allBundleProductIds 
    });
  }

  // Check if bundle conditions are met (minimum quantity from pricing rules or default to 2)
  const firstRule = bundleData.pricing?.rules?.[0];
  const minimumQuantity = firstRule ? (firstRule.minimumQuantity || firstRule.numberOfProducts || 2) : 2;
  const meetsConditions = totalQuantity >= minimumQuantity && componentLines.length >= 2;

  // Calculate discounted cost if conditions are met
  let totalDiscountedCost = totalOriginalCost;

  if (meetsConditions && bundleData.pricing?.enabled) {
    const applicableRule = getApplicableDiscountRule(bundleData, totalQuantity);

    if (applicableRule) {
      if (bundleData.pricing.method === "fixed_amount_off") {
        totalDiscountedCost = Math.max(0, totalOriginalCost - applicableRule.fixedAmountOff);
        Logger.debug('Applied fixed amount discount', context, {
          original: totalOriginalCost,
          discount: applicableRule.fixedAmountOff,
          final: totalDiscountedCost
        });
      } else if (bundleData.pricing.method === "percentage_off") {
        totalDiscountedCost = totalOriginalCost * (1 - applicableRule.percentageOff / 100);
        Logger.debug('Applied percentage discount', context, {
          original: totalOriginalCost,
          percentage: applicableRule.percentageOff,
          final: totalDiscountedCost
        });
      } else if (bundleData.pricing.method === "fixed_bundle_price" && bundleData.pricing.fixedPrice && bundleData.pricing.fixedPrice > 0) {
        totalDiscountedCost = bundleData.pricing.fixedPrice;
        Logger.debug('Applied fixed bundle price', context, {
          fixedPrice: totalDiscountedCost
        });
      }
    }
  }

  result.matchingLines = componentLines;
  result.componentLines = componentLines;
  result.totalBundleQuantity = totalQuantity;
  result.meetsConditions = meetsConditions;
  result.totalOriginalCost = totalOriginalCost;
  result.totalDiscountedCost = totalDiscountedCost;

  Logger.info('Bundle condition check completed', context, {
    meetsConditions,
    componentCount: componentLines.length,
    totalQuantity,
    minimumQuantity,
    totalCost: totalOriginalCost
  });

  return result;
}

function parseBundleFromComponentMetafields(variant: any, product: any): BundleData | null {
  const context = { phase: 'parsing' };
  
  try {
    const componentReferences = JSON.parse(variant.componentReference.value || '[]');
    const componentQuantities = JSON.parse(variant.componentQuantities.value || '[]');
    
    if (!Array.isArray(componentReferences) || componentReferences.length === 0) {
      return null;
    }
    
    const allBundleProductIds: string[] = [];
    
    Logger.debug('Parsing standard bundle', context, { 
      componentCount: componentReferences.length 
    });
    
    // Create bundle data from component metafields
    const bundleData: BundleData = {
      id: variant.id, // Use variant ID as bundle ID for standard bundles
      name: product.title || `Bundle ${variant.id}`,
      allBundleProductIds: allBundleProductIds, // Will be populated during matching
      componentReferences: componentReferences, // Store the full component variant GIDs
      componentQuantities: componentQuantities,
      bundleParentVariantId: variant.id,
      pricing: {
        enableDiscount: true, // Enable discount for proper bundle parents
        discountMethod: "percentage_off",
        rules: [{
          discountOn: "total",
          minimumQuantity: Math.max(2, componentQuantities.reduce((sum: number, qty: number) => sum + qty, 0)),
          numberOfProducts: Math.max(2, componentQuantities.reduce((sum: number, qty: number) => sum + qty, 0)),
          fixedAmountOff: 0,
          percentageOff: 10 // Default 10% bundle discount
        }],
        bundleVariantId: variant.id
      }
    };
    
    return bundleData;
  } catch (error) {
    Logger.error('Error parsing bundle from component metafields', context, error);
    return null;
  }
}

function getBundleDataFromShopMetafields(bundleId: string, shop: any): BundleData | null {
  const context = { phase: 'shop-metafield-parsing', bundleId };
  
  let shopBundlesData = null;
  if (shop?.metafield?.value) {
    try {
      shopBundlesData = JSON.parse(shop.metafield.value);
    } catch (error) {
      Logger.error('Failed to parse shop bundles data', context, error);
      return null;
    }
  }
  
  if (shopBundlesData && shopBundlesData[bundleId]) {
    const shopBundle = shopBundlesData[bundleId];
    return {
      id: bundleId,
      name: shopBundle.name || `Bundle ${bundleId}`,
      allBundleProductIds: [], // Will be populated during matching
      pricing: shopBundle.pricing || {
        enableDiscount: false,
        discountMethod: "percentage_off",
        rules: [{
          discountOn: "total",
          numberOfProducts: 2,
          fixedAmountOff: 0,
          percentageOff: 0
        }]
      }
    };
  }
  
  return null;
}

export function parseBundleDataFromMetafield(metafieldValue: string): BundleData | null {
  const context = { phase: 'metafield-parsing' };
  
  try {
    const bundleData = JSON.parse(metafieldValue) as BundleData;
    
    // Normalize all product IDs to ensure consistent GID format
    if (bundleData.allBundleProductIds && Array.isArray(bundleData.allBundleProductIds)) {
      bundleData.allBundleProductIds = bundleData.allBundleProductIds.map(id => normalizeProductId(id));
      Logger.debug('Normalized bundle product IDs', context, { 
        productIds: bundleData.allBundleProductIds 
      });
    }
    
    return bundleData;
  } catch (error) {
    Logger.error('Error parsing bundle data from metafield', context, error);
    return null;
  }
}

export function getApplicableDiscountRule(
  bundleData: BundleData,
  totalQuantity: number,
): DiscountRule | null {
  if (!bundleData.pricing?.rules || bundleData.pricing.rules.length === 0) {
    return null;
  }

  // Sort rules by minimumQuantity descending to get the best applicable discount
  const applicableRules = bundleData.pricing.rules
    .filter((rule) => totalQuantity >= (rule.minimumQuantity || rule.numberOfProducts || 0))
    .sort((a, b) => (b.minimumQuantity || b.numberOfProducts || 0) - (a.minimumQuantity || a.numberOfProducts || 0));

  return applicableRules.length > 0 ? applicableRules[0] : null;
}