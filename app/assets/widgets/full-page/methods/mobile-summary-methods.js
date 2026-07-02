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


export const fullPageMobileSummaryMethods = {
_populateCompactMobileSummaryTray(sheet) {
  sheet.innerHTML = '';

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
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
  const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
  const selectedFooterQuantity = this.getAllSelectedProductsData().reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  const countBadge = document.createElement('div');
  countBadge.className = 'fpb-mobile-summary-count-badge';
  countBadge.setAttribute('role', 'button');
  countBadge.setAttribute('tabindex', '0');
  countBadge.setAttribute('aria-label', 'Review your bundle');
  countBadge.setAttribute('aria-expanded', this.compactMobileSummaryTrayExpanded ? 'true' : 'false');
  countBadge.textContent = String(selectedFooterQuantity);
  countBadge.addEventListener('click', () => {
    this._toggleCompactMobileSummaryTray(sheet);
  });
  countBadge.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._toggleCompactMobileSummaryTray(sheet);
    }
  });
  sheet.appendChild(countBadge);

  sheet.classList.toggle('fpb-mobile-summary-tray-expanded', this.compactMobileSummaryTrayExpanded);
  this._syncCompactMobileSummaryScrollLock();
  sheet.classList.toggle(
    'fpb-mobile-summary-tray--slots',
    this.getFullPageDesignPreset() === 'STANDARD' && this._shouldRenderProductSlots()
  );
  sheet.classList.remove('fpb-mobile-summary-tray--has-discount-summary');

  if (this.selectedBundle?.pricing?.enabled) {
    const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
    const discountBlock = document.createElement('div');
    discountBlock.className = 'side-panel-discount-message';
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo
    );
    let discountMessage = '';
    if (combinedDiscountInfo.hasDiscount) {
      discountMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate || '🎉 You unlocked {{discountText}}!',
        variables
      );
    } else if (nextRule) {
      discountMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate || 'Add {conditionText} to get {discountText}',
        variables
      );
    }
    if (discountMessage) {
      const msgEl = document.createElement('div');
      msgEl.className = 'fpb-mobile-summary-discount-text';
      msgEl.innerHTML = discountMessage;
      discountBlock.appendChild(msgEl);
    }

    const shouldShowProgressBar = this.config.showDiscountProgressBar || usesCompactMobileSummaryTray;
    if (shouldShowProgressBar) {
      const progressBar = this._renderDiscountProgress({
        placement: "sidebar",
        combinedDiscountInfo,
        totalPrice,
        totalQuantity,
        unitPrices,
      });
      if (progressBar) {
        progressBar.classList.add('fpb-dp-sidebar');
        discountBlock.appendChild(progressBar);
      }
    }

    if (discountBlock.childElementCount > 0) {
      sheet.classList.add('fpb-mobile-summary-tray--has-discount-summary');
      sheet.appendChild(discountBlock);
    }
  }

  const navSection = document.createElement('div');
  navSection.className = 'side-panel-nav';
  const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
  const conditionlessMobile = this.bundleHasNoConditions();
  const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
  const actionButton = this._createMobileSummaryActionButton({
    finalPrice,
    currencyInfo,
    conditionlessMobile,
    hasSelectionMobile,
    isLastStep,
    isComplete: this.areBundleConditionsMet()
  });
  navSection.appendChild(actionButton);
  if (this.compactMobileSummaryTrayExpanded) {
    const productsSection = document.createElement('div');
    productsSection.className = 'fpb-mobile-summary-products-section';
    productsSection.appendChild(this._renderCompactMobileSummaryBundleItems(currencyInfo, totalQuantity));
    productsSection.appendChild(navSection);
    sheet.appendChild(productsSection);
  } else {
    sheet.appendChild(navSection);
  }
},

_toggleCompactMobileSummaryTray(sheet) {
  const nextExpanded = !this.compactMobileSummaryTrayExpanded;
  this.compactMobileSummaryTrayExpanded = nextExpanded;
  this._populateCompactMobileSummaryTray(sheet);
  this._syncCompactMobileSummaryScrollLock();

  sheet.classList.remove(
    'fpb-mobile-summary-tray-animating-open',
    'fpb-mobile-summary-tray-animating-closed'
  );
  sheet.classList.add(
    nextExpanded
      ? 'fpb-mobile-summary-tray-animating-open'
      : 'fpb-mobile-summary-tray-animating-closed'
  );

  if (this.compactMobileSummaryTrayAnimationTimeout) {
    clearTimeout(this.compactMobileSummaryTrayAnimationTimeout);
  }
  this.compactMobileSummaryTrayAnimationTimeout = setTimeout(() => {
    sheet.classList.remove(
      'fpb-mobile-summary-tray-animating-open',
      'fpb-mobile-summary-tray-animating-closed'
    );
  }, 380);
},

