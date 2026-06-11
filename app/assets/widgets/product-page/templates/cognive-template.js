import { resolveProductPageTemplateConfig } from './registry.js';

export const cogniveTemplateMethods = {
  _isProductPageGridTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'GRID';
  },

  _isProductPageCogniveTemplate() {
    return this._isProductPageGridTemplate();
  },

  _usesCompactInpageProductCards() {
    return Boolean(this._isProductPageCascadeTemplate?.() || this._isProductPageGridTemplate());
  },

  _renderCogniveFooter(el) {
    this._renderCascadeFooter(el);
    el.classList.add('bw-ppb-cognive-footer');
  },
};
