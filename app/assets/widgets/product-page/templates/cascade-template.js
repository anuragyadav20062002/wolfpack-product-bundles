import {
  ComponentGenerator,
  CurrencyManager,
  PricingCalculator,
  TemplateManager,
  ToastManager,
} from '../../../bundle-widget-components.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { getSelectedProductEntries } from '../../shared/engine/bundle-selectors.js';
import { resolveProductPageTemplateConfig } from './registry.js';

export function getCascadeSelectedDrawerState(selectedEntries = [], isOpen = false) {
  const entries = Array.isArray(selectedEntries) ? selectedEntries : [];
  const selectedQuantity = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry?.quantity || 0)), 0);
  const hasSelectedProducts = selectedQuantity > 0;

  return {
    isOpen: Boolean(isOpen && hasSelectedProducts),
    selectedQuantity,
    hasSelectedProducts,
  };
}

export function getNextCascadeSelectedDrawerExpandedState({
  hasSelectedProducts = false,
  isExpanded = false,
  onEmpty = null,
} = {}) {
  if (!hasSelectedProducts) {
    if (typeof onEmpty === 'function') onEmpty();
    return false;
  }
  return !isExpanded;
}

export function getCascadeSelectedDrawerHeight({
  list = null,
  drawer = null,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
} = {}) {
  if (!list) return 0;

  const borderTopWidth = drawer && typeof getComputedStyle === 'function'
    ? Number.parseFloat(getComputedStyle(drawer).borderTopWidth || '0')
    : 0;
  const borderOffset = Number.isFinite(borderTopWidth) ? borderTopWidth : 0;
  const viewportLimit = Math.round(Number(viewportHeight || 0) * 0.6) || Number.POSITIVE_INFINITY;

  return Math.min(list.scrollHeight + borderOffset, viewportLimit, 420);
}

export function prepareCascadeSelectedProductDisplay({
  product = {},
  variantId = '',
  quantity = 1,
  formatPrice = null,
} = {}) {
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const title = product.title || product.parentTitle || '';
  const amount = Number(product.price);
  const priceText = product.priceText || (
    Number.isFinite(amount) && typeof formatPrice === 'function'
      ? formatPrice(amount)
      : ''
  );

  return {
    ...product,
    variantId,
    quantity: normalizedQuantity,
    title: `${title} x ${normalizedQuantity}`,
    priceText,
    quantityLabel: `x ${normalizedQuantity}`,
  };
}

export function shouldMountCascadeAddToCartInFooter(addToCartButton, footerElement) {
  return Boolean(addToCartButton && footerElement && addToCartButton.parentElement !== footerElement);
}

