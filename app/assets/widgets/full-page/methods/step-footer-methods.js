import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { createBundleBannerElement, createStepBannerImageElement } from '../../shared/components/bundle-banners.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from '../../shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from '../../shared/engine/cart-lines.js';


export const fullPageStepFooterMethods = {
buildCartLineSourceProperties(selectedLines) {
  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
  const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;

  const sourceProperties = buildSharedCartLineSourceProperties({
    selectedLines,
    retailPrice: CurrencyManager.convertAndFormat(totalPrice, currencyInfo),
    discountAmount: discountAmount > 0
      ? CurrencyManager.convertAndFormat(discountAmount, currencyInfo)
      : '',
    discountPercentage,
  });
  const displayProperties = JSON.parse(sourceProperties._bundle_display_properties);

  return this.buildCartLineDisplayProperties(displayProperties);
},

buildCartLineDisplayProperties(displayProperties) {
  return buildSharedCartLineDisplayProperties(displayProperties, this.getCartLineLabels());
},

// Add bundle to cart
async addBundleToCart() {
  try {
    // Final validation: all paid steps must be satisfied.
    // Free gift and default steps are non-blocking and are intentionally skipped here —
    // the customer may choose not to select a free gift, and default items are pre-seeded.
    const allStepsValid = this.areBundleConditionsMet();
    if (!allStepsValid) {
      ToastManager.show('Please complete all bundle steps before adding to cart.');
      return;
    }
    // Build cart items from selected products
    const items = [];

    // Generate unique bundle instance ID for this add-to-cart action
    // This allows cart transform to group components and prevents Shopify from
    // consolidating separate bundle instances added at different times
    const bundleName = this.selectedBundle.name || 'Bundle';
    const sessionKey = this.generateBundleSessionKey();
    const offerId = this.resolveFullPageOfferId();
    const selectedLines = [];
    let itemNumber = 0;


    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);


      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          // Ensure we're using a numeric variant ID (extract from GID if needed)
          const numericVariantId = this.extractId(variantId) || variantId;
          const product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId))
            || { id: variantId, title: variantId };


          itemNumber += 1;
          const properties = {
            Box: String(itemNumber),
            '_bundleName': bundleName,
            '_easyBundle:prodQty': String(quantity),
            '_easyBundle:OfferId': `${offerId}_${sessionKey}_${itemNumber}`
          };
          const addonDiscount = this.getAddonLineDiscount(step);
          if (addonDiscount && step?.addonDisplayFree !== true) {
            properties['_bundle_step_type'] = addonDiscount
              ? `addon:${addonDiscount.type}:${addonDiscount.value}`
              : 'addon';
          } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
            properties['_bundle_step_type'] = 'free_gift';
          }
          if (step?.isDefault) properties['_bundle_step_type'] = 'default';

          const cartItem = {
            id: numericVariantId,
            quantity: quantity,
            properties
          };
          const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
          if (sellingPlanAllocationId) {
            cartItem.selling_plan = parseInt(sellingPlanAllocationId);
          }

          items.push(cartItem);
          selectedLines.push({ product, quantity });
        }
      });
    });

    if (items.length === 0) {
      ToastManager.show('Please select products before adding to cart');
      return;
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    items.forEach(item => {
      Object.assign(item.properties, sourceProperties);
    });
    // Disable the Add to Cart button and show loading overlay
    const nextBtn = this.container.querySelector('.footer-btn-next');
    if (nextBtn) nextBtn.disabled = true;
    this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

    try {
      // Add to Shopify cart
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const result = await response.json();

      await this.syncBundleDetailsCartMetafield(`${offerId}_${sessionKey}`, sourceProperties);

      // Storefront analytics: bundle successfully added to cart.
      this._emitStorefrontEvent('bundle-add-to-cart-success', { itemCount: items.length, lineCount: selectedLines.length });

      // Show success message
      ToastManager.show('Bundle added to cart successfully!');
      this._handlePostAddToCartAction(this._getLandingPageControls()?.checkout);

    } catch (fetchError) {
      this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'fetch-error', message: String(fetchError && fetchError.message || fetchError) });
      ToastManager.show('Failed to add bundle to cart. Please try again.');
    } finally {
      this.hideLoadingOverlay();
      if (nextBtn) nextBtn.disabled = false;
    }

  } catch (error) {
    this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'validation-error', message: String(error && error.message || error) });
    ToastManager.show('Failed to add bundle to cart. Please try again.');
  }
},

