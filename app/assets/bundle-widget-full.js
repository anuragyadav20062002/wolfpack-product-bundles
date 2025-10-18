// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
  // Remove any existing toast
  const existingToast = document.getElementById('bundle-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'bundle-toast';
  toast.className = `bundle-toast bundle-toast-${type}`;
  toast.innerHTML = `
    <div class="bundle-toast-content">
      <span class="bundle-toast-message">${message}</span>
      <button class="bundle-toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;

  // Add CSS styles
  if (!document.getElementById('bundle-toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'bundle-toast-styles';
    styles.textContent = `
      .bundle-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000001;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        animation: slideInRight 0.3s ease-out;
      }
      .bundle-toast-info {
        background-color: #f0f8ff;
        border-left: 4px solid #007ace;
        color: #003d82;
      }
      .bundle-toast-warning {
        background-color: #fff8e1;
        border-left: 4px solid #ff9800;
        color: #e65100;
      }
      .bundle-toast-error {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
        color: #c62828;
      }
      .bundle-toast-success {
        background-color: #e8f5e8;
        border-left: 4px solid #4caf50;
        color: #2e7d32;
      }
      .bundle-toast-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .bundle-toast-message {
        flex: 1;
      }
      .bundle-toast-close {
        background: none;
        border: none;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
      }
      .bundle-toast-close:hover {
        opacity: 1;
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // Add to page
  document.body.appendChild(toast);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }
}

// Function to hide default Add to Cart button on bundle products
function hideDefaultAddToCartButton() {
  console.log('🚫 [WIDGET] Checking for default Add to Cart buttons to hide on bundle product');

  // Common selectors for Add to Cart buttons in Shopify themes
  const addToCartSelectors = [
    'button[name="add"]',
    'input[name="add"]',
    'form[action*="/cart/add"] button[type="submit"]',
    'form[action*="/cart/add"] input[type="submit"]',
    '.btn.product-form__cart-submit',
    '.product-form__buttons button',
    '.product-form__cart-submit',
    '.shopify-payment-button',
    '.product-payment-button',
    '[data-testid="AddToCartButton"]',
    '.add-to-cart-button',
    '.btn-addtocart',
    '.product-add-to-cart'
  ];

  // Hide all matching Add to Cart buttons
  addToCartSelectors.forEach(selector => {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
      if (button && button.style.display !== 'none') {
        console.log('🚫 [WIDGET] Hiding default Add to Cart button:', selector);
        button.style.display = 'none';
        button.setAttribute('data-bundle-hidden', 'true');
      }
    });
  });

  // Also hide Buy it now / Dynamic checkout buttons
  const buyNowSelectors = [
    '.shopify-payment-button',
    '.dynamic-checkout__content',
    '.additional-checkout-buttons',
    '.payment-button-container'
  ];

  buyNowSelectors.forEach(selector => {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
      if (button && button.style.display !== 'none') {
        console.log('🚫 [WIDGET] Hiding Buy Now button:', selector);
        button.style.display = 'none';
        button.setAttribute('data-bundle-hidden', 'true');
      }
    });
  });

  console.log('✅ [WIDGET] Default Add to Cart buttons hidden on bundle product');
}

// Function to restore default Add to Cart button (if needed)
function restoreDefaultAddToCartButton() {
  console.log('🔄 [WIDGET] Restoring default Add to Cart buttons');

  const hiddenButtons = document.querySelectorAll('[data-bundle-hidden="true"]');
  hiddenButtons.forEach(button => {
    button.style.display = '';
    button.removeAttribute('data-bundle-hidden');
  });

  console.log('✅ [WIDGET] Default Add to Cart buttons restored');
}