export const cascadeTemplateMethods = {
  _isProductPageCascadeTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'LIST';
  },

  _getSelectedProductEntries() {
    return getSelectedProductEntries({
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
    }, {
      expandProductsByStep: (products) => this.expandProductsByVariant(products || []),
      normalizeSelectionKey: (value) => this.normalizeSelectionKey(value),
    });
  },

  _getCascadeFooterMessage() {
    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const pbConfig = displayOptions?.progressBar;
    const rules = this.selectedBundle?.pricing?.rules || [];

    if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) return '';

    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity, totalPrice) || null;
    const messageType = nextRule ? 'progress' : 'success';
    const fallbackTemplate = messageType === 'success'
      ? (pbConfig?.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig?.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      combinedDiscountInfo,
      currencyInfo,
      { messageType }
    );
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle: this.selectedBundle,
      totalQuantity,
      totalPrice,
      discountInfo: combinedDiscountInfo,
      messageType,
      fallbackTemplate,
      locale: window.Shopify?.locale,
    });

    return TemplateManager.replaceVariables(template, variables);
  },

  _renderCascadeFooter(el) {
    el.className = 'bundle-footer-messaging bw-ppb-cascade-footer wpbMixCascadeFooterWrapper wpbMixCascadeFooterWrapper--bundleATCBtnV2 wpbMixCascadeFooterWrapper--cartDrawerUI';
    el.style.display = '';
    el.style.cssText = '';

    const selectedEntries = this._getSelectedProductEntries();
    if (!this.cascadeSelectedDrawerState) {
      this.cascadeSelectedDrawerState = { isOpen: false };
    }
    const drawerState = getCascadeSelectedDrawerState(
      selectedEntries,
      this.cascadeSelectedDrawerState.isOpen,
    );
    const drawer = document.createElement('div');
    drawer.className = `bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer${drawerState.isOpen ? ' bw-ppb-cascade-selected-drawer--open gbbMixCascadeCartDrawerContainer--open' : ''}`;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bw-ppb-cascade-selected-toggle wpbMixCascadeSelectedItemsInCartWrappper';
    toggle.setAttribute('aria-expanded', drawerState.isOpen ? 'true' : 'false');
    toggle.innerHTML = `
      <span class="bw-ppb-cascade-selected-toggle-chevron gbbMixCascadeCartChevronIcon" aria-hidden="true"></span>
      <span class="bw-ppb-cascade-selected-toggle-label wpbMixCascadeCartDrawerBtnText">${ComponentGenerator.escapeHtml(this._resolveText('viewBundleItems', 'View Bundle Items'))}</span>
      <span class="bw-ppb-cascade-selected-toggle-count wpbMixCascadeSelectedItemsInCart">${drawerState.selectedQuantity}</span>
    `;
    drawer.appendChild(toggle);

    let list = null;
    if (drawerState.hasSelectedProducts) {
      list = document.createElement('div');
      list.className = 'bw-ppb-cascade-selected-list wpbMixCascadeCartItemsWrapper';

      const title = document.createElement('div');
      title.className = 'bw-ppb-cascade-selected-list-title gbbMixCascadeCartSectionHeading wpbMixCascadeCartItemsTitle';
      title.dataset.sectionId = 'selectedProducts';
      title.innerHTML = `
        <span class="bw-ppb-cascade-selected-list-title-text gbbMixCascadeCartSectionHeadingTitle">${ComponentGenerator.escapeHtml(this._resolveText('bundleCartSelectedProductsText', 'Selected Products'))}</span>
        <span class="bw-ppb-cascade-selected-list-title-line gbbMixCascadeCartSectionHeadingLine" aria-hidden="true"></span>
      `;
      list.appendChild(title);

      selectedEntries.forEach(({ stepIndex, variantId, quantity, product }) => {
        const item = document.createElement('div');
        item.innerHTML = renderSelectedProductRow(prepareCascadeSelectedProductDisplay({
          product,
          variantId,
          quantity,
          formatPrice: (amount) => CurrencyManager.convertAndFormat(amount, CurrencyManager.getCurrencyInfo()),
        }), {
          className: 'bw-ppb-cascade-selected-item wpbMixCascadeBundleCartItem',
        }).trim();
        const row = item.firstElementChild;
        row?.querySelector('[data-action="remove-selected-product"]')?.addEventListener('click', () => {
          this.removeProductFromSelection(stepIndex, variantId);
        });
        if (row) list.appendChild(row);
      });
      drawer.appendChild(list);
    }

    const setDrawerExpanded = (isExpanded) => {
      const nextExpanded = Boolean(isExpanded && drawerState.hasSelectedProducts);
      let maxDrawerHeight = 0;
      drawer.classList.toggle('bw-ppb-cascade-selected-drawer--open', nextExpanded);
      drawer.classList.toggle('gbbMixCascadeCartDrawerContainer--open', nextExpanded);
      if (list && nextExpanded) {
        maxDrawerHeight = getCascadeSelectedDrawerHeight({ list, drawer });
        drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${maxDrawerHeight}px`);
      }
      toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      this.cascadeSelectedDrawerState.isOpen = nextExpanded;
      this.cascadeSelectedDrawerState.height = nextExpanded ? maxDrawerHeight : 0;
    };
    toggle.addEventListener('click', () => {
      setDrawerExpanded(getNextCascadeSelectedDrawerExpandedState({
        hasSelectedProducts: drawerState.hasSelectedProducts,
        isExpanded: drawer.classList.contains('bw-ppb-cascade-selected-drawer--open'),
        onEmpty: () => ToastManager.show('Add items to your bundle first'),
      }));
    });

    el.appendChild(drawer);
    const previousDrawerHeight = Math.max(0, Number(this.cascadeSelectedDrawerState.height || 0));
    if (drawerState.isOpen && previousDrawerHeight > 0) {
      drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${previousDrawerHeight}px`);
      const scheduleFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback) => callback();
      scheduleFrame(() => setDrawerExpanded(true));
    } else {
      setDrawerExpanded(drawerState.isOpen);
    }

    const message = this._getCascadeFooterMessage();
    if (message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'bw-ppb-cascade-discount-message';
      messageEl.textContent = message;
      el.appendChild(messageEl);
    }

    const addToCartButton = this.elements?.addToCartButton;
    if (shouldMountCascadeAddToCartInFooter(addToCartButton, el)) {
      el.appendChild(addToCartButton);
    }
  },
};
