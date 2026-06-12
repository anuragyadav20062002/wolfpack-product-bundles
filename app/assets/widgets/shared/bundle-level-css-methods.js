export const bundleLevelCssMethods = {
  getBundleLevelCssStyleId(bundleId) {
    const safeId = String(bundleId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
    return `wpb-bundle-level-css-${safeId}`;
  },

  removeExistingBundleLevelCss() {
    document
      .querySelectorAll('style[data-wpb-bundle-level-css]')
      .forEach((style) => style.remove());
  },

  applyBundleLevelCss(bundle) {
    this.removeExistingBundleLevelCss();

    const css = typeof bundle?.bundleLevelCss === 'string'
      ? bundle.bundleLevelCss.trim()
      : '';

    if (!css) return;

    const style = document.createElement('style');
    style.id = this.getBundleLevelCssStyleId(bundle.id);
    style.type = 'text/css';
    style.dataset.wpbBundleLevelCss = String(bundle.id || '');
    style.textContent = css;
    document.head.appendChild(style);
  },
};
