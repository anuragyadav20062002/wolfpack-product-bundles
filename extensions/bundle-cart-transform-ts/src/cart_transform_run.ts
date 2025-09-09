// Define types for cart transform function following Shopify standard
export interface CartTransformInput {
  cart: {
    lines: Array<{
      id: string;
      quantity: number;
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
    cost: {
      totalAmount: {
        amount: string;
        currencyCode: string;
      };
      subtotalAmount: {
        amount: string;
        currencyCode: string;
      };
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

  const operations = [];

  // Process expand operations first (bundle products → individual components)
  const expandOperations = getExpandOperations(input.cart.lines);
  operations.push(...expandOperations);

  // Process merge operations (individual components → bundle products)
  const mergeOperations = getMergeOperations(input.cart.lines);
  operations.push(...mergeOperations);

  console.log(`🔍 [CART TRANSFORM DEBUG] Cart Transform completed with ${operations.length} operations`);
  console.log(`🔍 [CART TRANSFORM DEBUG] Operations:`, JSON.stringify(operations, null, 2));

  return {
    operations,
  };
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

  const hasExpandMetafields = 
    !!merchandise.component_reference && !!merchandise.component_quantities;
    
  if (!hasExpandMetafields) {
    return null;
  }

  try {
    const componentReferences = JSON.parse(merchandise.component_reference.value);
    const componentQuantities = JSON.parse(merchandise.component_quantities.value);

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
          const priceAdjustmentValue = typeof merchandise.price_adjustment.value === 'string' 
            ? parseFloat(merchandise.price_adjustment.value) 
            : merchandise.price_adjustment.value;
          
          if (typeof priceAdjustmentValue === 'number' && !isNaN(priceAdjustmentValue)) {
            expandOperation.price = {
              percentageDecrease: {
                value: priceAdjustmentValue,
              },
            };
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
    
    if (merchandise.__typename !== "ProductVariant" || !merchandise.component_parents) {
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

  // Apply price adjustment if specified
  if (parentDef.price_adjustment) {
    try {
      const priceAdjustmentValue = typeof parentDef.price_adjustment === 'string' 
        ? JSON.parse(parentDef.price_adjustment) 
        : parentDef.price_adjustment;
      
      if (typeof priceAdjustmentValue === 'number') {
        mergeOperation.price = {
          percentageDecrease: {
            value: priceAdjustmentValue,
          },
        };
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