// Ensure modal is created only once globally
function ensureBundleModal() {
  if (document.getElementById('bundle-builder-modal')) {
    return; // Modal already exists
  }

  const modalHTML = `
    <div id="bundle-builder-modal" class="bundle-builder-modal">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-step-title"></div>
          <div class="modal-step-subtitle"></div>
          <div class="modal-tabs"></div>
          <span class="close-button">&times;</span>
        </div>
        <div class="modal-body">
          <div class="product-grid"></div>
        </div>
        <div class="modal-footer">
          <button class="modal-nav-button prev-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Prev
          </button>
          <div class="modal-footer-discount-messaging">
            <div class="modal-footer-progress-wrapper">
              <div class="modal-footer-progress-bar">
                <div class="modal-footer-progress-fill"></div>
              </div>
            </div>
            <div class="modal-footer-discount-text"></div>
          </div>
          <button class="modal-nav-button next-button">
            Next
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Initialize bundle widgets (supports multiple instances on same page)
function initializeBundleWidget(containerElement) {
  console.log('🚀 [WIDGET] Bundle widget initialization started');
  console.log('🔍 [WIDGET] Container element:', containerElement);

  // Ensure modal exists globally (created only once)
  ensureBundleModal();

  // Auto-hide default Add to Cart button on bundle products
  hideDefaultAddToCartButton();
  
  // Check if this widget has already been initialized to prevent duplicates
  if (containerElement.dataset.initialized === 'true') {
    console.log('⚠️ [WIDGET] Bundle widget already initialized, skipping duplicate.');
    return;
  }
  
  const allBundlesDataRaw = window.allBundlesData;
  const currentProductId = window.currentProductId;
  const currentProductHandle = window.currentProductHandle;
  const currentProductCollections = window.currentProductCollections;
  const shopCurrency = window.shopCurrency || 'USD';
  
  console.log('📋 [WIDGET] Window data:', {
    allBundlesDataRaw: !!allBundlesDataRaw,
    bundlesCount: allBundlesDataRaw ? Object.keys(allBundlesDataRaw).length : 0,
    currentProductId,
    currentProductHandle,
    collectionsCount: currentProductCollections ? currentProductCollections.length : 0,
    shopCurrency
  });
  
  if (!containerElement) {
    console.error('Bundle widget container element not provided.');
    return;
  }
  
  
  const widgetConfig = {
    bundleId: containerElement.dataset.bundleId || window.autoDetectedBundleId || null,
    isContainerProduct: containerElement.dataset.isContainerProduct === 'true',
    containerBundleId: containerElement.dataset.containerBundleId || null,
    hideDefaultButtons: containerElement.dataset.hideDefaultButtons === 'true',
    showTitle: containerElement.dataset.showTitle === 'true',
    showStepNumbers: containerElement.dataset.showStepNumbers === 'true',
    showFooterMessaging: containerElement.dataset.showFooterMessaging === 'true',
    discountTextTemplate: containerElement.dataset.discountTextTemplate || 'Add {discountConditionDiff} {discountUnit} to get the bundle at {discountValueUnit}{discountValue}',
    successMessageTemplate: containerElement.dataset.successMessageTemplate || 'Congratulations 🎉 you have gotten the best offer on your bundle!',
    progressTextTemplate: containerElement.dataset.progressTextTemplate || '{selectedQuantity} / {targetQuantity} items'
  };

  console.log('🔧 [WIDGET] Widget configuration:', widgetConfig);
  

  if (!allBundlesDataRaw || !currentProductId) {
    console.error('❌ [WIDGET] Bundle data or current product ID not available.');
    console.error('❌ [WIDGET] Missing data:', {
      allBundlesDataRaw: !!allBundlesDataRaw,
      currentProductId: !!currentProductId,
      allBundlesDataKeys: allBundlesDataRaw ? Object.keys(allBundlesDataRaw) : [],
      allBundlesDataType: typeof allBundlesDataRaw,
      allBundlesDataLength: allBundlesDataRaw ? Object.keys(allBundlesDataRaw).length : 0
    });

    // Show helpful message to user
    if (containerElement) {
      containerElement.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="color: #856404; margin-bottom: 10px;">🔧 Bundle Configuration</h3>
          <p style="color: #856404; margin-bottom: 15px;">
            ${!allBundlesDataRaw ? 'No bundle data found. Make sure bundles are published.' : 'Product context not available.'}
          </p>
          <details style="text-align: left; margin-top: 15px;">
            <summary style="cursor: pointer; color: #495057;">Debug Information</summary>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; margin-top: 10px; overflow-x: auto;">
Bundle Data Available: ${!!allBundlesDataRaw}
Bundle Data Type: ${typeof allBundlesDataRaw}
Bundle Count: ${allBundlesDataRaw ? Object.keys(allBundlesDataRaw).length : 0}
Current Product ID: ${currentProductId || 'None'}
Widget Config: ${JSON.stringify(widgetConfig, null, 2)}
            </pre>
          </details>
        </div>
      `;
    }
    return;
  }

  let bundles = allBundlesDataRaw; // allBundlesDataRaw is already a JS object
  
  let selectedBundle = null;

  // Convert bundles object to an array for easier iteration and filter out null/undefined entries
  const bundlesArray = Object.values(bundles).filter(bundle => bundle !== null && bundle !== undefined);
  console.log('📦 [WIDGET] Bundles array after filtering:', bundlesArray.length, 'valid bundles');
  console.log('📦 [WIDGET] Bundle IDs in array:', bundlesArray.map(b => ({ id: b.id, name: b.name, status: b.status })));

  // Currency formatter helper
  function formatCurrency(amount) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: shopCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      // Fallback if currency code is invalid
      return `${amount.toFixed(2)} ${shopCurrency}`;
    }
  }


  // ENHANCED BUNDLE SELECTION: Prioritize container products for cart transform bundles
  console.log('🔄 [WIDGET] Starting bundle selection process for container products');
  console.log('🎯 [WIDGET] Container product detection:', {
    isContainerProduct: widgetConfig.isContainerProduct,
    containerBundleId: widgetConfig.containerBundleId,
    configuredBundleId: widgetConfig.bundleId
  });

  for (const bundle of bundlesArray) {
    console.log('🔍 [WIDGET] Evaluating bundle:', bundle.name, 'Status:', bundle.status, 'Type:', bundle.bundleType);

    // Skip inactive bundles
    if (!bundle || bundle.status !== 'active') {
      console.log('⏭️ [WIDGET] Skipping inactive bundle:', bundle.name);
      continue;
    }

    // CART TRANSFORM BUNDLE LOGIC: FLEXIBLE CONTAINER MATCHING
    if (bundle.bundleType === 'cart_transform') {
      console.log('🛒 [WIDGET] Processing cart transform bundle:', bundle.name);

      // PRIORITY 1: Manual bundle ID configuration (theme editor or widget settings)
      if (widgetConfig.bundleId && widgetConfig.bundleId !== '') {
        if (bundle.id === widgetConfig.bundleId) {
          console.log('✅ [WIDGET] MANUAL BUNDLE ID MATCH: Found configured bundle:', bundle.name);
          selectedBundle = bundle;
          break;
        } else {
          console.log('⏭️ [WIDGET] Manual bundle ID mismatch, skipping:', bundle.id, '!==', widgetConfig.bundleId);
          continue;
        }
      }

      // PRIORITY 2: Container product with specific bundle ID (auto-detected from metafields)
      if (widgetConfig.isContainerProduct && widgetConfig.containerBundleId && widgetConfig.containerBundleId !== '') {
        if (bundle.id === widgetConfig.containerBundleId) {
          console.log('✅ [WIDGET] CONTAINER MATCH: Found bundle for container product:', bundle.name);
          selectedBundle = bundle;
          break;
        } else {
          console.log('⏭️ [WIDGET] Container bundle ID mismatch, skipping:', bundle.id, '!==', widgetConfig.containerBundleId);
          continue;
        }
      }
      
      // Check if we're in theme editor context (admin viewing)
      const isThemeEditor = window.isThemeEditorContext || // Set by extractBundleIdFromUrl function
                           window.location.pathname.includes('/editor') || 
                           window.location.search.includes('preview_theme_id') ||
                           window.location.search.includes('previewPath') ||
                           document.referrer.includes('admin.shopify.com') ||
                           window.parent !== window || // In iframe
                           window.autoDetectedBundleId; // Bundle ID detected from URL indicates theme editor
      
      console.log('🖥️ [WIDGET] Context check:', {
        isThemeEditor,
        bundleShopifyProductId: bundle.shopifyProductId,
        currentProductId
      });
      
      // ENHANCED BUNDLE ISOLATION: Check both isolation rules and bundle product matching
      console.log('🔒 [WIDGET] Checking bundle isolation for:', bundle.name);

      // Check if bundle has isolation rules (new enhanced system)
      if (bundle.isolation && bundle.isolation.restrictToProductId) {
        const restrictedProductId = bundle.isolation.restrictToProductId.includes('gid://shopify/Product/')
          ? bundle.isolation.restrictToProductId.split('/').pop()
          : bundle.isolation.restrictToProductId;

        console.log('🔒 [WIDGET] Bundle isolation check:', {
          bundleName: bundle.name,
          restrictedProductId,
          currentProductId: currentProductId.toString(),
          isRestricted: restrictedProductId !== currentProductId.toString()
        });

        // Bundle is isolated to a specific product - only show on that product
        if (restrictedProductId !== currentProductId.toString() && !isThemeEditor) {
          console.log('⏭️ [WIDGET] Bundle isolated to different product, skipping');
          continue;
        }
      } else if (isThemeEditor) {
        // ADMIN/THEME EDITOR: Show regardless of Bundle Product match
        console.log('🖥️ [WIDGET] Theme editor mode - showing bundle regardless of isolation');
      } else if (!bundle.shopifyProductId && !bundle.isolation) {
        // CUSTOMER VIEW WITHOUT RESTRICTIONS: Allow bundle to show if no specific product isolation is configured
        // This allows bundles to work on custom template pages where the container product setup may not be complete
        console.log('🎯 [WIDGET] No product isolation configured - allowing bundle to show on this page');
      }

      console.log('✅ [WIDGET] Selected cart transform bundle:', bundle.name);
      selectedBundle = bundle;
      break;
    }

    // DISCOUNT FUNCTION BUNDLE LOGIC: Use product/collection matching
    if (bundle.bundleType === 'discount_function') {
      // If a specific bundle ID is configured, only use that bundle
      if (widgetConfig.bundleId && bundle.id !== widgetConfig.bundleId) {
        continue;
      }
      
      let parsedMatching = null;
      if (bundle.matching) {
        if (typeof bundle.matching === 'string') {
          try {
            parsedMatching = JSON.parse(bundle.matching);
          } catch (e) {
            console.error('Failed to parse bundle.matching for bundle ID:', bundle.id, e);
            continue; // Skip this bundle if matching data is corrupt
          }
        } else if (typeof bundle.matching === 'object') {
          parsedMatching = bundle.matching; // It's already an object
        }
      }

      // If a specific bundle ID is configured, skip matching validation
      if (widgetConfig.bundleId) {
        selectedBundle = bundle;
        selectedBundle.parsedMatching = parsedMatching;
        break;
      }

      if (!parsedMatching) {
        console.log('No valid matching data for bundle ID:', bundle.id);
        continue;
      }
      
      console.log('Current Bundle ID:', bundle.id);
      console.log('Parsed Matching for Bundle:', parsedMatching);
      console.log('Liquid currentProductCollections:', currentProductCollections);

      const productMatches = parsedMatching &&
                             parsedMatching.selectedVisibilityProducts &&
                             Array.isArray(parsedMatching.selectedVisibilityProducts) &&
                             parsedMatching.selectedVisibilityProducts.some(p => {
                               // Extract numerical ID from GID for comparison
                               const productIdFromGid = p.id.split('/').pop();
                               console.log('Comparing Product:', productIdFromGid, '(' + typeof productIdFromGid + ') with currentProductId:', currentProductId, '(' + typeof currentProductId + ')');
                               return productIdFromGid === currentProductId.toString();
                             });
      console.log('Product Matches:', productMatches);

      const collectionMatches = parsedMatching &&
                                parsedMatching.selectedVisibilityCollections &&
                                Array.isArray(parsedMatching.selectedVisibilityCollections) &&
                                currentProductCollections &&
                                Array.isArray(currentProductCollections) &&
                                parsedMatching.selectedVisibilityCollections.some(bundleCollection => {
                                  // Extract numerical ID from GID for comparison
                                  const bundleCollectionIdFromGid = bundleCollection.id.split('/').pop();
                                  console.log('Comparing Bundle Collection:', bundleCollectionIdFromGid, '(' + typeof bundleCollectionIdFromGid + ') with currentProductCollection.id:', currentProductCollections.map(c => c.id.toString()), '(' + typeof currentProductCollections[0]?.id.toString() + ')');
                                  return currentProductCollections.some(productCollection => productCollection.id.toString() === bundleCollectionIdFromGid);
                                });
      console.log('Collection Matches:', collectionMatches);

      if (productMatches || collectionMatches) { // Modified condition
        console.log('✅ [WIDGET] Selected discount function bundle:', bundle.name, 'Product match:', productMatches, 'Collection match:', collectionMatches);
        selectedBundle = bundle; // We'll use the raw bundle object, which contains `steps` etc. directly.
        selectedBundle.parsedMatching = parsedMatching; // Attach parsed matching for future use
        console.log("🔍 [BUNDLE DEBUG] selectedBundle pricing structure:", { hasPricing: !!bundle.pricing, pricing: bundle.pricing });
        break; // Found a matching bundle, take the first one
      } else {
        console.log('❌ [WIDGET] No product/collection match for bundle:', bundle.name);
      }
      } // End discount function bundle logic
  } // End bundle loop

  // Use the containerElement that was passed to this function
  if (!containerElement) {
    console.error('Bundle builder container element not found after bundle selection.');
    return;
  }

  // Get references to existing bundle display elements
  const bundleHeader = containerElement.querySelector('.bundle-header');
  const bundleStepsContainer = containerElement.querySelector('.bundle-steps');
  const bundleIncludesContainer = containerElement.querySelector('.bundle-includes');
  const addBundleToCartButton = containerElement.querySelector('.add-bundle-to-cart');

  // Get references to modal elements
  const bundleBuilderModal = document.getElementById('bundle-builder-modal');
  const modalOverlay = bundleBuilderModal?.querySelector('.modal-overlay');
  const closeButton = bundleBuilderModal?.querySelector('.close-button');
  const modalTabsContainer = bundleBuilderModal?.querySelector('.modal-tabs');
  const productGridContainer = bundleBuilderModal?.querySelector('.product-grid');
  const prevButton = bundleBuilderModal?.querySelector('.prev-button');
  const nextButton = bundleBuilderModal?.querySelector('.next-button');

  console.log('🔍 [MODAL DEBUG] Modal elements:', {
    bundleBuilderModal: !!bundleBuilderModal,
    modalOverlay: !!modalOverlay,
    closeButton: !!closeButton,
    prevButton: !!prevButton,
    nextButton: !!nextButton
  });

  let currentActiveStepIndex = 0;
  // Store selected product IDs and their quantities per step
  // Example: selectedProductsQuantities[stepIndex] = { 'product1_id': 2, 'product2_id': 1 }
  let selectedProductsQuantities = selectedBundle ? selectedBundle.steps.map(() => ({})) : [];

  // Cache for product data per step to avoid re-fetching/re-parsing
  // This will store the actual product objects with imageUrls etc. including variant IDs and prices.
  let stepProductDataCache = selectedBundle ? selectedBundle.steps.map(() => ([])) : [];

  // Function to calculate total bundle price from selected products
  function calculateBundleTotalPrice() {
    let totalRawPrice = 0;
    selectedProductsQuantities.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductDataCache[stepIndex];
      for (const variantId in stepSelections) {
        const quantity = stepSelections[variantId];
        const product = productsInStep.find(p => p.variantId === variantId); // Find by variantId
        if (product && typeof product.price === 'number') {
          totalRawPrice += product.price * quantity;
        }
      }
    });

    return totalRawPrice;
  }

  // Function to calculate discount amount based on bundle pricing rules
  function calculateBundleDiscount(totalPrice, selectedQuantity) {
    console.log("🔍 [DISCOUNT DEBUG] calculateBundleDiscount called:", { totalPrice, selectedQuantity, hasSelectedBundle: !!selectedBundle, hasPricing: !!selectedBundle?.pricing, pricingEnabled: selectedBundle?.pricing?.enabled, fullPricing: selectedBundle?.pricing });
    if (!selectedBundle || !selectedBundle.pricing || !selectedBundle.pricing.enabled) {
      console.log("❌ [DISCOUNT DEBUG] Early return - missing data or disabled");
      return { discountAmount: 0, discountType: null, applicableRule: null };
    }

    const pricing = selectedBundle.pricing;
    const rules = pricing.rules || [];
    console.log("📋 [DISCOUNT DEBUG] Pricing rules:", rules);

    // Find the best applicable rule based on quantity
    let bestRule = null;
    for (const rule of rules) {
      const ruleQuantity = rule.value || 0;

      // Check if rule condition is met
      let conditionMet = false;
      if (rule.condition === 'greater_than_equal_to' || rule.condition === 'gte') {
        conditionMet = selectedQuantity >= ruleQuantity;
      } else if (rule.condition === 'equal_to' || rule.condition === 'eq') {
        conditionMet = selectedQuantity === ruleQuantity;
      } else if (rule.condition === 'greater_than' || rule.condition === 'gt') {
        conditionMet = selectedQuantity > ruleQuantity;
      } else {
        // Default to >= for standard quantity-based rules
        conditionMet = selectedQuantity >= ruleQuantity;
      }

      if (conditionMet) {
        if (!bestRule || ruleQuantity > (bestRule.value || 0)) {
          bestRule = rule;
        }
      }
    }

    if (!bestRule) {
      return { discountAmount: 0, discountType: null, applicableRule: null };
    }

    let discountAmount = 0;
    let discountType = pricing.method || pricing.discountMethod || 'fixed_amount_off';

    switch (discountType) {
      case 'fixed_amount_off':
        // For fixed amount off, use discountValue (the discount amount)
        // DO NOT use bestRule.value as that's the condition threshold
        discountAmount = parseFloat(bestRule.discountValue || 0);
        break;
      case 'percentage_off':
        const percentage = parseFloat(bestRule.discountValue || 0);
        discountAmount = (totalPrice * percentage) / 100;
        break;
      case 'fixed_bundle_price':
        const bundlePrice = parseFloat(bestRule.price || bestRule.fixedBundlePrice || 0);
        discountAmount = Math.max(0, totalPrice - bundlePrice);
        break;
      default:
        discountAmount = 0;
    }

    return {
      discountAmount: Math.max(0, discountAmount),
      discountType,
      applicableRule: bestRule
    };
  }

  // Helper function to extract discount value from rule based on discount method
  function getDiscountValueFromRule(rule, discountMethod, totalPrice = 0) {
    if (!rule) return 0;

    switch (discountMethod) {
      case 'fixed_amount_off':
        // For fixed amount off, return the discount amount
        // DO NOT fallback to rule.value as that's the threshold condition (e.g., 3 items), not the discount
        return parseFloat(rule.discountValue || 0);

      case 'percentage_off':
        // For percentage off, return the percentage value
        return parseFloat(rule.discountValue || 0);

      case 'fixed_bundle_price':
        // For fixed bundle price, return the target bundle price (what customer will pay)
        const fixedPrice = parseFloat(rule.fixedBundlePrice || 0);
        return fixedPrice;

      default:
        // Default fallback for unknown discount methods
        return parseFloat(rule.discountValue || 0);
    }
  }

  // Function to replace variables in discount messages using proper discount configuration variables
  function replaceDiscountVariables(message, variables) {
    if (!message) return '';
    
    let processedMessage = message;
    
    // Replace discount configuration variables - support both single and double curly braces
    // Single curly braces (default theme editor format)
    processedMessage = processedMessage.replace(/\{discountConditionDiff\}/g, variables.discountConditionDiff || '0');
    processedMessage = processedMessage.replace(/\{discountUnit\}/g, variables.discountUnit || 'items');
    processedMessage = processedMessage.replace(/\{discountValue\}/g, variables.discountValue || '0');
    processedMessage = processedMessage.replace(/\{discountValueUnit\}/g, variables.discountValueUnit || '');
    
    // Single curly braces (theme editor format) for quantity variables
    processedMessage = processedMessage.replace(/\{selectedQuantity\}/g, variables.selectedQuantity || '0');
    processedMessage = processedMessage.replace(/\{targetQuantity\}/g, variables.targetQuantity || '0');
    processedMessage = processedMessage.replace(/\{bundleName\}/g, variables.bundleName || '');
    processedMessage = processedMessage.replace(/\{itemsNeeded\}/g, variables.itemsNeeded || '0');
    
    // Variable replacements (double curly braces format)
    processedMessage = processedMessage.replace(/\{\{discountConditionDiff\}\}/g, variables.discountConditionDiff || '0');
    processedMessage = processedMessage.replace(/\{\{discountUnit\}\}/g, variables.discountUnit || 'items');
    processedMessage = processedMessage.replace(/\{\{discountValue\}\}/g, variables.discountValue || '0');
    processedMessage = processedMessage.replace(/\{\{discountValueUnit\}\}/g, variables.discountValueUnit || '');
    processedMessage = processedMessage.replace(/\{\{selectedQuantity\}\}/g, variables.selectedQuantity || '0');
    processedMessage = processedMessage.replace(/\{\{targetQuantity\}\}/g, variables.targetQuantity || '0');
    processedMessage = processedMessage.replace(/\{\{bundleName\}\}/g, variables.bundleName || '');
    processedMessage = processedMessage.replace(/\{\{itemsNeeded\}\}/g, variables.itemsNeeded || '0');
    processedMessage = processedMessage.replace(/\{\{originalPrice\}\}/g, variables.originalPrice || '');
    processedMessage = processedMessage.replace(/\{\{bundlePrice\}\}/g, variables.bundlePrice || '');
    processedMessage = processedMessage.replace(/\{\{savingsAmount\}\}/g, variables.savingsAmount || '');
    processedMessage = processedMessage.replace(/\{\{savingsPercentage\}\}/g, variables.savingsPercentage || '');
    processedMessage = processedMessage.replace(/\{\{minimumQuantity\}\}/g, variables.minimumQuantity || '');

    return processedMessage;
  }

  // Function to update modal footer discount messaging (integrated with nav buttons)
  function updateModalFooterDiscountMessaging() {
    console.log("🔍 [MODAL FOOTER DEBUG] updateModalFooterDiscountMessaging called");

    const footerMessaging = document.querySelector('.modal-footer-discount-messaging');
    const progressFill = document.querySelector('.modal-footer-progress-fill');
    const discountText = document.querySelector('.modal-footer-discount-text');

    console.log("🔍 [MODAL FOOTER DEBUG] DOM elements found:", { 
      hasFooterMessaging: !!footerMessaging, 
      hasProgressFill: !!progressFill, 
      hasDiscountText: !!discountText 
    });

    if (!footerMessaging || !selectedBundle || !selectedBundle.pricing) {
      console.log("❌ [MODAL FOOTER DEBUG] Early return:", { hasFooterMessaging: !!footerMessaging, hasBundle: !!selectedBundle, hasPricing: !!selectedBundle?.pricing });
      if (footerMessaging) footerMessaging.style.display = 'none';
      return;
    }

    const pricing = selectedBundle.pricing;

    // Check if discount messaging is enabled
    const showDiscountMessaging = pricing.messages?.showDiscountMessaging !== false;

    console.log("🔍 [MODAL FOOTER DEBUG] Checks:", { showDiscountMessaging, pricingEnabled: pricing.enabled, rulesCount: pricing.rules?.length });

    if (!showDiscountMessaging || !pricing.enabled) {
      console.log("❌ [MODAL FOOTER DEBUG] Early return - discount messaging disabled");
      footerMessaging.style.display = 'none';
      return;
    }

    console.log("✅ [MODAL FOOTER DEBUG] Proceeding to show modal footer discount messaging");

    const totalPrice = calculateBundleTotalPrice();
    const selectedQuantity = getTotalSelectedQuantity();

    // Get discount calculation
    const discountInfo = calculateBundleDiscount(totalPrice, selectedQuantity);
    const discountedPrice = totalPrice - discountInfo.discountAmount;

    // Find the next best discount rule for progress calculation
    const rules = pricing.rules || [];
    const sortedRules = rules.sort((a, b) => (a.value || 0) - (b.value || 0));
    const nextRule = sortedRules.find(rule => selectedQuantity < (rule.value || 0));
    const targetQuantity = nextRule ? (nextRule.value || 0) : (sortedRules[sortedRules.length - 1]?.value || 0);

    // Prepare variables for message replacement (matching admin discount configuration variables)
    const itemsNeeded = Math.max(0, targetQuantity - selectedQuantity);
    const discountMethod = pricing.method || pricing.discountMethod || 'fixed_amount_off';

    // Determine discount value unit based on method
    let discountValueUnit = '';
    if (discountMethod === 'percentage_off') {
      discountValueUnit = '% off';
    } else if (discountMethod === 'fixed_bundle_price') {
      discountValueUnit = shopCurrency; // Show currency symbol for fixed bundle price (e.g., "₹30")
    } else if (discountMethod === 'fixed_amount_off') {
      discountValueUnit = shopCurrency + ' off'; // Show currency + "off" for fixed amount (e.g., "₹10 off")
    }

    // Get discount value using helper function that handles all discount methods correctly
    // Use the rule customer is working towards (nextRule) if they haven't qualified yet
    const ruleToShow = discountInfo.applicableRule || nextRule || sortedRules[0];
    const currentDiscountValue = ruleToShow
      ? getDiscountValueFromRule(ruleToShow, discountMethod, totalPrice)
      : 0;

    const variables = {
      // Primary discount configuration variables (matching admin interface)
      discountConditionDiff: itemsNeeded.toString(),
      discountUnit: itemsNeeded === 1 ? 'item' : 'items',
      discountValue: currentDiscountValue.toString(),
      discountValueUnit: discountValueUnit,
      selectedQuantity: selectedQuantity.toString(),
      targetQuantity: targetQuantity.toString(),
      bundleName: selectedBundle.name || 'Bundle',
      itemsNeeded: itemsNeeded.toString(),

      // Legacy/additional variables for backward compatibility
      originalPrice: formatCurrency(totalPrice),
      bundlePrice: formatCurrency(discountedPrice),
      savingsAmount: formatCurrency(discountInfo.discountAmount),
      savingsPercentage: totalPrice > 0 ? Math.round((discountInfo.discountAmount / totalPrice) * 100) + '%' : '0%',
      minimumQuantity: discountInfo.applicableRule ? (discountInfo.applicableRule.value || 0).toString() : '0'
    };

    // Determine message state and text
    let messageState = 'progress';
    let messageText = '';

    if (discountInfo.discountAmount > 0) {
      // Discount achieved - show success message from admin dashboard
      messageState = 'success';

      // Try to get success message from admin dashboard settings
      const ruleMessages = pricing.messages?.ruleMessages || {};
      const ruleKey = discountInfo.applicableRule ? `rule_${sortedRules.indexOf(discountInfo.applicableRule) + 1}` : 'rule_1';

      if (ruleMessages[ruleKey]?.successMessage) {
        messageText = ruleMessages[ruleKey].successMessage;
        console.log("🔍 [MODAL FOOTER DEBUG] Using admin dashboard success message:", messageText);
      } else {
        // Fallback to theme editor template or default
        const successTemplate = containerElement.dataset.successMessageTemplate || 'Congratulations 🎉 you have gotten the best offer on your bundle!';
        messageText = replaceDiscountVariables(successTemplate, variables);
        console.log("🔍 [MODAL FOOTER DEBUG] Using fallback success message:", messageText);
      }
    } else if (itemsNeeded > 0) {
      // Progress towards discount - use admin dashboard settings
      let progressTemplate = '';

      // First, try to get rule-specific message from admin dashboard settings
      const ruleMessages = pricing.messages?.ruleMessages || {};
      const ruleKey = nextRule ? `rule_${sortedRules.indexOf(nextRule) + 1}` : 'rule_1';

      if (ruleMessages[ruleKey]?.discountText) {
        progressTemplate = ruleMessages[ruleKey].discountText;
        console.log("🔍 [MODAL FOOTER DEBUG] Using admin dashboard rule message:", progressTemplate);
      } else {
        // Fallback to theme editor template
        progressTemplate = containerElement.dataset.discountTextTemplate;

        // If no theme template, use default based on discount method
        if (!progressTemplate) {
          if (discountMethod === 'fixed_bundle_price') {
            progressTemplate = 'Add {discountConditionDiff} {discountUnit} • Bundle for {discountValue}{discountValueUnit}';
          } else {
            progressTemplate = 'Add {discountConditionDiff} {discountUnit} to save {discountValue}{discountValueUnit}';
          }
        }
        console.log("🔍 [MODAL FOOTER DEBUG] Using fallback template:", progressTemplate);
      }

      messageText = replaceDiscountVariables(progressTemplate, variables);
    } else {
      // No discount or completed
      messageText = `${variables.selectedQuantity} / ${variables.targetQuantity} items selected`;
    }

    // Update discount text
    if (discountText) {
      discountText.textContent = messageText;
    }

    // Calculate progress percentage
    const progressPercentage = targetQuantity > 0 ? Math.min(100, (selectedQuantity / targetQuantity) * 100) : 0;

    // Show footer messaging first
    footerMessaging.style.display = 'flex';

    // Apply state class
    footerMessaging.className = `modal-footer-discount-messaging ${messageState}`;

    // Update progress bar with requestAnimationFrame to ensure smooth update
    if (progressFill) {
      requestAnimationFrame(() => {
        progressFill.style.width = `${progressPercentage}%`;

        console.log("🔍 [MODAL FOOTER DEBUG] Progress bar updated:", {
          selectedQuantity,
          targetQuantity,
          progressPercentage,
          setWidth: progressFill.style.width,
          computedWidth: window.getComputedStyle(progressFill).width,
          computedTransition: window.getComputedStyle(progressFill).transition,
          isVisible: progressFill.offsetWidth > 0,
          parentVisible: footerMessaging.offsetWidth > 0
        });
      });
    }

    console.log("✅ [MODAL FOOTER DEBUG] Footer messaging updated:", messageText, "State:", messageState);
  }

  // Function to update footer discount messaging and progress bar
  function updateFooterDiscountMessaging() {
    console.log("🔍 [FOOTER DEBUG] updateFooterDiscountMessaging called:", { hasSelectedBundle: !!selectedBundle, hasPricing: !!selectedBundle?.pricing });

    if (!selectedBundle || !selectedBundle.pricing) {
      console.log("❌ [FOOTER DEBUG] Early return - no bundle or pricing");
      return;
    }

    const pricing = selectedBundle.pricing;

    // Check if discount messaging is enabled
    const showDiscountMessaging = pricing.messages?.showDiscountMessaging !== false;

    console.log("🔍 [FOOTER DEBUG] Checks:", { showDiscountMessaging, pricingEnabled: pricing.enabled });

    if (!showDiscountMessaging || !pricing.enabled) {
      const footerMessagingContainer = document.querySelector('.bundle-footer-messaging');
      if (footerMessagingContainer) {
        footerMessagingContainer.style.display = 'none';
      }
      console.log("❌ [FOOTER DEBUG] Early return - discount messaging disabled");
      return;
    }

    console.log("✅ [FOOTER DEBUG] Proceeding to show footer messaging");

    const totalPrice = calculateBundleTotalPrice();
    const selectedQuantity = getTotalSelectedQuantity();

    // Get discount calculation
    const discountInfo = calculateBundleDiscount(totalPrice, selectedQuantity);
    const discountedPrice = totalPrice - discountInfo.discountAmount;

    // Find the next best discount rule for progress calculation
    const rules = pricing.rules || [];
    const sortedRules = rules.sort((a, b) => (a.value || 0) - (b.value || 0));
    const nextRule = sortedRules.find(rule => selectedQuantity < (rule.value || 0));
    const targetQuantity = nextRule ? (nextRule.value || 0) : (sortedRules[sortedRules.length - 1]?.value || 0);

    // Prepare variables for message replacement
    const itemsNeeded = Math.max(0, targetQuantity - selectedQuantity);
    const discountMethod = pricing.method || pricing.discountMethod || 'fixed_amount_off';

    // Determine discount value unit based on method
    let discountValueUnit = '';
    if (discountMethod === 'percentage_off') {
      discountValueUnit = '% off';
    } else if (discountMethod === 'fixed_bundle_price') {
      discountValueUnit = shopCurrency; // Show currency symbol for fixed bundle price (e.g., "₹30")
    } else if (discountMethod === 'fixed_amount_off') {
      discountValueUnit = shopCurrency + ' off'; // Show currency + "off" for fixed amount (e.g., "₹10 off")
    }

    // Get discount value using helper function that handles all discount methods correctly
    // Use the rule customer is working towards (nextRule) if they haven't qualified yet
    const ruleToShow = discountInfo.applicableRule || nextRule || sortedRules[0];
    const currentDiscountValue = ruleToShow
      ? getDiscountValueFromRule(ruleToShow, discountMethod, totalPrice)
      : 0;

    const variables = {
      discountConditionDiff: itemsNeeded.toString(),
      discountUnit: itemsNeeded === 1 ? 'item' : 'items',
      discountValue: currentDiscountValue.toString(),
      discountValueUnit: discountValueUnit,
      selectedQuantity: selectedQuantity.toString(),
      targetQuantity: targetQuantity.toString(),
      bundleName: selectedBundle.name || 'Bundle',
      itemsNeeded: itemsNeeded.toString(),
      originalPrice: formatCurrency(totalPrice),
      bundlePrice: formatCurrency(discountedPrice),
      savingsAmount: formatCurrency(discountInfo.discountAmount),
      savingsPercentage: totalPrice > 0 ? Math.round((discountInfo.discountAmount / totalPrice) * 100) + '%' : '0%',
      minimumQuantity: discountInfo.applicableRule ? (discountInfo.applicableRule.value || 0).toString() : '0'
    };

    // Get rule-specific messages from pricing configuration
    const ruleMessages = pricing.messages?.ruleMessages || {};

    // Update footer messaging elements - minimal design
    const footerMessagingContainer = document.querySelector('.bundle-footer-messaging');
    const footerDiscountText = document.querySelector('.footer-discount-text');

    if (!footerMessagingContainer) {
      console.log("❌ [FOOTER DEBUG] Footer messaging container not found in DOM");
      return;
    }

    console.log("🔍 [FOOTER DEBUG] Footer container found, rules:", rules.length);

    // Show footer messaging if there are discount rules
    if (pricing.enabled && rules.length > 0) {
      console.log("✅ [FOOTER DEBUG] Showing footer messaging");
      footerMessagingContainer.style.display = 'block';

      // Minimal messaging: single line with savings info inline
      let displayMessage = '';

      if (discountInfo.discountAmount > 0 && discountInfo.applicableRule) {
        // Qualified: show success message with savings inline
        const ruleId = discountInfo.applicableRule.id;
        const ruleSuccessMessage = ruleMessages[ruleId]?.successMessage;
        const baseMessage = ruleSuccessMessage
          ? replaceDiscountVariables(ruleSuccessMessage, variables)
          : replaceDiscountVariables(widgetConfig.successMessageTemplate, variables);

        displayMessage = `${baseMessage} <span class="savings-badge">Saved ${variables.savingsAmount}</span>`;
      } else if (nextRule && selectedQuantity > 0) {
        // Progress towards discount
        const itemsNeeded = targetQuantity - selectedQuantity;
        const nextRuleDiscountValue = getDiscountValueFromRule(nextRule, discountMethod, totalPrice);
        const nextRuleVariables = {
          ...variables,
          discountValue: nextRuleDiscountValue.toString(),
          discountConditionDiff: itemsNeeded.toString(),
          itemsNeeded: itemsNeeded.toString()
        };

        const ruleId = nextRule.id;
        const ruleDiscountText = ruleMessages[ruleId]?.discountText;
        displayMessage = ruleDiscountText
          ? replaceDiscountVariables(ruleDiscountText, nextRuleVariables)
          : replaceDiscountVariables(widgetConfig.discountTextTemplate, nextRuleVariables);
      } else if (selectedQuantity === 0) {
        // Initial state
        const minRule = sortedRules[0];
        if (minRule) {
          const minRuleDiscountValue = getDiscountValueFromRule(minRule, discountMethod, totalPrice);
          const initialVariables = {
            ...variables,
            discountValue: minRuleDiscountValue.toString(),
            discountConditionDiff: (minRule.value || 1).toString(),
            itemsNeeded: (minRule.value || 1).toString()
          };

          const ruleId = minRule.id;
          const ruleDiscountText = ruleMessages[ruleId]?.discountText;
          displayMessage = ruleDiscountText
            ? replaceDiscountVariables(ruleDiscountText, initialVariables)
            : replaceDiscountVariables(widgetConfig.discountTextTemplate, initialVariables);
        } else {
          displayMessage = 'Build your perfect bundle and save';
        }
      }

      // Update minimal messaging
      if (footerDiscountText) {
        footerDiscountText.innerHTML = displayMessage;
      }

    } else {
      // Hide footer messaging if no discount rules
      footerMessagingContainer.style.display = 'none';
    }
  }

  // Function to update the Add to Cart button text with calculated price
  function updateAddToCartButton() {
    if (addBundleToCartButton) {
      const totalBundlePrice = calculateBundleTotalPrice();
      const selectedQuantity = getTotalSelectedQuantity();
      const discountInfo = calculateBundleDiscount(totalBundlePrice, selectedQuantity);
      const discountedPrice = totalBundlePrice - discountInfo.discountAmount;

      // Check if discount display is enabled in bundle configuration
      const showDiscountDisplay = selectedBundle?.pricing?.messages?.showDiscountDisplay !== false; // Default to true

      // Show discounted price if applicable and display is enabled
      if (discountInfo.discountAmount > 0 && showDiscountDisplay) {
        const originalPriceFormatted = formatCurrency(totalBundlePrice);
        const discountedPriceFormatted = formatCurrency(discountedPrice);
        addBundleToCartButton.innerHTML = `
          <span style="display: flex; flex-direction: column; align-items: center;">
            <span style="text-decoration: line-through; font-size: 0.8em; opacity: 0.7;">${originalPriceFormatted}</span>
            <span>Add Bundle to Cart • ${discountedPriceFormatted}</span>
          </span>
        `;
      } else {
        const formattedPrice = formatCurrency(totalBundlePrice);
        addBundleToCartButton.textContent = `Add Bundle to Cart • ${formattedPrice}`;
      }
    }
  }

  // Helper: total selected quantity across steps
  function getTotalSelectedQuantity() {
    return selectedProductsQuantities.reduce((sum, stepSelections) => {
      for (const q of Object.values(stepSelections)) {
        sum += q;
      }
      return sum;
    }, 0);
  }

  // Function to open the modal
  function openBundleModal(stepIndex) {
    currentActiveStepIndex = stepIndex;
    
    // Ensure modal is appended directly to document.body
    if (!document.body.contains(bundleBuilderModal)) {
      document.body.appendChild(bundleBuilderModal);
    }
    
    // Remove any inline styling that might conflict with CSS rules
    bundleBuilderModal.removeAttribute('style');
    
    // Activate the modal
    bundleBuilderModal.classList.add('active');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    renderModalContent();
  }

  // Function to close the modal
  function closeBundleModal() {
    bundleBuilderModal.classList.remove('active');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    
    // Update displays after closing
    updateMainBundleStepsDisplay();
    updateAddToCartButton();
    updateFooterDiscountMessaging(); // Update footer progress and messaging
    updateModalFooterDiscountMessaging(); // Update modal footer messaging
  }

  // Function to render modal content (tabs and product grid for current step)
  async function renderModalContent() {
    renderModalTabs();
    renderCurrentStepInfo();
    // Render the products for the current step
    await renderProductGrid(currentActiveStepIndex);
    updateNavigationButtons();
  }

  // Function to render tabs in the modal header
  function renderModalTabs() {
    modalTabsContainer.innerHTML = '';
    if (!selectedBundle || !selectedBundle.steps) return;

    const totalSteps = selectedBundle.steps.length;

    selectedBundle.steps.forEach((step, index) => {
      // Create step container (includes step circle + connector)
      const stepContainer = document.createElement('div');
      stepContainer.classList.add('milestone-step-container');

      // Calculate step completion status
      const stepTotalQuantity = Object.values(selectedProductsQuantities[index]).reduce((sum, qty) => sum + qty, 0);
      const currentStep = selectedBundle.steps[index];
      let isStepCompleted = false;
      let isStepStarted = stepTotalQuantity > 0;

      // Determine completion based on conditions
      if (currentStep.conditionType === 'quantity' && currentStep.conditionOperator && currentStep.conditionValue !== null) {
        const requiredQuantity = currentStep.conditionValue;
        switch (currentStep.conditionOperator) {
          case 'equal_to':
            isStepCompleted = stepTotalQuantity === requiredQuantity;
            break;
          case 'greater_than':
            isStepCompleted = stepTotalQuantity > requiredQuantity;
            break;
          case 'less_than':
            isStepCompleted = stepTotalQuantity < requiredQuantity;
            break;
          case 'greater_than_or_equal_to':
            isStepCompleted = stepTotalQuantity >= requiredQuantity;
            break;
          case 'less_than_or_equal_to':
            isStepCompleted = stepTotalQuantity <= requiredQuantity;
            break;
        }
      }
      // No condition: consider completed if any product selected
      else if (stepTotalQuantity > 0) {
        isStepCompleted = true;
      }

      // Determine if step is accessible (all previous steps completed or no conditions)
      let isAccessible = true;
      for (let i = 0; i < index; i++) {
        const prevStep = selectedBundle.steps[i];
        const prevStepQty = Object.values(selectedProductsQuantities[i]).reduce((sum, qty) => sum + qty, 0);

        if (prevStep.conditionType === 'quantity' && prevStep.conditionOperator && prevStep.conditionValue !== null) {
          const prevRequired = prevStep.conditionValue;
          let prevCompleted = false;

          switch (prevStep.conditionOperator) {
            case 'equal_to': prevCompleted = prevStepQty === prevRequired; break;
            case 'greater_than': prevCompleted = prevStepQty > prevRequired; break;
            case 'less_than': prevCompleted = prevStepQty < prevRequired; break;
            case 'greater_than_or_equal_to': prevCompleted = prevStepQty >= prevRequired; break;
            case 'less_than_or_equal_to': prevCompleted = prevStepQty <= prevRequired; break;
          }

          if (!prevCompleted) {
            isAccessible = false;
            break;
          }
        }
      }

      // Build step HTML
      stepContainer.innerHTML = `
        <div class="milestone-step ${index === currentActiveStepIndex ? 'active' : ''} ${isStepCompleted ? 'completed' : ''} ${isStepStarted && !isStepCompleted ? 'in-progress' : ''} ${!isAccessible ? 'locked' : ''}">
          <div class="milestone-circle">
            <span class="milestone-number">${isStepCompleted ? '✓' : index + 1}</span>
          </div>
          <div class="milestone-label">${step.name || `Step ${index + 1}`}</div>
        </div>
        ${index < totalSteps - 1 ? `<div class="milestone-connector ${isStepCompleted ? 'completed' : (isStepStarted ? 'in-progress' : '')}"></div>` : ''}
      `;

      stepContainer.dataset.stepIndex = index.toString();

      // Click handler for the step
      const stepElement = stepContainer.querySelector('.milestone-step');
      stepElement.addEventListener('click', () => {
        if (!isAccessible) {
          showToast('Please complete the previous steps first.', 'warning');
          return;
        }

        if (validateCurrentStep() || index === currentActiveStepIndex) {
          currentActiveStepIndex = index;
          renderModalContent();
        } else {
          showToast('Please meet the quantity conditions for the current step before moving to another.', 'warning');
        }
      });

      modalTabsContainer.appendChild(stepContainer);
    });
  }

  // Render current step info
  function renderCurrentStepInfo() {
    // Update modal header step title and subtitle
    const modalStepTitle = bundleBuilderModal.querySelector('.modal-step-title');
    const modalStepSubtitle = bundleBuilderModal.querySelector('.modal-step-subtitle');
    
    if (modalStepTitle && modalStepSubtitle && selectedBundle) {
      const step = selectedBundle.steps[currentActiveStepIndex];
      const selectedCount = Object.values(selectedProductsQuantities[currentActiveStepIndex]).reduce((a, b) => a + b, 0);

      // Set the step title - use actual step name from bundle configuration
      modalStepTitle.textContent = step.name || `Step ${currentActiveStepIndex + 1}`;
      
      // Set the step subtitle with quantity requirements
      let subtitleText = '';
      if (step.conditionType === 'quantity' && step.conditionOperator && step.conditionValue !== null) {
        const value = step.conditionValue;
        switch (step.conditionOperator) {
          case 'equal_to':
            subtitleText = `Select exactly ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'greater_than_or_equal_to':
            subtitleText = `Select at least ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'less_than_or_equal_to':
            subtitleText = `Select up to ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'greater_than':
            subtitleText = `Select more than ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'less_than':
            subtitleText = `Select less than ${value} product${value > 1 ? 's' : ''}`;
            break;
        }
        if (selectedCount > 0) {
          subtitleText += ` (${selectedCount} selected)`;
        }
      } else {
        subtitleText = selectedCount > 0 ? `${selectedCount} product${selectedCount > 1 ? 's' : ''} selected` : 'Choose products for this step';
      }
      
      modalStepSubtitle.textContent = subtitleText;
    }

    // Legacy support for existing modal-current-step-info container  
    const currentStepInfoContainer = bundleBuilderModal.querySelector('.modal-current-step-info');
    if (currentStepInfoContainer && selectedBundle) {
      const step = selectedBundle.steps[currentActiveStepIndex];
      const selectedCount = Object.values(selectedProductsQuantities[currentActiveStepIndex]).reduce((a, b) => a + b, 0);

      let quantityText = '';
      if (step.conditionType === 'quantity' && step.conditionOperator && step.conditionValue !== null) {
        const value = step.conditionValue;
        switch (step.conditionOperator) {
          case 'equal_to':
            quantityText = `Add ${value} product${value > 1 ? 's' : ''} only`;
            break;
          case 'greater_than_or_equal_to':
            quantityText = `Add at least ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'less_than_or_equal_to':
            quantityText = `Add at most ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'greater_than':
            quantityText = `Add more than ${value} product${value > 1 ? 's' : ''}`;
            break;
          case 'less_than':
            quantityText = `Add less than ${value} product${value > 1 ? 's' : ''}`;
            break;
        }
      }

      currentStepInfoContainer.innerHTML = `
        <div class="step-info">
          <h2>Step ${currentActiveStepIndex + 1} of ${selectedBundle.steps.length}</h2>
          <h1>${step.name}</h1>
          <p>${selectedCount} products selected</p>
          ${quantityText ? `<p><strong>${quantityText}</strong></p>` : ''}
        </div>
      `;
    }
  }

  // Helper to fetch product details (if not already in cache) - This is a placeholder
  // In a real Shopify setup, you'd use a Storefront API call or similar.
  async function fetchProductDetails(productId) {
    // Placeholder: In a real scenario, you'd make an AJAX request to /products/product-handle.js
    // or use Shopify's Storefront API to get full product data including images.
    // For now, we'll return a dummy object if not found in current data.
    console.warn(`Attempted to fetch product details for ${productId}. This is a placeholder function.`);
    return {
      id: productId,
      title: `Product ${productId}`,
      imageUrl: 'https://via.placeholder.com/150' // Default image
    };
  }

  // Function to render product grid for the current step
  async function renderProductGrid(stepIndex) {
    productGridContainer.innerHTML = '';
    const currentStep = selectedBundle.steps[stepIndex];
    if (!currentStep) return;

    let productsToDisplay = stepProductDataCache[stepIndex];

    if (productsToDisplay.length === 0) {
      let explicitProducts = [];
      let collectionProducts = [];

      // 1. Process explicitly selected products from both products and StepProduct arrays
      let allProducts = [];
      
      // Add products from the products array (if available)
      if (currentStep.products && Array.isArray(currentStep.products) && currentStep.products.length > 0) {
        allProducts = allProducts.concat(currentStep.products);
      }
      
      // Add products from the StepProduct array (if available) 
      if (currentStep.StepProduct && Array.isArray(currentStep.StepProduct) && currentStep.StepProduct.length > 0) {
        // Convert StepProduct format to match products format
        const stepProducts = currentStep.StepProduct.map(sp => ({
          id: sp.productId,
          title: sp.title,
          images: sp.imageUrl ? [{ originalSrc: sp.imageUrl }] : [],
          variants: sp.variants || []
        }));
        allProducts = allProducts.concat(stepProducts);
      }
      
      if (allProducts.length > 0) {
        explicitProducts = allProducts.flatMap(p => {
          if (currentStep.displayVariantsAsIndividual && p.variants && p.variants.length > 0) {
            return p.variants.map(variant => ({
              id: variant.id.split('/').pop(),
              title: `${p.title} - ${variant.title}`,
              imageUrl: p.images && p.images.length > 0 ? p.images[0].originalSrc : 'https://via.placeholder.com/150',
              price: parseFloat(variant.price || '0'),
              variantId: variant.id.split('/').pop()
            }));
          } else {
            const defaultVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            return [{
              id: defaultVariant ? defaultVariant.id.split('/').pop() : p.id.split('/').pop(),
              title: p.title,
              imageUrl: p.images && p.images.length > 0 ? p.images[0].originalSrc : (p.image ? p.image.src : 'https://via.placeholder.com/150'),
              price: defaultVariant ? parseFloat(defaultVariant.price || '0') : 0,
              variantId: defaultVariant ? defaultVariant.id.split('/').pop() : (p.variants && p.variants.length > 0 ? p.variants[0].id.split('/').pop() : null),
              variants: (p.variants || []).map(v => ({ id: v.id.split('/').pop(), title: v.title, price: parseFloat(v.price || '0') }))
            }];
          }
        });
      }

      // 2. Fetch products from collections
      if (currentStep.collections && Array.isArray(currentStep.collections) && currentStep.collections.length > 0) {
        const collectionPromises = currentStep.collections.map(async (c) => {
          if (!c.handle) return [];
          try {
            const res = await fetch(`/collections/${c.handle}/products.json?limit=250`);
            if (!res.ok) return [];
            const data = await res.json();
            if (!data.products || !Array.isArray(data.products)) return [];

            return data.products.flatMap((p) => {
              if (currentStep.displayVariantsAsIndividual && p.variants && p.variants.length > 0) {
                return p.variants.map((variant) => ({
                  id: variant.id.toString().split('/').pop(),
                  title: `${p.title} - ${variant.title}`,
                  imageUrl: p.images && p.images.length > 0 ? p.images[0].src : 'https://via.placeholder.com/150',
                  price: parseFloat(variant.price),
                  variantId: variant.id.toString().split('/').pop(),
                }));
              } else {
                const defaultVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
                return [{
                  id: defaultVariant ? defaultVariant.id.toString().split('/').pop() : p.id.toString().split('/').pop(),
                  title: p.title,
                  imageUrl: p.images && p.images.length > 0 ? p.images[0].src : (p.image ? p.image.src : 'https://via.placeholder.com/150'),
                  price: defaultVariant ? parseFloat(defaultVariant.price) : 0,
                  variantId: defaultVariant ? defaultVariant.id.toString().split('/').pop() : (p.variants && p.variants.length > 0 ? p.variants[0].id.toString().split('/').pop() : null),
                  variants: (p.variants || []).map(v => ({ id: v.id.toString().split('/').pop(), title: v.title, price: parseFloat(v.price || '0') }))
                }];
              }
            });
          } catch (err) {
            console.warn('Failed to fetch products for collection', c.handle, err);
            return [];
          }
        });
        collectionProducts = (await Promise.all(collectionPromises)).flat();
      }

      // 3. Combine and de-duplicate
      const combinedProducts = [...explicitProducts, ...collectionProducts];
      const seen = new Set();
      productsToDisplay = combinedProducts.filter((p) => {
        const key = p.variantId || p.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      stepProductDataCache[stepIndex] = productsToDisplay; // Cache for future use
    }

    // Display a message if no products are configured for the step
    if (productsToDisplay.length === 0) {
      productGridContainer.innerHTML = '<p style="text-align: center; padding: 20px;">No products configured for this step.</p>';
      return;
    }

    productsToDisplay.forEach(product => {
      const productCard = document.createElement('div');
      productCard.classList.add('product-card');
      // Use actual product ID for data-attribute, not GID
      const selectionKey = product.variantId || product.id;
      productCard.dataset.productId = selectionKey;

      const currentQuantity = selectedProductsQuantities[stepIndex][selectionKey] || 0;

      if (currentQuantity > 0) {
        productCard.classList.add('selected');
      }

      const priceMarkup = `<p class="product-price">${formatCurrency(product.price)}</p>`;
      const variantSelectorMarkup = (!currentStep.displayVariantsAsIndividual && product.variants && product.variants.length > 1) ? `
        <select class="variant-selector" data-base-product-id="${product.id}">
          ${product.variants.map(v => `<option value="${v.id}" ${v.id === product.variantId ? 'selected' : ''}>${v.title}</option>`).join('')}
        </select>
      ` : '';

      productCard.innerHTML = `
        <div class="image-wrapper">
          <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-info">
          <p class="product-title">${product.title}</p>
          ${priceMarkup}
          ${variantSelectorMarkup}
        </div>
        ${currentQuantity > 0 ? `<div class="selected-overlay">${currentQuantity}</div>` : ''}
        <div class="quantity-controls">
          <button class="quantity-control-button decrease-quantity" data-product-id="${selectionKey}">-</button>
          <span class="quantity-display">${currentQuantity}</span>
          <button class="quantity-control-button increase-quantity" data-product-id="${selectionKey}">+</button>
        </div>
      `;

      // Event listener for toggling selection (clicking anywhere on card except buttons)
      productCard.addEventListener('click', (event) => {
        if (!event.target.closest('.quantity-control-button')) {
          const productId = selectionKey;
          const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
          // If clicked and not selected, select with quantity 1. If selected, deselect (quantity 0).
          updateProductSelection(stepIndex, productId, currentQty > 0 ? 0 : 1);
        }
      });

      // Event listeners for quantity buttons
      const increaseButton = productCard.querySelector('.increase-quantity');
      const decreaseButton = productCard.querySelector('.decrease-quantity');

      increaseButton.addEventListener('click', () => {
        const productId = selectionKey;
        const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
        updateProductSelection(stepIndex, productId, currentQty + 1);
      });

      decreaseButton.addEventListener('click', () => {
        const productId = selectionKey;
        const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
        if (currentQty > 0) {
          updateProductSelection(stepIndex, productId, currentQty - 1);
        }
      });

      // Variant selector change handler
      const variantSelector = productCard.querySelector('.variant-selector');
      if (variantSelector) {
        variantSelector.addEventListener('change', (e) => {
          const newVariantId = e.target.value;
          if (newVariantId === product.variantId) return; // no change

          // Update product object in cache
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (!variantData) return;

          // Move any selected quantity from old variantId to newVariantId
          const oldQty = selectedProductsQuantities[stepIndex][product.variantId] || 0;
          if (oldQty > 0) {
            delete selectedProductsQuantities[stepIndex][product.variantId];
            selectedProductsQuantities[stepIndex][newVariantId] = oldQty;
          }

          // Update product properties
          product.variantId = newVariantId;
          product.price = variantData.price;
          product.id = newVariantId; // align id for selection map

          // Re-render grid to reflect changes (price, dataset ids, overlays)
          renderProductGrid(stepIndex);
        });
      }

      productGridContainer.appendChild(productCard);
    });
  }

  // Function to update selected product quantities with step condition validation
  function updateProductSelection(stepIndex, productId, newQuantity) {
    console.log("🔄 [SELECTION] updateProductSelection called:", { stepIndex, productId, newQuantity });

    if (!selectedProductsQuantities[stepIndex]) {
      selectedProductsQuantities[stepIndex] = {};
    }

    // Ensure quantities don't go below 0
    const quantity = Math.max(0, newQuantity);
    
    // Check step conditions before allowing the update
    const currentStep = selectedBundle.steps[stepIndex];
    if (currentStep.conditionType === 'quantity' && currentStep.conditionOperator && currentStep.conditionValue !== null) {
      // Calculate what the total would be with this change
      let totalQuantityWouldBe = 0;
      for (const prodId in selectedProductsQuantities[stepIndex]) {
        if (prodId === productId) {
          totalQuantityWouldBe += quantity;
        } else {
          totalQuantityWouldBe += selectedProductsQuantities[stepIndex][prodId];
        }
      }
      
      const requiredQuantity = currentStep.conditionValue;
      let allowUpdate = false;
      
      switch (currentStep.conditionOperator) {
        case 'equal_to':
          allowUpdate = totalQuantityWouldBe <= requiredQuantity;
          break;
        case 'greater_than':
          allowUpdate = true; // Allow any increase for greater_than
          break;
        case 'less_than':
          allowUpdate = totalQuantityWouldBe < requiredQuantity;
          break;
        case 'greater_than_or_equal_to':
          allowUpdate = true; // Allow any increase
          break;
        case 'less_than_or_equal_to':
          allowUpdate = totalQuantityWouldBe <= requiredQuantity;
          break;
        default:
          allowUpdate = true;
      }
      
      if (!allowUpdate && quantity > (selectedProductsQuantities[stepIndex][productId] || 0)) {
        // Show user-friendly message about step limits
        const operatorText = {
          'equal_to': `exactly ${requiredQuantity}`,
          'less_than': `less than ${requiredQuantity}`,
          'less_than_or_equal_to': `at most ${requiredQuantity}`,
          'greater_than': `more than ${requiredQuantity}`,
          'greater_than_or_equal_to': `at least ${requiredQuantity}`
        };
        const limitText = operatorText[currentStep.conditionOperator] || requiredQuantity;
        showToast(`This step allows ${limitText} product${requiredQuantity !== 1 ? 's' : ''} only.`, 'warning');
        return; // Don't update if it would violate the condition
      }
    }

    selectedProductsQuantities[stepIndex][productId] = quantity;

    if (quantity === 0) {
      delete selectedProductsQuantities[stepIndex][productId];
    }

    // Re-render the specific product card or the entire grid for simplicity
    renderProductGrid(stepIndex); // Re-render to update UI (selected class, quantity display)
    updateNavigationButtons(); // Update button state based on new selections
    renderModalTabs(); // Re-render tabs to update checkmarks
    updateAddToCartButton(); // Update button price display
    updateFooterDiscountMessaging(); // Update footer discount messaging
    updateModalFooterDiscountMessaging(); // Update modal footer messaging
    
    // Force progress bar update with a slight delay to ensure DOM is updated
    setTimeout(() => {
      updateModalFooterDiscountMessaging();
    }, 50);
  }

  // Function to validate current step based on quantity rules
  function validateCurrentStep() {
    const currentStep = selectedBundle.steps[currentActiveStepIndex];
    const selectedProductsInCurrentStep = selectedProductsQuantities[currentActiveStepIndex];

    let totalQuantitySelected = 0;
    for (const prodId in selectedProductsInCurrentStep) {
      totalQuantitySelected += selectedProductsInCurrentStep[prodId];
    }

    // Check if step has quantity-based conditions
    if (currentStep.conditionType === 'quantity' && currentStep.conditionOperator && currentStep.conditionValue !== null) {
      const requiredQuantity = currentStep.conditionValue;
      switch (currentStep.conditionOperator) {
        case 'equal_to':
          return totalQuantitySelected === requiredQuantity;
        case 'greater_than':
          return totalQuantitySelected > requiredQuantity;
        case 'less_than':
          return totalQuantitySelected < requiredQuantity;
        case 'greater_than_or_equal_to':
          return totalQuantitySelected >= requiredQuantity;
        case 'less_than_or_equal_to':
          return totalQuantitySelected <= requiredQuantity;
        default:
          return false; // Unknown condition operator
      }
    }
    // If no explicit condition is configured, the step is always valid (allow navigation)
    return true;
  }

  // Function to update navigation button states (Prev/Next/Done) and check quantity rules
  function updateNavigationButtons() {
    const totalSteps = selectedBundle.steps.length;
    prevButton.disabled = currentActiveStepIndex === 0;

    const isCurrentStepValid = validateCurrentStep();

    if (currentActiveStepIndex === totalSteps - 1) {
      nextButton.textContent = 'Done';
      nextButton.disabled = !isCurrentStepValid; // 'Done' button is disabled if last step is not valid
    } else {
      nextButton.textContent = 'Next';
      nextButton.disabled = !isCurrentStepValid; // 'Next' button is disabled if current step is not valid
    }
  }

  // Function to update the main bundle steps display after modal is closed
  function updateMainBundleStepsDisplay() {
    
    // Use container-specific bundle steps container (not global querySelector)
    if (!bundleStepsContainer) {
      console.error('Bundle steps container not found in this widget instance');
      return;
    }

    bundleStepsContainer.innerHTML = ''; // Clear existing steps

    if (!selectedBundle || !selectedBundle.steps) {
      return;
    }


    selectedBundle.steps.forEach((step, index) => {
      const stepBox = document.createElement('div');
      stepBox.classList.add('step-box');
      stepBox.dataset.stepIndex = index.toString();

      const selectedProductsInStep = selectedProductsQuantities[index];
      const hasSelections = Object.keys(selectedProductsInStep).some(key => selectedProductsInStep[key] > 0);
      
      if (hasSelections) {
        stepBox.classList.add('has-selections');
        
        // Collect unique product images
        const productImages = [];
        let totalQuantity = 0;
        
        for (const variantId in selectedProductsInStep) {
          const quantity = selectedProductsInStep[variantId];
          if (quantity > 0) {
            totalQuantity += quantity;
            const product = stepProductDataCache[index].find((p) => (p.variantId || p.id) === variantId);
            if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
              productImages.push({
                url: product.imageUrl,
                alt: product.title || ''
              });
            }
          }
        }
        
        if (productImages.length > 0) {
          const imagesContainer = document.createElement('div');
          imagesContainer.classList.add('step-images');
          
          // Add image count class for styling
          if (productImages.length === 2) {
            imagesContainer.classList.add('two-images');
          } else if (productImages.length === 3) {
            imagesContainer.classList.add('three-images');  
          } else if (productImages.length >= 4) {
            imagesContainer.classList.add('four-plus-images');
          }
          
          // Show up to 4 images, then show count badge
          const maxVisibleImages = 4;
          const imagesToShow = productImages.slice(0, maxVisibleImages);
          
          imagesToShow.forEach(imageData => {
            const img = document.createElement('img');
            img.src = imageData.url;
            img.alt = imageData.alt;
            img.classList.add('step-image');
            imagesContainer.appendChild(img);
          });
          
          // Add count badge if there are more than 4 products
          if (productImages.length > maxVisibleImages || totalQuantity > maxVisibleImages) {
            const countBadge = document.createElement('div');
            countBadge.classList.add('image-count-badge');
            countBadge.textContent = totalQuantity > maxVisibleImages ? `${totalQuantity}` : `${productImages.length}`;
            stepBox.appendChild(countBadge);
          }
          
          stepBox.appendChild(imagesContainer);
        }
      } else {
        // If no product is selected for this step, show plus icon
        const plusIcon = document.createElement('span');
        plusIcon.classList.add('plus-icon');
        plusIcon.textContent = '+';
        stepBox.appendChild(plusIcon);
      }

      // Add step name with optional step numbers
      const stepName = document.createElement('p');
      stepName.classList.add('step-name');
      if (widgetConfig.showStepNumbers) {
        stepName.textContent = `${index + 1}. ${step.name || `Step ${index + 1}`}`;
      } else {
        stepName.textContent = step.name || `Step ${index + 1}`;
      }
      stepBox.appendChild(stepName);

      // Attach click listener to open modal for this step
      stepBox.addEventListener('click', () => openBundleModal(index));
      bundleStepsContainer.appendChild(stepBox);
    });
  }

  // Initial rendering of bundle content based on selectedBundle (if any)
  if (selectedBundle) {
    // Render bundle header conditionally based on settings
    if (widgetConfig.showTitle && bundleHeader) {
      bundleHeader.innerHTML = `
        <h2 class="bundle-title">${selectedBundle.name || ''}</h2>
      `;
      bundleHeader.style.display = 'block';
    } else if (bundleHeader) {
      bundleHeader.style.display = 'none';
    }

    // Render bundle includes (if any and data exists)
    if (selectedBundle.includes && Array.isArray(selectedBundle.includes) && selectedBundle.includes.length > 0) {
      bundleIncludesContainer.innerHTML = ''; // Clear existing content
      selectedBundle.includes.forEach(item => {
        const includeItem = document.createElement('div');
        includeItem.classList.add('include-item');

        const img = document.createElement('img');
        img.src = item.imageUrl || '';
        img.alt = item.name || '';

        const p = document.createElement('p');
        p.textContent = item.name || '';

        includeItem.appendChild(img);
        includeItem.appendChild(p);
        bundleIncludesContainer.appendChild(includeItem);
      });
    } else {
      bundleIncludesContainer.innerHTML = ''; // Ensure it's empty if no includes
    }
    
    // Initial rendering of main bundle steps
    updateMainBundleStepsDisplay();
    updateAddToCartButton(); // Initial update of the add to cart button
    updateFooterDiscountMessaging(); // Initial update of footer discount messaging
    updateModalFooterDiscountMessaging(); // Initial update of modal footer messaging

  } else {
    // No bundle found for this product, hide the entire container
    containerElement.style.display = 'none';
  }

  // Event Listeners for the modal controls
  console.log('🔍 [MODAL DEBUG] Attaching event listeners...');

  if (closeButton) {
    closeButton.addEventListener('click', closeBundleModal);
    console.log('✅ [MODAL DEBUG] Close button listener attached');
  } else {
    console.error('❌ [MODAL DEBUG] Close button not found!');
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeBundleModal);
    console.log('✅ [MODAL DEBUG] Modal overlay listener attached');
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      console.log('🔍 [MODAL DEBUG] Prev button clicked');
      if (currentActiveStepIndex > 0 && validateCurrentStep()) {
        currentActiveStepIndex--;
        renderModalContent();
      } else if (currentActiveStepIndex > 0 && !validateCurrentStep()) {
        showToast('Please meet the quantity conditions for the current step before going back.', 'warning');
      }
    });
    console.log('✅ [MODAL DEBUG] Prev button listener attached');
  } else {
    console.error('❌ [MODAL DEBUG] Prev button not found!');
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      console.log('🔍 [MODAL DEBUG] Next button clicked');
    if (validateCurrentStep()) {
      if (currentActiveStepIndex < selectedBundle.steps.length - 1) {
        currentActiveStepIndex++;
        renderModalContent();
      } else {
        // Last step and valid, close the modal
        closeBundleModal();
      }
    } else {
      showToast('Please meet the quantity conditions for the current step before proceeding.', 'warning');
    }
    });
    console.log('✅ [MODAL DEBUG] Next button listener attached');
  } else {
    console.error('❌ [MODAL DEBUG] Next button not found!');
  }

  // Helper function to generate a unique bundle instance ID
  // This ensures same bundle + same products = same ID (qty increments)
  // and same bundle + different products = different ID (separate line item)
  function generateBundleInstanceId(bundleId, itemsToAdd) {
    // Create a deterministic hash from the bundle configuration
    // Sort items by variant ID to ensure consistent ordering
    const sortedItems = [...itemsToAdd].sort((a, b) => a.id - b.id);

    // Create a string representation: bundleId + variantId:quantity pairs
    const itemsSignature = sortedItems
      .map(item => `${item.id}:${item.quantity}`)
      .join('|');

    // Simple hash function (you can use a more sophisticated one if needed)
    let hash = 0;
    const str = `${bundleId}_${itemsSignature}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Return bundle ID with hash suffix
    return `${bundleId}_${Math.abs(hash)}`;
  }

  // Add to Cart Button Logic
  addBundleToCartButton.addEventListener('click', async () => {
    const itemsToAdd = [];
    selectedProductsQuantities.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductDataCache[stepIndex];
      for (const key in stepSelections) {
        const quantity = stepSelections[key];
        if (quantity <= 0) continue;

        // Look up product object by matching key against variantId or id
        const productObj = productsInStep.find(p => (p.variantId || p.id) === key);

        let variantIdForCart = key; // default
        if (productObj) {
          variantIdForCart = productObj.variantId || productObj.id;
        }

        // Ensure numeric
        const variantIdStr = (variantIdForCart || '').toString().split('/').pop();
        const variantIdNum = Number(variantIdStr);
        if (!isNaN(variantIdNum)) {
          itemsToAdd.push({
            id: variantIdNum,
            quantity,
            // Properties will be added after we generate the bundle instance ID
          });
        }
      }
    });

    // Generate unique bundle instance ID based on bundle + selected products
    const bundleInstanceId = generateBundleInstanceId(
      selectedBundle ? selectedBundle.id : 'unknown',
      itemsToAdd
    );

    // Now add properties with the unique bundle instance ID to all items
    itemsToAdd.forEach(item => {
      item.properties = {
        _wolfpack_bundle_id: bundleInstanceId
      };
    });

    console.log('🎯 [BUNDLE CART] Bundle Instance ID:', bundleInstanceId);
    console.log('🎯 [BUNDLE CART] Items to add:', itemsToAdd);
    console.log('📦 [BUNDLE CART] This ID ensures:');
    console.log('  ✅ Same bundle + same products = Shopify auto-increments quantity');
    console.log('  ✅ Same bundle + different products = Creates separate cart line');

    if (itemsToAdd.length === 0) {
      showToast('Please select products for your bundle before adding to cart.', 'warning');
      return;
    }

    // Validate all steps are completed before adding to cart
    const allStepsValid = selectedBundle.steps.every((_, index) => {
        // Temporarily set active step to validate it
        currentActiveStepIndex = index;
        return validateCurrentStep();
    });
    // Reset to original active step if needed, though closing modal might reset it anyway
    // For this context, it's fine as we are about to redirect.

    if (!allStepsValid) {
        showToast('Please complete all bundle steps before adding to cart.', 'warning');
        return;
    }

    try {
      // Show a loading state or disable button to prevent multiple clicks
      addBundleToCartButton.disabled = true;
      addBundleToCartButton.textContent = 'Adding to Cart...';

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsToAdd })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Products added to cart:', data);
        window.location.href = '/cart'; // Redirect to cart page
      } else {
        console.error('Error adding products to cart:', data);
        showToast(`Failed to add bundle to cart: ${data.message || 'Unknown error'}`, 'error');
        addBundleToCartButton.disabled = false; // Re-enable button on error
        updateAddToCartButton(); // Restore original button text
      }
    } catch (error) {
      console.error('Network or unexpected error adding to cart:', error);
      showToast('An error occurred while adding the bundle to your cart. Please try again.', 'error');
      addBundleToCartButton.disabled = false; // Re-enable button on error
      updateAddToCartButton(); // Restore original button text
    }
  });

  function initializeBundleBuilder() {
    if (!selectedBundle) {
      console.log('❌ [WIDGET] No bundle selected, widget not available for this product');
      console.log('🔍 [WIDGET] Debug info:', {
        bundlesEvaluated: bundlesArray.length,
        currentProductId,
        currentProductCollections: currentProductCollections?.map(c => c.id),
        widgetConfigBundleId: widgetConfig.bundleId,
        containerBundleId: widgetConfig.containerBundleId,
        isContainerProduct: widgetConfig.isContainerProduct
      });

      // Show comprehensive diagnostic message
      containerElement.innerHTML = `
        <div style="background: #e7f3ff; border: 2px solid #007ace; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
          <h3 style="color: #007ace; margin-bottom: 15px;">🎁 Bundle Widget</h3>
          <p style="color: #495057; margin-bottom: 15px;">
            ${bundlesArray.length === 0 ?
              'No bundles found for this shop. Create and publish bundles in the admin to see them here.' :
              'No bundle configured for this product. This widget will show bundles when properly configured.'
            }
          </p>

          ${bundlesArray.length > 0 ? `
            <details style="text-align: left; margin-top: 20px;">
              <summary style="cursor: pointer; color: #007ace; font-weight: 600;">Available Bundles (${bundlesArray.length})</summary>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                ${bundlesArray.map(bundle => `
                  <div style="border-bottom: 1px solid #dee2e6; padding: 8px 0;">
                    <strong>${bundle.name || 'Unnamed Bundle'}</strong><br>
                    <small style="color: #6c757d;">
                      ID: ${bundle.id} | Type: ${bundle.bundleType} | Status: ${bundle.status}
                      ${bundle.shopifyProductId ? ` | Product: ${bundle.shopifyProductId}` : ''}
                    </small>
                  </div>
                `).join('')}
              </div>
            </details>
          ` : ''}

          <details style="text-align: left; margin-top: 15px;">
            <summary style="cursor: pointer; color: #6c757d;">Technical Debug Info</summary>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 11px; margin-top: 10px; overflow-x: auto; text-align: left;">
Current Product ID: ${currentProductId}
Container Product: ${widgetConfig.isContainerProduct}
Container Bundle ID: ${widgetConfig.containerBundleId || 'None'}
Manual Bundle ID: ${widgetConfig.bundleId || 'None'}
Total Bundles Available: ${bundlesArray.length}
Product Collections: ${currentProductCollections?.map(c => c.id).join(', ') || 'None'}

Widget Configuration:
${JSON.stringify(widgetConfig, null, 2)}
            </pre>
          </details>

          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <small style="color: #6c757d;">
              💡 <strong>For merchants:</strong> Configure bundles in your admin panel, then add this widget to your product pages.
            </small>
          </div>
        </div>
      `;
      return;
    }
    
    console.log('🎉 [WIDGET] Bundle selected successfully:', selectedBundle.name);
    console.log('📋 [WIDGET] Bundle details:', {
      id: selectedBundle.id,
      name: selectedBundle.name,
      type: selectedBundle.bundleType,
      stepsCount: selectedBundle.steps?.length || 0,
      pricingEnabled: selectedBundle.pricing?.enabled || false
    });
    containerElement.style.display = 'block';

    // Initial setup
    updateMainBundleStepsDisplay();
    updateAddToCartButton();
    updateNavigationButtons();
    updateFooterDiscountMessaging();
  }

  // Enhanced bundle product page management
  function manageBundleProductPage() {
    if (selectedBundle) {
      // This is a bundle product - hide standard product interface
      hideStandardProductInterface();
      // Show bundle-specific elements
      enhanceBundleProductDisplay();
      // Initialize bundle builder
      initializeBundleBuilder();
    } else {
      // Not a bundle product - ensure standard interface is visible
      showStandardProductInterface();
    }
  }

  function hideStandardProductInterface() {
    console.log('🎯 [BUNDLE_PAGE] Hiding standard product interface for bundle product');

    // Common selectors for standard product elements to hide
    const standardProductSelectors = [
      // Add to cart buttons
      '.product-form__cart-submit',
      '.product-form__buttons button[name="add"]',
      '.btn.product-form__cart-submit',
      'button[name="add"]:not(.bundle-add-to-cart)',
      '[data-testid="add-to-cart-button"]',

      // Quantity selectors (unless bundle)
      '.product-form__quantity:not(.bundle-quantity)',
      '.quantity-selector:not(.bundle-quantity)',

      // Variant selectors (unless bundle)
      '.product-form__variants:not(.bundle-variants)',
      '.variant-selector:not(.bundle-variants)',

      // Buy now buttons
      '.shopify-payment-button',
      '.dynamic-checkout__content',

      // Price elements (we'll show bundle price instead)
      '.product__price:not(.bundle-price)',
      '.price:not(.bundle-price)',
      '.product-price:not(.bundle-price)'
    ];

    standardProductSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.hasAttribute('data-hidden-by-bundle')) {
          element.style.display = 'none';
          element.setAttribute('data-hidden-by-bundle', 'true');
          element.setAttribute('data-original-display', element.style.display || 'block');
          console.log(`🔒 [BUNDLE_PAGE] Hidden element: ${selector}`);
        }
      });
    });

    // Add bundle product page class to body for CSS targeting
    document.body.classList.add('bundle-product-page');

    // Hide product form if it doesn't contain bundle widget
    const productForms = document.querySelectorAll('.product-form, form[action*="/cart/add"]');
    productForms.forEach(form => {
      if (!form.querySelector('#bundle-builder-app, [id^="bundle-builder-app"]')) {
        if (!form.hasAttribute('data-hidden-by-bundle')) {
          form.style.display = 'none';
          form.setAttribute('data-hidden-by-bundle', 'true');
          console.log('🔒 [BUNDLE_PAGE] Hidden product form without bundle widget');
        }
      }
    });
  }

  function showStandardProductInterface() {
    console.log('👁️ [BUNDLE_PAGE] Restoring standard product interface');

    // Restore hidden elements
    const hiddenElements = document.querySelectorAll('[data-hidden-by-bundle="true"]');
    hiddenElements.forEach(element => {
      const originalDisplay = element.getAttribute('data-original-display') || 'block';
      element.style.display = originalDisplay;
      element.removeAttribute('data-hidden-by-bundle');
      element.removeAttribute('data-original-display');
    });

    // Remove bundle product page class
    document.body.classList.remove('bundle-product-page');
  }

  function enhanceBundleProductDisplay() {
    console.log('✨ [BUNDLE_PAGE] Enhancing bundle product display');

    // Add bundle-specific CSS classes
    const productMain = document.querySelector('.product, .product-single, .product-page, main');
    if (productMain) {
      productMain.classList.add('bundle-product-main');
    }

    // Enhanced product title for bundles
    const productTitle = document.querySelector('.product__title, .product-title, h1');
    if (productTitle && selectedBundle) {
      // Store original title
      if (!productTitle.hasAttribute('data-original-title')) {
        productTitle.setAttribute('data-original-title', productTitle.textContent.trim());
      }

      // Update with bundle title
      productTitle.innerHTML = `
        <span class="bundle-badge">Bundle</span>
        ${selectedBundle.name || productTitle.getAttribute('data-original-title')}
      `;
      productTitle.classList.add('bundle-product-title');
    }

    // Add bundle description if available
    const productDescription = document.querySelector('.product__description, .product-description');
    if (productDescription && selectedBundle && selectedBundle.description) {
      const bundleDesc = document.createElement('div');
      bundleDesc.className = 'bundle-product-description';
      bundleDesc.innerHTML = `
        <h3>Bundle Includes:</h3>
        <p>${selectedBundle.description}</p>
        <p><strong>Configure your bundle below:</strong></p>
      `;
      productDescription.insertBefore(bundleDesc, productDescription.firstChild);
    }

    // Inject bundle-specific CSS
    injectBundleProductCSS();
  }

  function injectBundleProductCSS() {
    if (!document.getElementById('bundle-product-styles')) {
      const styles = document.createElement('style');
      styles.id = 'bundle-product-styles';
      styles.textContent = `
        /* Bundle Product Page Styles */
        .bundle-product-page .bundle-widget-container {
          background: #f8f9fa;
          border: 2px solid #007ace;
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
        }

        .bundle-badge {
          display: inline-block;
          background: linear-gradient(135deg, #007ace, #0056b3);
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 4px;
          margin-right: 8px;
          vertical-align: middle;
        }

        .bundle-product-title {
          color: #007ace !important;
          font-weight: bold;
        }

        .bundle-product-description {
          background: #e3f2fd;
          border-left: 4px solid #007ace;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }

        .bundle-product-description h3 {
          margin: 0 0 8px 0;
          color: #007ace;
          font-size: 18px;
        }

        .bundle-product-main {
          position: relative;
        }

        /* Make bundle widget more prominent */
        .bundle-product-page #bundle-builder-app {
          box-shadow: 0 4px 12px rgba(0, 122, 206, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        /* Hide elements that might still show through */
        .bundle-product-page .product-form__cart-submit,
        .bundle-product-page .shopify-payment-button,
        .bundle-product-page button[name="add"]:not(.bundle-add-to-cart) {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Execute bundle product page management
  manageBundleProductPage();

  // Mark container as initialized to prevent duplicates
  containerElement.dataset.initialized = 'true';
}


// Function to reinitialize all widgets (for theme editor real-time updates)
function reinitializeAllBundleWidgets() {
  const allBundleContainers = document.querySelectorAll('[id^="bundle-builder-app"]');
  
  if (allBundleContainers.length === 0) {
    const singleContainer = document.getElementById('bundle-builder-app');
    if (singleContainer) {
      initializeBundleWidget(singleContainer);
    }
  } else {
    allBundleContainers.forEach((container) => {
      initializeBundleWidget(container);
    });
  }
}

// Handle automatic bundle ID configuration from URL parameters (theme editor deep linking)
function handleAutomaticBundleConfiguration() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('bundleId');

  if (bundleId && (window.isThemeEditorContext || window.parent !== window)) {
    console.log(`🎯 [WIDGET] Theme editor detected bundle ID parameter: ${bundleId}`);

    // Find bundle widget containers and configure them
    const bundleContainers = document.querySelectorAll('[id^="bundle-builder-app"]');
    bundleContainers.forEach(container => {
      const bundleIdInput = container.querySelector('input[name="bundle_id"]');
      if (bundleIdInput) {
        bundleIdInput.value = bundleId;
        console.log(`✅ [WIDGET] Automatically configured bundle ID: ${bundleId}`);

        // Show confirmation toast
        showToast(`Bundle widget configured with ID: ${bundleId}`, 'info', 6000);
      }
    });

    // Also try to set it in Shopify section settings if available
    if (window.Shopify && window.Shopify.designMode) {
      console.log(`🔧 [WIDGET] Shopify design mode detected, attempting to set bundle_id setting`);
      // The bundle_id will be automatically configured through the theme editor interface
    }
  }
}

// Initialize all bundle widgets on page load
document.addEventListener('DOMContentLoaded', () => {
  // Handle automatic configuration first
  handleAutomaticBundleConfiguration();

  // Initialize widgets
  reinitializeAllBundleWidgets();

  // Listen for theme editor changes (Shopify theme editor specific)
  if (window.isThemeEditorContext || window.parent !== window) {
    // Watch for changes to bundle widget containers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.target.classList && 
            mutation.target.classList.contains('bundle-widget-container')) {
          // Re-initialize when container attributes change
          setTimeout(() => reinitializeAllBundleWidgets(), 100);
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-show-title', 'data-show-step-numbers', 'data-show-footer-messaging', 'style']
    });
    
    // Also listen for Shopify theme editor events
    document.addEventListener('shopify:section:load', reinitializeAllBundleWidgets);
    document.addEventListener('shopify:section:select', reinitializeAllBundleWidgets);
    document.addEventListener('shopify:section:deselect', reinitializeAllBundleWidgets);
    document.addEventListener('shopify:block:select', reinitializeAllBundleWidgets);
    document.addEventListener('shopify:block:deselect', reinitializeAllBundleWidgets);
  }
});

// Also initialize immediately if DOM is already loaded (for dynamically loaded scripts)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Bundle Widget] DOM already loaded, initializing immediately');
  handleAutomaticBundleConfiguration();
  reinitializeAllBundleWidgets();
} 