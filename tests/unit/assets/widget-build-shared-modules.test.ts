import fs from 'node:fs';
import path from 'node:path';

describe('widget build shared module list', () => {
  it('inlines the loading overlay helper before widget entry files', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    expect(sharedModules).toContain("app/assets/widgets/shared/loading-overlay.js");
  });

  it('inlines the descriptor-preserving mixin helper before widget entry files', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    expect(sharedModules).toContain("app/assets/widgets/shared/mixin-descriptors.js");
  });

  it('inlines shared engine modules before widget entry files', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const WIDGET_SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    expect(sharedModules).toContain("app/assets/widgets/shared/engine/create-bundle-state.js");
    expect(sharedModules).toContain("app/assets/widgets/shared/engine/bundle-selectors.js");
    expect(sharedModules).toContain("app/assets/widgets/shared/engine/bundle-actions.js");
  });

  it('inlines shared banner modules before widget entry files', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const WIDGET_SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    expect(sharedModules).toContain("app/assets/widgets/shared/components/bundle-banners.js");
  });

  it('inlines shared product-card modules in dependency order', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const WIDGET_SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    const discountProgressIndex = sharedModules.indexOf('app/assets/widgets/shared/components/discount-progress.js');
    const quantityControlIndex = sharedModules.indexOf('app/assets/widgets/shared/components/quantity-control.js');
    const productCardIndex = sharedModules.indexOf('app/assets/widgets/shared/components/product-card.js');
    const selectedRowIndex = sharedModules.indexOf('app/assets/widgets/shared/components/selected-product-row.js');
    const selectedSlotsIndex = sharedModules.indexOf('app/assets/widgets/shared/components/selected-product-slots.js');

    expect(discountProgressIndex).toBeGreaterThanOrEqual(0);
    expect(quantityControlIndex).toBeGreaterThanOrEqual(0);
    expect(productCardIndex).toBeGreaterThan(quantityControlIndex);
    expect(selectedRowIndex).toBeGreaterThan(productCardIndex);
    expect(selectedSlotsIndex).toBeGreaterThan(selectedRowIndex);
  });

  it('inlines product-page step-validation helpers before dependent method modules', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const modulesStart = script.indexOf('const PRODUCT_PAGE_MODULES = [');
    const modulesEnd = script.indexOf('];', modulesStart);
    const modules = script.slice(modulesStart, modulesEnd);

    const validationIndex = modules.indexOf('app/assets/widgets/product-page/methods/step-validation.js');
    const footerIndex = modules.indexOf('app/assets/widgets/product-page/methods/footer-modal-state-methods.js');
    const widgetMiscIndex = modules.indexOf('app/assets/widgets/product-page/methods/widget-misc-methods.js');
    const selectionIndex = modules.indexOf('app/assets/widgets/product-page/methods/selection-methods.js');
    const cartIndex = modules.indexOf('app/assets/widgets/product-page/methods/cart-methods.js');

    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(footerIndex).toBeGreaterThan(validationIndex);
    expect(widgetMiscIndex).toBeGreaterThan(validationIndex);
    expect(selectionIndex).toBeGreaterThan(validationIndex);
    expect(cartIndex).toBeGreaterThan(validationIndex);
  });
});
