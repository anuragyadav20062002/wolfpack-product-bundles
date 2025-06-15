// Function to render bundle steps dynamically
function renderBundleSteps(numberOfSteps) {
  const bundleStepsContainer = document.querySelector('.bundle-steps');
  bundleStepsContainer.innerHTML = ''; // Clear existing steps

  for (let i = 0; i < numberOfSteps; i++) {
    const stepBox = document.createElement('div');
    stepBox.classList.add('step-box');

    const plusIcon = document.createElement('span');
    plusIcon.classList.add('plus-icon');
    plusIcon.textContent = '+';

    const stepName = document.createElement('p');
    stepName.classList.add('step-name');
    stepName.textContent = `Select ${i === 0 ? 'First' : i === 1 ? 'Second' : 'Third'} Shade`; // Hardcoded for 3 steps

    stepBox.appendChild(plusIcon);
    stepBox.appendChild(stepName);
    bundleStepsContainer.appendChild(stepBox);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const allBundlesDataRaw = window.allBundlesData;
  const currentProductId = window.currentProductId;
  const currentProductHandle = window.currentProductHandle;
  const currentProductCollections = window.currentProductCollections; // Access the new variable

  if (!allBundlesDataRaw || !currentProductId) {
    console.warn('Bundle data or current product ID not available. Make sure bundles are published and the product context is available.');
    return;
  }

  let bundles = allBundlesDataRaw; // allBundlesDataRaw is already a JS object
  
  let selectedBundle = null;

  // Convert bundles object to an array for easier iteration and filter out null/undefined entries
  const bundlesArray = Object.values(bundles).filter(bundle => bundle !== null && bundle !== undefined);

  // Helper function to calculate discounted price
  function calculateDiscountedPrice(originalPrice, pricing) {
    if (!pricing || !pricing.status || !pricing.rules || pricing.rules.length === 0) {
      return {
        price: originalPrice,
        compareAtPrice: null
      }; // No discount enabled or no rules
    }

    const rule = pricing.rules[0]; // Assuming only one rule for simplicity based on current UI
    const value = parseFloat(rule.value);
    const currentPrice = parseFloat(originalPrice);

    let discountedPrice = currentPrice;
    let compareAtPrice = originalPrice;

    if (isNaN(currentPrice) || isNaN(value)) {
      return {
        price: originalPrice,
        compareAtPrice: null
      }; // Invalid numbers
    }

    switch (pricing.type) {
      case 'fixed_amount_off':
        discountedPrice = currentPrice - value;
        break;
      case 'percentage_off':
        discountedPrice = currentPrice * (1 - (value / 100));
        break;
      case 'fixed_price_only':
        discountedPrice = value;
        compareAtPrice = originalPrice; // Original price becomes compare-at price
        break;
      default:
        return {
          price: originalPrice,
          compareAtPrice: null
        };
    }

    // Ensure price doesn't go below zero
    discountedPrice = Math.max(0, discountedPrice);

    return {
      price: discountedPrice.toFixed(2),
      compareAtPrice: (compareAtPrice && discountedPrice !== currentPrice) ? currentPrice.toFixed(2) : null
    };
  }

  for (const bundle of bundlesArray) {
    if (bundle && bundle.status === 'published') {
      let parsedMatching = null;
      if (bundle.matching && typeof bundle.matching === 'string') {
        try {
          parsedMatching = JSON.parse(bundle.matching);
        } catch (e) {
          console.error('Failed to parse bundle.matching for bundle ID:', bundle.id, e);
          continue; // Skip this bundle if matching data is corrupt
        }
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
        selectedBundle = bundle; // We'll use the raw bundle object, which contains `steps` etc. directly.
        selectedBundle.parsedMatching = parsedMatching; // Attach parsed matching for future use
        break; // Found a matching bundle, take the first one
      }
    }
  }

  const appContainer = document.getElementById('bundle-builder-app');
  if (!appContainer) {
    console.error('Bundle builder app container not found.');
    return;
  }

  // Get references to existing bundle display elements
  const bundleHeader = appContainer.querySelector('.bundle-header');
  const bundleStepsContainer = appContainer.querySelector('.bundle-steps');
  const bundleIncludesContainer = appContainer.querySelector('.bundle-includes');
  const addBundleToCartButton = appContainer.querySelector('.add-bundle-to-cart');

  // Get references to modal elements
  const bundleBuilderModal = document.getElementById('bundle-builder-modal');
  const modalOverlay = bundleBuilderModal.querySelector('.modal-overlay');
  const closeButton = bundleBuilderModal.querySelector('.close-button');
  const modalTabsContainer = bundleBuilderModal.querySelector('.modal-tabs');
  const productGridContainer = bundleBuilderModal.querySelector('.product-grid');
  const prevButton = bundleBuilderModal.querySelector('.prev-button');
  const nextButton = bundleBuilderModal.querySelector('.next-button');

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

    // Apply bundle-level discount if enabled
    if (selectedBundle && selectedBundle.pricing && selectedBundle.pricing.status) {
      const discounted = calculateDiscountedPrice(totalRawPrice, selectedBundle.pricing);
      return parseFloat(discounted.price);
    }
    return totalRawPrice;
  }

  // Function to update the Add to Cart button text with calculated price
  function updateAddToCartButton() {
    if (addBundleToCartButton) {
      const totalBundlePrice = calculateBundleTotalPrice();
      const formattedPrice = `$${totalBundlePrice.toFixed(2)}`;
      addBundleToCartButton.textContent = `Add Bundle to Cart • ${formattedPrice}`;
    }
  }

  // Function to open the modal
  function openBundleModal(stepIndex) {
    currentActiveStepIndex = stepIndex;
    bundleBuilderModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background content
    renderModalContent();
  }

  // Function to close the modal
  function closeBundleModal() {
    bundleBuilderModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    updateMainBundleStepsDisplay(); // Update the main display on close
    updateAddToCartButton(); // Update the button price after modal closes
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

    selectedBundle.steps.forEach((step, index) => {
      const tab = document.createElement('div');
      tab.classList.add('modal-tab');
      // Add a checkmark if this step has valid selections (optional, for visual feedback)
      const stepTotalQuantity = Object.values(selectedProductsQuantities[index]).reduce((sum, qty) => sum + qty, 0);
      const currentStep = selectedBundle.steps[index];
      let isStepCompleted = false;
      if (currentStep.conditionType && currentStep.conditionValue !== null) {
        const requiredQuantity = currentStep.conditionValue;
        switch (currentStep.conditionType) {
          case 'equal_to':
            isStepCompleted = stepTotalQuantity === requiredQuantity;
            break;
          case 'at_most':
            isStepCompleted = stepTotalQuantity <= requiredQuantity;
            break;
          case 'at_least':
            isStepCompleted = stepTotalQuantity >= requiredQuantity;
            break;
        }
      }
      // If no condition, consider it completed if at least one product is selected
      else if (Object.keys(selectedProductsQuantities[index]).length > 0) {
        isStepCompleted = true;
      }

      if (isStepCompleted && currentActiveStepIndex !== index) { // Don't show checkmark on active tab
        tab.innerHTML = `${step.name || `Step ${index + 1}`} &#10003;`; // Unicode checkmark
        tab.style.color = 'green'; // Optional: highlight completed tabs
      } else {
        tab.textContent = step.name || `Step ${index + 1}`;
      }

      if (index === currentActiveStepIndex) {
        tab.classList.add('active');
      }
      tab.dataset.stepIndex = index.toString();
      tab.addEventListener('click', () => {
        // Only allow switching tabs if current step is valid or it's the current tab
        if (validateCurrentStep() || index === currentActiveStepIndex) {
          currentActiveStepIndex = index;
          renderModalContent();
        } else {
          alert('Please meet the quantity conditions for the current step before moving to another tab.');
        }
      });
      modalTabsContainer.appendChild(tab);
    });
  }

  // Function to render current step name and quantity info
  function renderCurrentStepInfo() {
    const modalHeader = bundleBuilderModal.querySelector('.modal-header');
    let currentStepInfoContainer = modalHeader.querySelector('.modal-current-step-info');

    if (!currentStepInfoContainer) {
      currentStepInfoContainer = document.createElement('div');
      currentStepInfoContainer.classList.add('modal-current-step-info');
      // Insert after tabs, but before the rest of the modal-body
      const modalTabs = modalHeader.querySelector('.modal-tabs');
      modalHeader.insertBefore(currentStepInfoContainer, modalTabs.nextSibling);
    }

    const currentStep = selectedBundle.steps[currentActiveStepIndex];
    if (!currentStep) {
      currentStepInfoContainer.innerHTML = '';
      return;
    }

    let quantityText = '';
    if (currentStep.conditionType && currentStep.conditionValue !== null) {
      const requiredQuantity = currentStep.conditionValue;
      switch (currentStep.conditionType) {
        case 'equal_to':
          quantityText = `Add ${requiredQuantity} product(s)`;
          break;
        case 'at_most':
          quantityText = `Add at most ${requiredQuantity} product(s)`;
          break;
        case 'at_least':
          quantityText = `Add at least ${requiredQuantity} product(s)`;
          break;
      }
    } else {
      // Default message if no specific condition is set
      quantityText = 'Select product(s)';
    }

    // Combine with bundle price (assuming bundle.price is the base price)
    const priceInfo = selectedBundle.price ? ` to get the bundle at $${selectedBundle.price}` : '';

    currentStepInfoContainer.innerHTML = `
      <!-- <h3>${currentStep.name || `Select ${currentActiveStepIndex + 1} Shade`}</h3> -->
      <p>${quantityText}${priceInfo}</p>
    `;
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
      if (currentStep.products && Array.isArray(currentStep.products) && currentStep.products.length > 0) {
        productsToDisplay = currentStep.products.flatMap(p => {
          // If displayVariantsAsIndividual is true, expand into multiple cards for each variant
          if (currentStep.displayVariantsAsIndividual && p.variants && p.variants.length > 0) {
            return p.variants.map(variant => ({
              id: variant.id.split('/').pop(), // Use variant ID for selection/quantity tracking
              title: `${p.title} - ${variant.title}`,
              imageUrl: p.images && p.images.length > 0 ? p.images[0].originalSrc : 'https://via.placeholder.com/150',
              price: parseFloat(variant.price || '0'), // Store variant price
              variantId: variant.id.split('/').pop() // Explicitly store variantId for cart addition
            }));
          } else {
            // Otherwise, just use the first variant's details or product details
            const defaultVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            return [{
              id: defaultVariant ? defaultVariant.id.split('/').pop() : p.id.split('/').pop(), // Use variant ID if available, else product ID
              title: p.title,
              imageUrl: p.images && p.images.length > 0 ? p.images[0].originalSrc : 'https://via.placeholder.com/150',
              price: defaultVariant ? parseFloat(defaultVariant.price || '0') : 0, // Store price
              variantId: defaultVariant ? defaultVariant.id.split('/').pop() : null // Store variantId
            }];
          }
        });
      } else if (currentStep.collections && Array.isArray(currentStep.collections) && currentStep.collections.length > 0) {
        // This part would ideally fetch products belonging to the selected collections.
        // For now, we will not fetch prices for collections directly, assuming they are mostly for visibility.
        // If collection products need prices, a more complex fetch would be required.
        console.warn('Dynamic product fetching from collections for modal display is not implemented with price/variant info.');
        productsToDisplay = [];
      }
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
      productCard.dataset.productId = product.id;

      const currentQuantity = selectedProductsQuantities[stepIndex][product.id] || 0;

      if (currentQuantity > 0) {
        productCard.classList.add('selected');
      }

      productCard.innerHTML = `
        <div class="image-wrapper">
          <img src="${product.imageUrl}" alt="${product.title}">
        </div>
        <p class="product-title">${product.title}</p>
        ${currentQuantity > 0 ? `<div class="selected-overlay">${currentQuantity}</div>` : ''}
        <div class="quantity-controls">
          <button class="quantity-control-button decrease-quantity" data-product-id="${product.id}">-</button>
          <span class="quantity-display">${currentQuantity}</span>
          <button class="quantity-control-button increase-quantity" data-product-id="${product.id}">+</button>
        </div>
      `;

      // Event listener for toggling selection (clicking anywhere on card except buttons)
      productCard.addEventListener('click', (event) => {
        if (!event.target.closest('.quantity-control-button')) {
          const productId = product.id;
          const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
          // If clicked and not selected, select with quantity 1. If selected, deselect (quantity 0).
          updateProductSelection(stepIndex, productId, currentQty > 0 ? 0 : 1);
        }
      });

      // Event listeners for quantity buttons
      const increaseButton = productCard.querySelector('.increase-quantity');
      const decreaseButton = productCard.querySelector('.decrease-quantity');

      increaseButton.addEventListener('click', () => {
        const productId = product.id;
        const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
        updateProductSelection(stepIndex, productId, currentQty + 1);
      });

      decreaseButton.addEventListener('click', () => {
        const productId = product.id;
        const currentQty = selectedProductsQuantities[stepIndex][productId] || 0;
        if (currentQty > 0) {
          updateProductSelection(stepIndex, productId, currentQty - 1);
        }
      });

      productGridContainer.appendChild(productCard);
    });
  }

  // Function to update selected product quantities
  function updateProductSelection(stepIndex, productId, newQuantity) {
    if (!selectedProductsQuantities[stepIndex]) {
      selectedProductsQuantities[stepIndex] = {};
    }

    // Ensure quantities don't go below 0
    const quantity = Math.max(0, newQuantity);

    selectedProductsQuantities[stepIndex][productId] = quantity;

    if (quantity === 0) {
      delete selectedProductsQuantities[stepIndex][productId];
    }

    // Re-render the specific product card or the entire grid for simplicity
    renderProductGrid(stepIndex); // Re-render to update UI (selected class, quantity display)
    updateNavigationButtons(); // Update button state based on new selections
    renderModalTabs(); // Re-render tabs to update checkmarks
  }

  // Function to validate current step based on quantity rules
  function validateCurrentStep() {
    const currentStep = selectedBundle.steps[currentActiveStepIndex];
    const selectedProductsInCurrentStep = selectedProductsQuantities[currentActiveStepIndex];

    let totalQuantitySelected = 0;
    for (const prodId in selectedProductsInCurrentStep) {
      totalQuantitySelected += selectedProductsInCurrentStep[prodId];
    }

    if (currentStep.conditionType && currentStep.conditionValue !== null) {
      const requiredQuantity = currentStep.conditionValue;
      switch (currentStep.conditionType) {
        case 'equal_to':
          return totalQuantitySelected === requiredQuantity;
        case 'at_most':
          return totalQuantitySelected <= requiredQuantity;
        case 'at_least':
          return totalQuantitySelected >= requiredQuantity;
        default:
          return false; // Unknown condition type
      }
    }
    // If no explicit condition, consider it valid if at least one product is selected
    return totalQuantitySelected > 0;
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
    // Ensure these elements exist before trying to manipulate them
    const bundleStepsContainer = document.querySelector('.bundle-steps');
    if (!bundleStepsContainer) return; // Defensive check, should not be null now

    bundleStepsContainer.innerHTML = ''; // Clear existing steps

    if (!selectedBundle || !selectedBundle.steps) return;

    selectedBundle.steps.forEach((step, index) => {
        const stepBox = document.createElement('div');
        stepBox.classList.add('step-box');
      stepBox.dataset.stepIndex = index.toString();

      const selectedProductsInStep = selectedProductsQuantities[index];
      const selectedProductIds = Object.keys(selectedProductsInStep);

      // Display image of *any* one selected product, or the first one if multiple
      if (selectedProductIds.length > 0) {
        // Find the product image from cache or initial data using the first selected product ID
        const firstSelectedProductId = selectedProductIds[0];
        // The ID in selectedProductsQuantities is now the variant ID
        const product = stepProductDataCache[index].find(p => p.variantId === firstSelectedProductId);
        if (product && product.imageUrl) {
          const img = document.createElement('img');
          img.src = product.imageUrl;
          img.alt = product.title || '';
          img.classList.add('bundle-step-product-image');
          stepBox.appendChild(img);
        } else {
          // Fallback if image not found in cache (shouldn't happen if cached correctly)
          const plusIcon = document.createElement('span');
          plusIcon.classList.add('plus-icon');
          plusIcon.textContent = '+';
          stepBox.appendChild(plusIcon);
        }
      } else {
        // If no product is selected for this step, show plus icon
        const plusIcon = document.createElement('span');
        plusIcon.classList.add('plus-icon');
        plusIcon.textContent = '+';
        stepBox.appendChild(plusIcon);
      }

      // Attach click listener to open modal for this step
      stepBox.addEventListener('click', () => openBundleModal(index));
        bundleStepsContainer.appendChild(stepBox);
      });
    }

  // Initial rendering of bundle content based on selectedBundle (if any)
  if (selectedBundle) {
    // Render bundle header
    let displayPrice = selectedBundle.price || 'N/A';
    let displayComparePrice = selectedBundle.compareAtPrice || 'N/A';

    // Apply discount logic if enabled
    if (selectedBundle.pricing && selectedBundle.pricing.status) {
      const prices = calculateDiscountedPrice(selectedBundle.price, selectedBundle.pricing);
      displayPrice = prices.price;
      displayComparePrice = prices.compareAtPrice || selectedBundle.compareAtPrice;
    }

    bundleHeader.innerHTML = `
      <h2 class="bundle-title">${selectedBundle.name || ''}</h2>
      <div class="bundle-price">
        <span class="current-price">$${displayPrice}</span>
        ${displayComparePrice && displayComparePrice !== displayPrice ? `<span class="compare-price">$${displayComparePrice}</span>` : ''}
      </div>
    `;

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

  } else {
    // No bundle found for this product, hide the entire app container
    appContainer.style.display = 'none';
    console.log('No published bundle found for this product.');
  }

  // Event Listeners for the modal controls
  closeButton.addEventListener('click', closeBundleModal);
  modalOverlay.addEventListener('click', closeBundleModal);

  prevButton.addEventListener('click', () => {
    if (currentActiveStepIndex > 0 && validateCurrentStep()) {
      currentActiveStepIndex--;
      renderModalContent();
    } else if (currentActiveStepIndex > 0 && !validateCurrentStep()) {
      alert('Please meet the quantity conditions for the current step before going back.');
    }
  });

  nextButton.addEventListener('click', () => {
    if (validateCurrentStep()) {
      if (currentActiveStepIndex < selectedBundle.steps.length - 1) {
        currentActiveStepIndex++;
        renderModalContent();
      } else {
        // Last step and valid, close the modal
        closeBundleModal();
      }
    } else {
      alert('Please meet the quantity conditions for the current step before proceeding.');
    }
  });

  // Add to Cart Button Logic
  addBundleToCartButton.addEventListener('click', async () => {
    const itemsToAdd = [];
    selectedProductsQuantities.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductDataCache[stepIndex];
      for (const variantId in stepSelections) {
        const quantity = stepSelections[variantId];
        if (quantity > 0) {
          // Ensure the variantId is a number for Shopify's /cart/add.js endpoint
          itemsToAdd.push({
            id: parseInt(variantId), 
            quantity: quantity
          });
        }
      }
    });

    if (itemsToAdd.length === 0) {
      alert('Please select products for your bundle before adding to cart.');
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
        alert('Please complete all bundle steps before adding to cart.');
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
        alert(`Failed to add bundle to cart: ${data.message || 'Unknown error'}`);
        addBundleToCartButton.disabled = false; // Re-enable button on error
        updateAddToCartButton(); // Restore original button text
      }
    } catch (error) {
      console.error('Network or unexpected error adding to cart:', error);
      alert('An error occurred while adding the bundle to your cart. Please try again.');
      addBundleToCartButton.disabled = false; // Re-enable button on error
      updateAddToCartButton(); // Restore original button text
    }
  });

}); 