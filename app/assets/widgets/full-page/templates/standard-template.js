export function installStandardTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureStandardPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'DEFAULT') return;
    if (document.getElementById('wpb-fpb-standard-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-standard-runtime-styles';
    style.textContent = '[data-bundle-type=full_page][data-fpb-design-preset=DEFAULT]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}[data-fpb-design-preset=DEFAULT]{--standard-card-height:352px;--ih:240px;--mw:177.5px;--mh:264px;--miw:161.5px;--mih:150px;--cg:15px}@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-layout-wrapper{display:grid;grid-template-columns:0.6897fr 0.3103fr;gap:15px;max-width:1455px;padding:0;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{container-type:inline-size;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--cg,15px);margin:12px 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:100%;min-width:0;max-width:none;height:var(--standard-card-height,352px);min-height:var(--standard-card-height,352px);display:grid;grid-template-columns:1fr;grid-template-rows:240px 40px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .full-page-side-panel{width:100%;flex:initial;min-height:738px;margin-top:115px;padding:20px}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{width:100%;height:var(--ih,240px);min-height:var(--ih,240px);aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,var(--mw,177.5px)));gap:var(--cg,15px)}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{min-height:var(--mh,264px);height:var(--mh,264px)}}';
    document.head.appendChild(style);
  };
}
