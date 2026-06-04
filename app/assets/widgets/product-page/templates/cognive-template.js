export function installCogniveTemplate(BundleWidgetProductPage) {
  const prototype = BundleWidgetProductPage.prototype;

  prototype._isProductPageGridTemplate = function() {
    return this._getProductPageTemplateType() === 'PDP_INPAGE'
      && this._getProductPageDesignPreset() === 'COGNIVE';
  };

  prototype._isProductPageCogniveTemplate = function() {
    return this._isProductPageGridTemplate();
  };

  prototype._usesCompactInpageProductCards = function() {
    return Boolean(this._isProductPageCascadeTemplate?.() || this._isProductPageGridTemplate());
  };

  prototype._renderCogniveFooter = function(el) {
    this._renderCascadeFooter(el);
    el.classList.add('bw-ppb-cognive-footer');
  };
}
