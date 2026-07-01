import {
  ComponentGenerator,
  CurrencyManager,
  PricingCalculator,
} from '../../../bundle-widget-components.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { getSelectedProductEntries } from '../../shared/engine/bundle-selectors.js';
import { resolveProductPageTemplateConfig } from './registry.js';

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
    const rule = rules[0];
    const discountMethod = PricingCalculator.getDiscountMethod(this.selectedBundle);
    const conditionValue = PricingCalculator.getRuleConditionValue(rule, discountMethod);
    const conditionType = PricingCalculator.getRuleConditionType(rule);
    const current = conditionType === 'quantity' ? totalQuantity : totalPrice / 100;
    const progress = conditionValue > 0 ? Math.min(1, current / conditionValue) : 1;
    const met = progress >= 1;
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const discountText = combinedDiscountInfo.hasDiscount
      ? (this.selectedBundle.pricing.method === 'percentage_off'
          ? `${rule.discountValue ?? 0}% off`
          : CurrencyManager.convertAndFormat(combinedDiscountInfo.savings, CurrencyManager.getCurrencyInfo()))
      : '';
    const template = met
      ? (pbConfig?.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig?.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');
    const diff = Math.max(0, conditionValue - current);
    const conditionText = conditionType === 'quantity'
      ? `${Math.ceil(diff)} item${Math.ceil(diff) !== 1 ? 's' : ''}`
      : CurrencyManager.convertAndFormat(diff * 100, CurrencyManager.getCurrencyInfo());

    return template
      .replace(/{discountText}/g, discountText)
      .replace(/{conditionText}/g, conditionText)
      .replace(/{amountNeeded}/g, conditionText)
      .replace(/{itemsNeeded}/g, `${Math.ceil(diff)}`)
      .replace(/{progressPercentage}/g, `${Math.round(progress * 100)}`);
  },

  _renderCascadeFooter(el) {
    el.className = 'bundle-footer-messaging bw-ppb-cascade-footer wpbMixCascadeFooterWrapper wpbMixCascadeFooterWrapper--bundleATCBtnV2 wpbMixCascadeFooterWrapper--cartDrawerUI';
    el.style.display = '';
    el.style.cssText = '';

    const selectedEntries = this._getSelectedProductEntries();
    const drawer = document.createElement('div');
    drawer.className = 'bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bw-ppb-cascade-selected-toggle wpbMixCascadeSelectedItemsInCartWrappper';
    const totalSelectedQuantity = selectedEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    toggle.innerHTML = `
      <span class="bw-ppb-cascade-selected-toggle-label wpbMixCascadeCartDrawerBtnText">${ComponentGenerator.escapeHtml(this._resolveText('viewBundleItems', 'View Bundle Items'))}</span>
      <span class="bw-ppb-cascade-selected-toggle-count wpbMixCascadeSelectedItemsInCart">${totalSelectedQuantity}</span>
    `;
    toggle.addEventListener('click', () => {
      drawer.classList.toggle('bw-ppb-cascade-selected-drawer--open');
    });
    drawer.appendChild(toggle);

    if (selectedEntries.length > 0) {
      const list = document.createElement('div');
      list.className = 'bw-ppb-cascade-selected-list wpbMixCascadeCartItemsWrapper';
      selectedEntries.forEach(({ stepIndex, variantId, quantity, product }) => {
        const item = document.createElement('div');
        item.innerHTML = renderSelectedProductRow({
          ...product,
          variantId,
          quantity,
        }, {
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

    el.appendChild(drawer);

    const message = this._getCascadeFooterMessage();
    if (message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'bw-ppb-cascade-discount-message';
      messageEl.textContent = message;
      el.appendChild(messageEl);
    }
  },
};
