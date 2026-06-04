export function installStandardTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureStandardPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'DEFAULT') return;
    if (document.getElementById('wpb-fpb-standard-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-standard-runtime-styles';
    style.textContent = '[data-bundle-type=full_page][data-fpb-design-preset=DEFAULT]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}[data-fpb-design-preset=DEFAULT]{--cw:321px;--ch:352px;--iw:305px;--is:305px;--ih:240px;--mw:177.5px;--mh:264px;--miw:161.5px;--mih:150px;--cg:15px}@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-layout-wrapper{display:grid;grid-template-columns:minmax(0,993px) 447px;gap:15px;max-width:1455px;padding:0;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(3,var(--cw,321px));gap:var(--cg,15px);margin:12px 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .full-page-side-panel{width:447px;flex:0 0 447px;min-height:755px;margin-top:115px;padding:20px;grid-template-columns:405px}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{height:var(--ih,240px);min-height:var(--ih,240px)}}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,var(--mw,177.5px)));gap:var(--cg,15px)}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{min-height:var(--mh,264px);height:var(--mh,264px)}}';
    document.head.appendChild(style);
  };
}