_syncCompactMobileSummaryScrollLock() {
  document.body.classList.toggle(
    'fpb-mobile-summary-scroll-locked',
    this.compactMobileSummaryTrayExpanded === true
  );
},

_renderCompactMobileSummaryBundleItems(currencyInfo, totalQuantity) {
  const allSelectedProducts = this.getAllSelectedProductsData();
  const activeStep = this.selectedBundle?.steps?.[this.currentStepIndex] || this.selectedBundle?.steps?.[0] || null;
  const summaryText = this.getBundleSummaryText();

  const bundleItems = document.createElement('div');
  bundleItems.className = 'fpb-mobile-summary-bundle-items';

  const header = document.createElement('div');
  header.className = 'fpb-mobile-summary-bundle-header';

  const headerCopy = document.createElement('div');
  headerCopy.className = 'fpb-mobile-summary-bundle-copy';
  const title = document.createElement('div');
  title.className = 'fpb-mobile-summary-bundle-title';
  title.textContent = summaryText.title;
  const subtitle = document.createElement('div');
  subtitle.className = 'fpb-mobile-summary-bundle-subtitle';
  subtitle.textContent = summaryText.subTitle;
  headerCopy.append(title, subtitle);
  header.appendChild(headerCopy);

  if (allSelectedProducts.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'fpb-mobile-summary-clear-btn';
    clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg><span>Clear</span>`;
    clearBtn.addEventListener('click', () => {
      this.showClearCartConfirmation();
    });
    header.appendChild(clearBtn);
  }
  bundleItems.appendChild(header);

  const productsList = document.createElement('div');
  productsList.className = 'fpb-mobile-summary-products-list';
  const shouldRenderStandardSlotTiles = this._shouldRenderProductSlots()
    && this.getFullPageDesignPreset() === 'STANDARD';

  if (shouldRenderStandardSlotTiles) {
    productsList.classList.add('fpb-mobile-summary-products-list--slots');
    this._renderCompactMobileSummarySlotTiles(productsList, allSelectedProducts, activeStep, totalQuantity);
    bundleItems.appendChild(productsList);
    return bundleItems;
  }

  allSelectedProducts.forEach(item => {
    const summaryTitle = this.getSummaryProductDisplayTitle(item);
    const variantInfo = this.getSummaryProductVariantDisplay(item);
    const row = document.createElement('div');
    row.className = 'fpb-mobile-summary-product-row';
    const imgSrc = this._getSelectedProductImageSrc(item);
    const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
    const priceText = CurrencyManager.convertAndFormat(
      isFreeGiftItem ? 0 : item.price * item.quantity,
      currencyInfo
    );

    row.innerHTML = `
      <div class="fpb-mobile-summary-product-image-wrap">
        ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="fpb-mobile-summary-product-image">` : '<div class="fpb-mobile-summary-product-image-placeholder"></div>'}
      </div>
      <div class="fpb-mobile-summary-product-info">
        <span class="fpb-mobile-summary-product-title">${this._escapeHTML(summaryTitle)}</span>
        ${variantInfo ? `<span class="fpb-mobile-summary-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
        <span class="fpb-mobile-summary-product-price">${priceText}</span>
      </div>
      <div class="fpb-mobile-summary-product-action">
        <span class="fpb-mobile-summary-product-qty">x${item.quantity}</span>
      </div>
    `;

    if (!item.isDefault) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'fpb-mobile-summary-product-remove';
      const removalState = this.getSummaryProductRemovalState(item);
      if (!removalState.canRemove) {
        removeBtn.classList.add('fpb-mobile-summary-product-remove--disabled');
        removeBtn.setAttribute('aria-disabled', 'true');
        removeBtn.title = removalState.blockedMessage;
      }
      removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
      removeBtn.addEventListener('click', () => {
        this.removeSummarySelectedProduct(item, summaryTitle);
      });
      row.querySelector('.fpb-mobile-summary-product-action')?.appendChild(removeBtn);
    }

    productsList.appendChild(row);
  });

  if (
    allSelectedProducts.length === 0
    && !this._shouldRenderProductSlots()
    && typeof this._renderSidebarProductSkeletons === 'function'
  ) {
    productsList.classList.add('fpb-mobile-summary-products-list--skeletons');
    this._renderSidebarProductSkeletons(productsList);
  }

  const requiredSlots = Math.max(
    allSelectedProducts.length + 1,
    activeStep?.maxQuantity || activeStep?.minQuantity || totalQuantity + 1,
    2
  );
  if (this._shouldRenderProductSlots()) {
    const emptySlots = Math.max(0, Math.min(2, requiredSlots - allSelectedProducts.length));
    const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
    for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'fpb-mobile-summary-empty-product-card';
      const emptyStateIcon = emptyStateIconUrl
        ? `<img class="fpb-mobile-summary-slot-icon-img" src="${emptyStateIconUrl}" alt="" width="63" height="63">`
        : '<span class="fpb-mobile-summary-slot-plus">+</span>';
      emptyCard.innerHTML = `
        <div class="fpb-mobile-summary-empty-product-image">${emptyStateIcon}</div>
        <div class="fpb-mobile-summary-empty-product-info">
          <span class="fpb-mobile-summary-empty-product-title"></span>
          <span class="fpb-mobile-summary-empty-product-variant"></span>
          <span class="fpb-mobile-summary-empty-product-price"></span>
        </div>
        <span class="fpb-mobile-summary-empty-product-action"></span>
      `;
      productsList.appendChild(emptyCard);
    }
  }

  bundleItems.appendChild(productsList);
  return bundleItems;
},

_renderCompactMobileSummarySlotTiles(container, allSelectedProducts = [], activeStep = null, totalQuantity = 0) {
  const selectedItems = Array.isArray(allSelectedProducts) ? allSelectedProducts : [];
  const slotCount = Math.max(
    selectedItems.length + 1,
    activeStep?.maxQuantity || activeStep?.minQuantity || totalQuantity + 1,
    2
  );
  const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const item = selectedItems[slotIndex];
    const card = document.createElement('div');
    card.className = item
      ? 'fpb-mobile-summary-slot-card fpb-mobile-summary-slot-card--filled'
      : 'fpb-mobile-summary-slot-card fpb-mobile-summary-slot-card--empty';

    if (item) {
      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const imgSrc = this._getSelectedProductImageSrc(item);
      card.innerHTML = imgSrc
        ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="fpb-mobile-summary-slot-image">`
        : '<div class="fpb-mobile-summary-slot-image-placeholder"></div>';
    } else {
      card.innerHTML = emptyStateIconUrl
        ? `<img class="fpb-mobile-summary-slot-icon-img" src="${emptyStateIconUrl}" alt="">`
        : '<span class="fpb-mobile-summary-slot-plus">+</span>';
    }

    container.appendChild(card);
  }
},