createStepElement(step, index) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box';
  stepBox.dataset.stepIndex = index;

  const selectedProducts = this.selectedProducts[index] || {};
  const hasSelections = Object.values(selectedProducts).some(qty => qty > 0);

  if (hasSelections) {
    stepBox.classList.add('step-completed');

    // Add close icon badge at top right to clear all selections
    const clearBadge = document.createElement('div');
    clearBadge.className = 'step-clear-badge';
    clearBadge.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
        <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    clearBadge.title = 'Remove all products from this step';
    clearBadge.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent opening modal
      this.clearStepSelections(index);
    });
    stepBox.appendChild(clearBadge);

    // Show product images if available
    const productImages = this.getStepProductImages(index);
    if (productImages.length > 0) {
      const imagesContainer = document.createElement('div');
      imagesContainer.className = 'step-images';

      productImages.slice(0, 4).forEach(imageData => {
        const img = document.createElement('img');
        img.src = imageData.url;
        img.alt = imageData.alt;
        img.className = 'step-image';
        imagesContainer.appendChild(img);
      });

      stepBox.appendChild(imagesContainer);

      // Add count badge if more than 4 products
      const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
      if (productImages.length > 4 || totalQuantity > 4) {
        const countBadge = document.createElement('div');
        countBadge.className = 'image-count-badge';
        countBadge.textContent = totalQuantity.toString();
        stepBox.appendChild(countBadge);
      }
    } else {
      // Fallback checkmark icon
      const checkIcon = document.createElement('span');
      checkIcon.className = 'check-icon';
      checkIcon.textContent = '✓';
      stepBox.appendChild(checkIcon);
    }
  } else {
    // Plus icon for empty steps
    const plusIcon = document.createElement('span');
    plusIcon.className = 'plus-icon';
    plusIcon.textContent = '+';
    stepBox.appendChild(plusIcon);
  }

  // Only show step name and selection count if no selections made
  if (!hasSelections) {
    // Add step name (without step number)
    const stepName = document.createElement('p');
    stepName.className = 'step-name';
    stepName.textContent = step.name || `Step ${index + 1}`;
    stepBox.appendChild(stepName);

    // Add selection count
    const selectionCount = document.createElement('div');
    selectionCount.className = 'step-selection-count';
    selectionCount.textContent = this.getStepSelectionText(selectedProducts);
    stepBox.appendChild(selectionCount);
  }

  // Add click handler
  stepBox.addEventListener('click', () => this.openModal(index));

  return stepBox;
},

getStepProductImages(stepIndex) {
  const selectedProducts = this.selectedProducts[stepIndex] || {};
  const productImages = [];

  Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
    if (quantity > 0) {
      const product = this.stepProductData[stepIndex].find(p => (p.variantId || p.id) === variantId);
      if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
        productImages.push({
          url: product.imageUrl,
          alt: product.title || ''
        });
      }
    }
  });

  return productImages;
},

getStepSelectionText(selectedProducts) {
  const totalSelected = Object.values(selectedProducts).reduce((sum, qty) => sum + (qty || 0), 0);
  return totalSelected > 0 ? `${totalSelected} selected` : '';
},

clearStepSelections(stepIndex) {
  // Clear all product selections for this step
  this.selectedProducts[stepIndex] = {};

  // Update UI
  this.renderSteps();
  this.updateFooterMessaging();

  // Show toast notification
  ToastManager.show(`All selections cleared from this step`);
},

renderFooter() {
  const bundleType = this.container.dataset.bundleType;

  // Full-page bundles: sidebar layout handles its own panel, skip bottom footer entirely
  if (bundleType === 'full_page') {
    const layout = this.resolveFullPageLayout();
    if (layout === 'footer_side') {
      // Sidebar layout — footer is hidden; side panel handles navigation
      if (this.elements.footer) {
        this.elements.footer.style.display = 'none';
      }
      return;
    }
    this.renderFullPageFooter();
    return;
  }

  // Product-page bundles use discount messaging footer
  if (!this.config.showFooterMessaging) {
    this.elements.footer.style.display = 'none';
    return;
  }

  this.updateFooterMessaging();
  this.elements.footer.style.display = 'block';
},

updateFooterMessaging() {
  // Check if discount is enabled before showing messaging
  if (!this.selectedBundle?.pricing?.enabled) {
    this.elements.footer.style.display = 'none';
    return;
  }

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    combinedDiscountInfo,
    currencyInfo
  );

  const footerDiscountText = this.elements.footer.querySelector('.footer-discount-text');

  if (combinedDiscountInfo.qualifiesForDiscount) {
    // Success message
    const successMessage = TemplateManager.replaceVariables(
      this.config.successMessageTemplate,
      variables
    );
    footerDiscountText.innerHTML = successMessage;
    this.elements.footer.classList.add('qualified');
  } else {
    // Progress message
    const progressMessage = TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
    footerDiscountText.innerHTML = progressMessage;
    this.elements.footer.classList.remove('qualified');
  }

  this._updateDiscountProgressBanner();
},

getDiscountProgressMilestones(totalPrice = 0, totalQuantity = 0) {
  const pricing = this.selectedBundle?.pricing;
  const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
  const tierTextByRuleId = pricing?.messages?.tierTextByRuleId || {};
  const boxRules = this.getBoxSelectionRules();

  return rules
    .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
    .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
    .map(rule => {
      const ruleId = String(rule.id || '');
      const threshold = Number(rule.conditionValue || 0) || 0;
      const tierText = tierTextByRuleId?.[ruleId] || {};
      const boxRule = boxRules.find(box => box.ruleId === ruleId);
      const discountMethod = pricing?.method || BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
      const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
      const fallbackTitle = rule.conditionType === 'quantity' && threshold > 0
        ? `${threshold} Pack`
        : String(threshold);
      let fallbackSubTitle = '';
      if (discountValue > 0) {
        if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF) {
          fallbackSubTitle = `Save ${Math.round(discountValue)}%`;
        } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF) {
          fallbackSubTitle = `Save ${CurrencyManager.convertAndFormat(discountValue, CurrencyManager.getCurrencyInfo())}`;
        }
      }
      const isReached = rule.conditionType === 'amount'
        ? Number(totalPrice || 0) >= threshold
        : Number(totalQuantity || 0) >= threshold;

      return {
        ruleId,
        title: tierText.tierText || boxRule?.boxLabel || fallbackTitle,
        subTitle: tierText.tierSubtext || boxRule?.boxSubtext || fallbackSubTitle,
        isReached,
      };
    })
    .filter(milestone => milestone.ruleId && milestone.title);
},

// Returns a .fpb-discount-progress fill-bar element, or null when pricing is disabled.
// Used by the FPB floating footer and the sidebar panel (gated by showDiscountProgressBar).
};
