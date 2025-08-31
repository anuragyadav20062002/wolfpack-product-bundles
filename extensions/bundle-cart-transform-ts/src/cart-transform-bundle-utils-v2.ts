export interface DiscountRule {
  discountOn: string;
  numberOfProducts: number; // Cart transform bundles ONLY use this field
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
 * Enhanced bundle detection following Shopify's best practices for cart transforms
 */
export function getAllBundleDataFromCart(cart: any, shop: any): BundleData[] {
  const bundles: BundleData[] = [];
  const processedBundles = new Set<string>();

  console.log("🔍 [CART TRANSFORM DEBUG] Starting enhanced bundle detection in cart with", cart.lines.length, "lines");

  // Method 1: Look for Bundle Parent Products with component metafields (Shopify standard approach)
  for (let i = 0; i < cart.lines.length; i++) {
    const line = cart.lines[i];

    if (line.merchandise.__typename === "ProductVariant" && line.merchandise.product) {
      
      // Check if this variant has bundle component metafields (indicating it's a bundle parent)
      if (line.merchandise.componentReference?.value || line.merchandise.bundleConfig?.value) {
        console.log(`🔍 [CART TRANSFORM DEBUG] Found potential bundle parent variant:`, line.merchandise.id);
        
        let bundleData: BundleData | null = null;
        
        // Try to parse from our custom bundle config first
        if (line.merchandise.bundleConfig?.value) {
          bundleData = parseBundleDataFromMetafield(line.merchandise.bundleConfig.value);
          if (bundleData) {
            bundleData.bundleParentVariantId = line.merchandise.id;
            console.log(`🔍 [CART TRANSFORM DEBUG] Parsed bundle from bundleConfig:`, bundleData.name);
          }
        }
        
        // If no custom config, try to create from standard Shopify component metafields
        if (!bundleData && line.merchandise.componentReference?.value) {
          bundleData = parseBundleFromComponentMetafields(line.merchandise, line.merchandise.product);
          console.log(`🔍 [CART TRANSFORM DEBUG] Parsed bundle from component metafields:`, bundleData?.name);
        }
        
        if (bundleData && !processedBundles.has(bundleData.id)) {
          bundles.push(bundleData);
          processedBundles.add(bundleData.id);
          console.log(`🔍 [CART TRANSFORM DEBUG] Added bundle parent:`, bundleData.name);
        }
      }
      
      // Method 2: Check if this is a Bundle Product with our legacy metafields
      else if (line.merchandise.product.metafield?.value) {
        const bundleData = parseBundleDataFromMetafield(line.merchandise.product.metafield.value);
        
        if (bundleData && !processedBundles.has(bundleData.id)) {
          // Only set bundleParentVariantId if this is actually a bundle parent product
          // Don't set it for individual components that share the same bundle configuration
          // bundleData.bundleParentVariantId = line.merchandise.id;
          bundles.push(bundleData);
          processedBundles.add(bundleData.id);
          console.log(`🔍 [CART TRANSFORM DEBUG] Added legacy bundle product:`, bundleData.name);
        }
      }
      
      // Method 3: Check if this line has bundle ID attributes (for widget-added components)
      else if (line.attribute && line.attribute.key === '_wolfpack_bundle_id' && line.attribute.value) {
        const bundleId = line.attribute.value;
        console.log(`🔍 [CART TRANSFORM DEBUG] Found component with bundle ID: ${bundleId}`);
        
        if (!processedBundles.has(bundleId)) {
          // Look up bundle data from shop metafields
          const bundleData = getBundleDataFromShopMetafields(bundleId, shop);
          if (bundleData) {
            bundles.push(bundleData);
            processedBundles.add(bundleId);
            console.log(`🔍 [CART TRANSFORM DEBUG] Added bundle from shop metafields:`, bundleData.name);
          }
        }
      }
    }
  }

  console.log(`🔍 [CART TRANSFORM DEBUG] Bundle detection completed. Found ${bundles.length} bundles:`, bundles.map(b => b.name));
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

  console.log(`🔍 [CART TRANSFORM DEBUG] Checking bundle conditions for: ${bundleData.name}`);
  
  // Strategy 1: If we have a bundle parent variant in cart, look for it and its components
  if (bundleData.bundleParentVariantId) {
    console.log(`🔍 [CART TRANSFORM DEBUG] Looking for bundle parent variant: ${bundleData.bundleParentVariantId}`);
    
    // Find the bundle parent line
    const bundleParentLine = cart.lines.find((line: any) => 
      line.merchandise?.id === bundleData.bundleParentVariantId
    );
    
    if (bundleParentLine) {
      console.log(`🔍 [CART TRANSFORM DEBUG] Found bundle parent line:`, bundleParentLine.id);
      result.bundleParentLine = bundleParentLine;
      
      // For bundle parent products, we should EXPAND them into components
      // This is the opposite of merging individual components
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

  for (const line of cart.lines) {
    let isComponentLine = false;
    
    console.log(`🔍 [CART TRANSFORM DEBUG] Checking line: ${line.id}`);
    console.log(`🔍 [CART TRANSFORM DEBUG] Line attribute:`, line.attribute);
    console.log(`🔍 [CART TRANSFORM DEBUG] Line product ID:`, line.merchandise?.product?.id);
    
    // Match by product ID (for Bundle Product pages or component matching)
    const productId = line.merchandise?.product?.id;
    if (productId && bundleData.allBundleProductIds.includes(productId)) {
      isComponentLine = true;
      console.log(`🔍 [CART TRANSFORM DEBUG] Found component by product ID: line=${line.id}, product=${productId}`);
    }
    
    // Match by bundle ID attribute (for widget-added products)
    if (line.attribute && line.attribute.value === bundleData.id) {
      isComponentLine = true;
      console.log(`🔍 [CART TRANSFORM DEBUG] Found component by attribute: line=${line.id}, bundle=${bundleData.id}`);
    }
    
    // Match by component reference (if available)
    if (bundleData.componentReferences && bundleData.componentReferences.includes(line.merchandise?.id)) {
      isComponentLine = true;
      console.log(`🔍 [CART TRANSFORM DEBUG] Found component by reference: line=${line.id}, variant=${line.merchandise?.id}`);
    }
    
    if (isComponentLine) {
      componentLines.push(line);
      totalQuantity += line.quantity;
      totalOriginalCost += parseFloat(line.cost.totalAmount.amount);
    }
  }

  // Check if bundle conditions are met (minimum quantity from pricing rules or default to 2)
  // Cart transform bundles ONLY use numberOfProducts field
  const firstRule = bundleData.pricing?.rules?.[0];
  const numberOfProducts = firstRule ? (firstRule.numberOfProducts || 2) : 2;
  const meetsConditions = totalQuantity >= numberOfProducts && componentLines.length >= 2;

  // Calculate discounted cost if conditions are met
  let totalDiscountedCost = totalOriginalCost;
  
  if (meetsConditions && bundleData.pricing?.enableDiscount) {
    const applicableRule = getApplicableDiscountRule(bundleData, totalQuantity);
    
    if (applicableRule) {
      if (bundleData.pricing.discountMethod === "fixed_amount_off") {
        totalDiscountedCost = Math.max(0, totalOriginalCost - applicableRule.fixedAmountOff);
        console.log(`🔍 [CART TRANSFORM DEBUG] Fixed amount discount: ${totalOriginalCost} - ${applicableRule.fixedAmountOff} = ${totalDiscountedCost}`);
      } else if (bundleData.pricing.discountMethod === "percentage_off") {
        totalDiscountedCost = totalOriginalCost * (1 - applicableRule.percentageOff / 100);
        console.log(`🔍 [CART TRANSFORM DEBUG] Percentage discount: ${totalOriginalCost} * (1 - ${applicableRule.percentageOff}/100) = ${totalDiscountedCost}`);
      } else if (bundleData.pricing.discountMethod === "fixed_bundle_price" && bundleData.pricing.fixedPrice > 0) {
        totalDiscountedCost = bundleData.pricing.fixedPrice;
        console.log(`🔍 [CART TRANSFORM DEBUG] Fixed bundle price: ${totalDiscountedCost}`);
      }
    }
  }

  result.matchingLines = componentLines;
  result.componentLines = componentLines;
  result.totalBundleQuantity = totalQuantity;
  result.meetsConditions = meetsConditions;
  result.totalOriginalCost = totalOriginalCost;
  result.totalDiscountedCost = totalDiscountedCost;

  console.log(`🔍 [CART TRANSFORM DEBUG] Bundle condition check result:`, {
    meetsConditions,
    componentCount: componentLines.length,
    totalQuantity,
    numberOfProducts,
    totalCost: totalOriginalCost
  });

  return result;
}

function parseBundleFromComponentMetafields(variant: any, product: any): BundleData | null {
  try {
    const componentReferences = JSON.parse(variant.componentReference.value || '[]');
    const componentQuantities = JSON.parse(variant.componentQuantities.value || '[]');
    
    if (!Array.isArray(componentReferences) || componentReferences.length === 0) {
      return null;
    }
    
    // Create bundle data from component metafields
    const bundleData: BundleData = {
      id: variant.id, // Use variant ID as bundle ID for standard bundles
      name: product.title || `Bundle ${variant.id}`,
      allBundleProductIds: componentReferences.map(ref => ref.split('/').pop()), // Extract product IDs from GIDs
      componentReferences: componentReferences, // Store the full component variant GIDs
      componentQuantities: componentQuantities,
      bundleParentVariantId: variant.id,
      pricing: {
        enableDiscount: true, // Enable discount for proper bundle parents
        discountMethod: "percentage_off",
        rules: [{
          discountOn: "total",
          numberOfProducts: Math.max(2, componentQuantities.reduce((sum: number, qty: number) => sum + qty, 0)),
          fixedAmountOff: 0,
          percentageOff: 10 // Default 10% bundle discount
        }],
        bundleVariantId: variant.id
      }
    };
    
    return bundleData;
  } catch (error) {
    console.error("🔍 [CART TRANSFORM DEBUG] Error parsing bundle from component metafields:", error);
    return null;
  }
}

function getBundleDataFromShopMetafields(bundleId: string, shop: any): BundleData | null {
  let shopBundlesData = null;
  if (shop?.metafield?.value) {
    try {
      shopBundlesData = JSON.parse(shop.metafield.value);
    } catch (error) {
      console.error("🔍 [CART TRANSFORM DEBUG] Failed to parse shop bundles data:", error);
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

export function parseBundleDataFromMetafield(
  metafieldValue: string,
): BundleData | null {
  try {
    return JSON.parse(metafieldValue);
  } catch (error) {
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

  // Sort rules by numberOfProducts descending to get the best applicable discount
  // Cart transform bundles use numberOfProducts field (NOT minimumQuantity)
  const applicableRules = bundleData.pricing.rules
    .filter((rule) => totalQuantity >= (rule.numberOfProducts || 0))
    .sort((a, b) => (b.numberOfProducts || 0) - (a.numberOfProducts || 0));

  return applicableRules.length > 0 ? applicableRules[0] : null;
}