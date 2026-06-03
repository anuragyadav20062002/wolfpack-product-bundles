import {
  BUNDLE_WIDGET,
  ComponentGenerator,
  CurrencyManager,
  PricingCalculator,
} from '../../../bundle-widget-components.js';

export function installCascadeTemplate(BundleWidgetProductPage) {
  const prototype = BundleWidgetProductPage.prototype;

  prototype._isProductPageCascadeTemplate = function() {
    return this._getProductPageTemplateType() === 'PDP_INPAGE'
      && this._getProductPageDesignPreset() === 'CASCADE';
  };

  prototype._getSelectedProductEntries = function() {
    const entries = [];
    (this.selectedProducts || []).forEach((stepSelections, stepIndex) => {
      const products = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);
      Object.entries(stepSelections || {}).forEach(([variantId, quantity]) => {
        const normalizedQuantity = Number(quantity) || 0;
        if (normalizedQuantity <= 0) return;

        const product = products.find(candidate =>
          this.normalizeSelectionKey(candidate.variantId || candidate.id) === this.normalizeSelectionKey(variantId)
        );
        if (!product) return;

        entries.push({
          stepIndex,
          variantId,
          quantity: normalizedQuantity,
          product,
        });
      });
    });
    return entries;
  };

  prototype._getCascadeFooterMessage = function() {
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
  };

  prototype._renderCascadeFooter = function(el) {
    el.className = 'bundle-footer-messaging bw-ppb-cascade-footer';
    el.style.display = '';
    el.style.cssText = '';

    const selectedEntries = this._getSelectedProductEntries();
    const drawer = document.createElement('div');
    drawer.className = 'bw-ppb-cascade-selected-drawer';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bw-ppb-cascade-selected-toggle';
    toggle.textContent = this._resolveText('viewBundleItems', 'View Bundle Items');
    toggle.addEventListener('click', () => {
      drawer.classList.toggle('bw-ppb-cascade-selected-drawer--open');
    });
    drawer.appendChild(toggle);

    if (selectedEntries.length > 0) {
      const list = document.createElement('div');
      list.className = 'bw-ppb-cascade-selected-list';
      selectedEntries.forEach(({ stepIndex, variantId, quantity, product }) => {
        const item = document.createElement('div');
        item.className = 'bw-ppb-cascade-selected-item';
        item.innerHTML = `
          <img src="${product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}" alt="${ComponentGenerator.escapeHtml(product.title || '')}" loading="lazy">
          <span>${ComponentGenerator.escapeHtml(product.title || '')}${quantity > 1 ? ` × ${quantity}` : ''}</span>
          <button type="button" aria-label="Remove ${ComponentGenerator.escapeHtml(product.title || 'product')}">×</button>
        `;
        item.querySelector('button')?.addEventListener('click', () => {
          this.removeProductFromSelection(stepIndex, variantId);
        });
        list.appendChild(item);
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
  };
}