_createMobileSummaryActionButton({
  finalPrice,
  currencyInfo,
  conditionlessMobile,
  hasSelectionMobile,
  isLastStep,
  isComplete
}) {
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'side-panel-btn side-panel-btn-next';
  const hasUpcomingAddonStep = this.freeGiftStepIndex > this.currentStepIndex;
  const shouldAdvance = hasUpcomingAddonStep || (!conditionlessMobile && !isLastStep);
  const shouldAddToCart = !shouldAdvance && (conditionlessMobile || isLastStep);
  const actionText = shouldAddToCart
    ? this._resolveText('addToCartButton', 'Add to Cart')
    : this._resolveText('nextButton', 'Next');
  const priceText = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);
  const labelSpan = document.createElement('span');
  labelSpan.className = 'fpb-mobile-summary-action-label';
  labelSpan.textContent = actionText;
  const separatorSpan = document.createElement('span');
  separatorSpan.className = 'fpb-mobile-summary-action-separator';
  separatorSpan.textContent = '•';
  const priceSpan = document.createElement('span');
  priceSpan.className = 'fpb-mobile-summary-action-price';
  priceSpan.textContent = priceText;
  ctaBtn.append(labelSpan, separatorSpan, priceSpan);
  if (shouldAddToCart && (conditionlessMobile ? (!hasSelectionMobile || !this.canCheckoutWithBoxSelection()) : (!isComplete || !this.canCheckoutWithBoxSelection()))) ctaBtn.disabled = true;
  ctaBtn.addEventListener('click', async () => {
    if (shouldAddToCart) {
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(ctaBtn);
    } else {
      const targetStepIndex = hasUpcomingAddonStep ? this.freeGiftStepIndex : this.currentStepIndex + 1;
      if (this.canNavigateToStep(targetStepIndex) && this.canProceedToNextStep()) {
        const previousStepIndex = this.currentStepIndex;
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex = targetStepIndex;
        this._emitStorefrontEvent('step-changed', { previousStepIndex, currentStepIndex: targetStepIndex, direction: 'next' });
        await this._withWidgetActionBusy(async () => {
          await this.renderFullPageLayoutWithSidebar();
        }, { actionButton: ctaBtn });
      } else if (!this.canNavigateToStep(targetStepIndex)) {
        ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
      } else {
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
      }
    }
  });
  return ctaBtn;
},

