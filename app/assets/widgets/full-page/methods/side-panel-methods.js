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


export const fullPageSidePanelMethods = {
renderSidePanel(panel) {
  if (!panel) return;
  panel.innerHTML = '';

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
  const allSelectedProducts = this.getAllSelectedProductsData();
  const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
  const isMobileSheet = panel.classList?.contains('fpb-mobile-bottom-sheet');
  const isHorizontalPreset = this.selectedBundle?.bundleDesignPresetId === 'HORIZONTAL';
  const isStandardDesktopSidebar = this._isStandardDesktopSidebar(panel);
  const activeStep = this.selectedBundle?.steps?.[this.currentStepIndex] || this.selectedBundle?.steps?.[0] || null;
  const summaryText = this.getBundleSummaryText();
  const isClassicDesktopSidebar =
    this.resolveFullPageLayout() === 'footer_side' &&
    this.getFullPageDesignPreset() === 'CLASSIC' &&
    !isMobileSheet;
  const summaryEmptyStateMode = this.getSummarySidebarEmptyStateMode();
  const useInlineSummarySlots = summaryEmptyStateMode === 'slots';

  panel.classList.toggle('full-page-side-panel--inline-slots', useInlineSummarySlots);
  panel.classList.toggle('full-page-side-panel--skeleton-list', !useInlineSummarySlots);

  // Header: "Your Bundle" + Clear
  const header = document.createElement('div');
  header.className = 'side-panel-header';
  const headerCopy = document.createElement('div');
  headerCopy.className = 'side-panel-header-copy';
  const headerTitle = document.createElement('span');
  headerTitle.className = 'side-panel-title';
  headerTitle.textContent = summaryText.title;
  if (isStandardDesktopSidebar) {
    headerCopy.appendChild(headerTitle);
    header.appendChild(headerCopy);
  } else {
    header.appendChild(headerTitle);
  }

  if (isStandardDesktopSidebar || allSelectedProducts.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'side-panel-clear-btn';
    clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg> Clear`;
    clearBtn.addEventListener('click', () => {
      this.showClearCartConfirmation();
    });
    header.appendChild(clearBtn);
  }
  panel.appendChild(header);

  // Subtitle — "Review your bundle"
  const subtitle = document.createElement('p');
  subtitle.className = 'side-panel-subtitle';
  subtitle.textContent = summaryText.subTitle;
  if (isStandardDesktopSidebar) {
    headerCopy.appendChild(subtitle);
  } else {
    panel.appendChild(subtitle);
  }

  const tierCta = this.createSidebarTierCta(nextRule);
  if (!isStandardDesktopSidebar && !isClassicDesktopSidebar && tierCta) {
    panel.appendChild(tierCta);
  }

  const selectedBoxSelectionQuantity = this.getSelectedBoxSelectionQuantity();
  const boxSelection = this.renderBoxSelectionOptions(
    isClassicDesktopSidebar ? selectedBoxSelectionQuantity : totalQuantity
  );

  if ((isClassicDesktopSidebar || !isStandardDesktopSidebar) && boxSelection) {
    panel.appendChild(boxSelection);
  }

  const summaryContent = document.createElement('div');
  summaryContent.className = 'side-panel-summary-content';

  // Discount messaging
  if (this.selectedBundle?.pricing?.enabled) {
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
      discountMessage = this._formatSidebarDiscountMessage(discountMessage);
      const msgEl = document.createElement('div');
      msgEl.className = 'side-panel-discount-message';
      msgEl.innerHTML = discountMessage;
      summaryContent.appendChild(msgEl);
    }

    if (this.config.showDiscountProgressBar) {
      const progressBar = this._renderDiscountProgress({
        placement: "sidebar",
        combinedDiscountInfo,
        totalPrice,
        totalQuantity,
        unitPrices,
      });
      if (progressBar) {
        progressBar.classList.add('fpb-dp-sidebar');
        summaryContent.appendChild(progressBar);
      }
    }
  }

  // Item count label
  const countLabel = document.createElement('div');
  countLabel.className = 'side-panel-item-count';
  countLabel.textContent = isClassicDesktopSidebar
    ? `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`
    : isStandardDesktopSidebar
      ? `${allSelectedProducts.length} item(s)`
      : `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`;
  summaryContent.appendChild(countLabel);

  // Selected products list / Classic slots
  if (isClassicDesktopSidebar) {
    const classicSlotCount = this.getClassicSidebarSlotCount(
      allSelectedProducts,
      activeStep
    );
  
    const classicSlots = this.renderClassicSidebarSlots(
      allSelectedProducts,
      classicSlotCount
    );

    summaryContent.appendChild(classicSlots);
  } else {
    const productsContainer = document.createElement('div');
    productsContainer.className = 'side-panel-products';
    if (isStandardDesktopSidebar) {
      productsContainer.classList.add('side-panel-products--standard');
    }
    if (isHorizontalPreset) {
      productsContainer.classList.add('side-panel-products--slots');
    }
    productsContainer.classList.toggle('side-panel-products--inline-slots', useInlineSummarySlots);
    productsContainer.classList.toggle('side-panel-products--skeleton-list', !useInlineSummarySlots);

    if (allSelectedProducts.length > 0) {
      allSelectedProducts.forEach(item => {
        if (isStandardDesktopSidebar) {
          const row = this.createStandardSidebarSelectedRow(item, currencyInfo);
          const removeBtn = row?.querySelector('[data-action="remove-selected-product"]');
          if (removeBtn) {
            removeBtn.addEventListener('click', () => {
              const stepIndex = item.stepIndex;
              const productId = item.variantId || item.productId || item.id;
              const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
              const summaryTitle = this.getSummaryProductDisplayTitle(item);
              this.updateProductSelection(stepIndex, productId, 0);
              const truncated = summaryTitle && summaryTitle.length > 25 ? summaryTitle.substring(0, 25) + '...' : (summaryTitle || 'Product');
              ToastManager.showWithUndo(
                `Removed "${truncated}"`,
                () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
                5000
              );
            });
          }
          if (row) productsContainer.appendChild(row);
          return;
        }

        const summaryTitle = this.getSummaryProductDisplayTitle(item);
        const variantInfo = this.getSummaryProductVariantDisplay(item);
        const row = document.createElement('div');
        row.className = 'side-panel-product-row';
        if (isHorizontalPreset) {
          row.classList.add('side-panel-product-slot');
        }

        const imgSrc = this._getSelectedProductImageSrc(item);

        const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
        const qtySpan = `<span class="side-panel-product-qty" aria-label="Quantity ${item.quantity}">${item.quantity}</span>`;
        const priceHtml = isFreeGiftItem
          ? `<span class="side-panel-product-price free-gift-price">${CurrencyManager.convertAndFormat(0, currencyInfo)}</span><span class="side-panel-product-original-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`
          : `<span class="side-panel-product-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`;

        if (isStandardDesktopSidebar) {
          row.innerHTML = `
            <div class="side-panel-product-img-wrap">
              ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
              ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
            </div>
            <div class="side-panel-product-info">
              <span class="side-panel-product-title">${this._escapeHTML(summaryTitle)}</span>
              ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
              ${priceHtml}
            </div>
            <div class="side-panel-product-action"></div>
          `;
        } else {
          row.innerHTML = `
            <div class="side-panel-product-img-wrap">
              ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
              ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
            </div>
            <div class="side-panel-product-info">
              <span class="side-panel-product-title">${this._escapeHTML(summaryTitle)}</span>
              ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
            </div>
            ${priceHtml}
          `;
        }

        // Remove button — hidden for default (mandatory) products
        if (!item.isDefault) {
          const removeBtn = document.createElement('button');
          removeBtn.className = 'side-panel-product-remove';
          removeBtn.type = 'button';
          removeBtn.setAttribute('aria-label', `Delete ${summaryTitle || 'product'}`);
          removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" aria-hidden="true" focusable="false"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
          removeBtn.addEventListener('click', () => {
            const stepIndex = item.stepIndex;
            const productId = item.variantId || item.productId || item.id;
            const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
            this.updateProductSelection(stepIndex, productId, 0);
            const truncated = summaryTitle && summaryTitle.length > 25 ? summaryTitle.substring(0, 25) + '...' : (summaryTitle || 'Product');
            ToastManager.showWithUndo(
              `Removed "${truncated}"`,
              () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
              5000
            );
          });
          if (isStandardDesktopSidebar) {
            row.querySelector('.side-panel-product-action')?.appendChild(removeBtn);
          } else {
            row.appendChild(removeBtn);
          }
        }

        productsContainer.appendChild(row);
      });
      if (isStandardDesktopSidebar && useInlineSummarySlots) {
        this._renderStandardSidebarEmptySlots(productsContainer, {
          mode: summaryEmptyStateMode,
          filledCount: allSelectedProducts.length,
        });
      }
    } else if (isStandardDesktopSidebar) {
      this._renderStandardSidebarEmptySlots(productsContainer, {
        mode: summaryEmptyStateMode,
      });
    }
    if (isHorizontalPreset) {
      const requiredSlots = Math.max(
        totalQuantity + 1,
        activeStep?.maxQuantity || activeStep?.minQuantity || 2,
        2
      );
      if (this._shouldRenderProductSlots()) {
        const emptySlots = Math.max(0, requiredSlots - allSelectedProducts.length);
        const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
        for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'side-panel-product-slot side-panel-product-slot--empty';
          if (emptyStateIconUrl) {
            const img = document.createElement('img');
            img.src = emptyStateIconUrl;
            img.alt = '';
            img.width = 40;
            img.height = 40;
            img.style.objectFit = 'contain';
            emptySlot.appendChild(img);
          } else {
            const emptyText = document.createElement('span');
            emptyText.textContent = '+';
            emptyText.style.display = 'flex';
            emptyText.style.alignItems = 'center';
            emptyText.style.justifyContent = 'center';
            emptyText.style.width = '100%';
            emptyText.style.height = '100%';
            emptyText.style.fontSize = '24px';
            emptyText.style.lineHeight = '1';
            emptyText.style.fontWeight = '700';
            emptySlot.appendChild(emptyText);
          }
          productsContainer.appendChild(emptySlot);
        }
      }
    }
    summaryContent.appendChild(productsContainer);
  }

  if (!isStandardDesktopSidebar && !isMobileSheet && allSelectedProducts.length === 0 && !isHorizontalPreset) {
    const skeletonContainer = document.createElement('div');
    skeletonContainer.className = 'side-panel-skeleton-slots';
    this._renderSidebarProductSkeletons(skeletonContainer);
    summaryContent.appendChild(skeletonContainer);
  }

  panel.appendChild(summaryContent);

  // Free gift section (locked or unlocked)
  if (!isClassicDesktopSidebar && !isStandardDesktopSidebar) this._renderFreeGiftSection(panel);

  // Total
  const totalSection = document.createElement('div');
  totalSection.className = 'side-panel-total';
  totalSection.innerHTML = `
    <span class="side-panel-total-label">Total</span>
    <div class="side-panel-total-prices">
      ${combinedDiscountInfo.hasDiscount ? `<span class="side-panel-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
      <span class="side-panel-total-final">${CurrencyManager.convertAndFormat(finalPrice, currencyInfo)}</span>
    </div>
  `;
  if (isMobileSheet) {
    panel.appendChild(totalSection);
    return;
  }

  // Action row
  const actionDivider = document.createElement('div');
  actionDivider.className = 'side-panel-action-divider';
  const actionSection = document.createElement('div');
  actionSection.className = 'side-panel-action-container';
  actionSection.appendChild(totalSection);

  const navSection = document.createElement('div');
  navSection.className = 'side-panel-nav';

  const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
  const canProceed = this.canProceedToNextStep();
  const conditionless = this.bundleHasNoConditions();
  const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;
  const sidebarTierCtaContent = (conditionless || isLastStep)
    ? this.getSidebarTierCtaContent(nextRule)
    : null;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'side-panel-btn side-panel-btn-next';
  const nextStepLabel = this.getFullPageDesignPreset() === 'DEFAULT' || this.getFullPageDesignPreset() === 'CLASSIC'
    ? this._resolveText('nextButton', 'Next')
    : 'Next Step';
    nextBtn.textContent = (conditionless || isLastStep)
      ? this._resolveText('addToCartButton', 'Add to Cart')
      : nextStepLabel;
  if (sidebarTierCtaContent) {
    const labelText = sidebarTierCtaContent.label || '';
    const subtextText = sidebarTierCtaContent.subtext || '';
    const ctaTextParts = [labelText, subtextText].filter((item) => item !== '');
    nextBtn.textContent = ctaTextParts.join(' ');
    nextBtn.classList.add('side-panel-btn-has-tier-cta');
    if (ctaTextParts.length) {
      nextBtn.title = ctaTextParts.join(' ');
    }
  }
  if (!isStandardDesktopSidebar && (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed))) {
    nextBtn.disabled = true;
  }
  nextBtn.addEventListener('click', async () => {
    if (this._isWidgetActionBusy) return;

    if (conditionless || isLastStep) {
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(nextBtn);
    } else if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
      const giftName = this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName;
      ToastManager.show(giftName ? `Complete all steps to unlock ${giftName}!` : 'Complete all steps first.');
    } else if (this.canProceedToNextStep()) {
      await this._withWidgetActionBusy(async () => {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        await this.renderFullPageLayoutWithSidebar();
      }, { actionButton: nextBtn });
    } else {
      ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
    }
  });

  navSection.appendChild(nextBtn);
  actionSection.appendChild(navSection);
  panel.appendChild(actionDivider);
  panel.appendChild(actionSection);
},

createSidebarTierCta(nextRule) {
  const content = this.getSidebarTierCtaContent(nextRule);
  if (!content) return null;

  const { label, subtext } = content;

  const cta = document.createElement('div');
  cta.className = 'fpb-sidebar-tier-cta';

  if (label) {
    const title = document.createElement('div');
    title.className = 'fpb-sidebar-tier-cta-title';
    title.textContent = label;
    cta.appendChild(title);
  }

  if (subtext) {
    const detail = document.createElement('div');
    detail.className = 'fpb-sidebar-tier-cta-subtext';
    detail.textContent = subtext;
    cta.appendChild(detail);
  }

  return cta;
},
};