getBundleSummaryText() {
  const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
  return {
    title: typeof summary.title === 'string' && summary.title.trim()
      ? summary.title
      : 'Your Bundle',
    subTitle: typeof summary.subTitle === 'string' && summary.subTitle.trim()
      ? summary.subTitle
      : 'Review your bundle'
  };
},

getBundleContentSummaryText() {
  const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
  return {
    title: typeof summary.title === 'string' ? summary.title.trim() : '',
    subTitle: typeof summary.subTitle === 'string' ? summary.subTitle.trim() : ''
  };
},

getCurrentStepContentText(stepIndex) {
  const step = this.selectedBundle?.steps?.[stepIndex];
  return {
    subtext: typeof step?.pageTitle === 'string' ? step.pageTitle.trim() : ''
  };
},

createStepContentHeader(stepIndex) {
  const contentText = this.getCurrentStepContentText(stepIndex);
  if (!contentText.subtext) return null;

  const header = document.createElement('div');
  header.className = 'fpb-full-page-content-header';

  const subtitle = document.createElement('p');
  subtitle.className = 'fpb-full-page-content-subtitle fpb-step-subtext';
  subtitle.textContent = contentText.subtext;
  header.appendChild(subtitle);

  return header;
},

shouldRenderFullPageSearch() {
  if (this.resolveFullPageLayout() === 'footer_side') {
    return false;
  }
  return this.resolveFullPageCardCtaMode() !== 'icon';
},

usesSelectedQuantityBadge() {
  return false;
},

_isStandardDesktopSidebar(panel) {
  const preset = this.getFullPageDesignPreset();
  return this.resolveFullPageLayout() === 'footer_side'
    && (preset === 'STANDARD' || preset === 'CLASSIC')
    && !panel?.classList?.contains('fpb-mobile-bottom-sheet');
},

createStandardSidebarSelectedRow(item, currencyInfo) {
  const summaryTitle = this.getSummaryProductDisplayTitle(item);
  const variantInfo = this.getSummaryProductVariantDisplay(item);
  const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
  const priceText = isFreeGiftItem
    ? CurrencyManager.convertAndFormat(0, currencyInfo)
    : CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo);
  const wrapper = document.createElement('div');

  wrapper.innerHTML = renderSelectedProductRow({
    id: item.variantId || item.productId || item.id,
    title: summaryTitle,
    variantTitle: variantInfo,
    imageUrl: this._getSelectedProductImageSrc(item),
    quantity: item.quantity,
    priceText,
    isDefault: item.isDefault === true,
    isFreeGift: isFreeGiftItem,
  }).trim();

  const row = wrapper.firstElementChild;
  row?.classList?.add('side-panel-product-row');
  return row;
},

createStandardSidebarDiscountProgress({ discountMessage, combinedDiscountInfo, totalPrice, totalQuantity }) {
  const activeRule = combinedDiscountInfo?.applicableRule
    || PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity)
    || null;
  if (!activeRule) return null;

  const conditionType = PricingCalculator.getRuleConditionType(activeRule);
  const targetValue = PricingCalculator.getRuleConditionValue(
    activeRule,
    PricingCalculator.getDiscountMethod(this.selectedBundle)
  );
  const currentValue = conditionType === 'amount' ? totalPrice : totalQuantity;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderDiscountProgress(
    getDiscountProgressData({
      currentValue,
      targetValue,
      message: discountMessage || '',
    }),
    {
      mode: this.config.discountProgressBarType === 'simple' ? 'bar' : 'stepped',
      messagePlacement: 'external',
    }
  ).trim();

  const progress = wrapper.firstElementChild;
  progress?.classList?.add('bw-discount-progress--standard-sidebar');
  progress?.classList?.add('fpb-dp-sidebar');
  return progress;
},

// Render the sidebar panel content (used by footer_side layout)
};
