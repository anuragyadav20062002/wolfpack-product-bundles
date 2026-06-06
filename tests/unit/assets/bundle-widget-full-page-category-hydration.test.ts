import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Full Page widget category hydration contract', () => {
  it('hydrates products and collections from step.categories without changing config load order', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('collectStepProductIds(step)');
    expect(source).toContain('collectStepCollectionHandles(step)');
    expect(source).toContain('category.collectionsSelectedData');
    expect(source).toContain('resolveStorefrontApiBase()');
    expect(source).toContain("const appProxyPrefix = '/apps/product-bundles';");
    expect(source).toContain('return appProxyPrefix;');
    expect(source).toContain('const apiBaseUrl = this.resolveStorefrontApiBase();');
    expect(source.indexOf('data-bundle-config')).toBeLessThan(source.indexOf('const fetchBundleData = async () =>'));
  });

  it('gates variant-card expansion on the active category or non-category step flag', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true');
    expect(source).toContain('shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory)');
    expect(source).toContain('const shouldDisplayVariantsAsIndividual = this.shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory);');
    expect(source).toContain('let expandedProducts = this.expandProductsByVariant(products, shouldDisplayVariantsAsIndividual);');
    expect(source).toContain('expandProductsByVariant(products, shouldExpand = true)');
    expect(source).toContain('if (!shouldExpand) {');
    expect(source).not.toContain('let expandedProducts = this.expandProductsByVariant(products);');
  });

  it('keeps parent product cards by selecting the first available variant', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('getFirstAvailableVariant(product)');
    expect(source).toContain('const defaultVariant = this.getFirstAvailableVariant(product);');
    expect(source).toContain('if (product.variants?.length > 0 && !defaultVariant) {');
    expect(source).not.toContain('const defaultVariant = product.variants?.[0];');
  });

  it('does not mark sellable Storefront variants out of stock from zero quantity alone', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('isVariantOutOfStock(product)');
    expect(source).toContain('if (product.available === false) {');
    expect(source).toContain('const outOfStock = this.isVariantOutOfStock(product);');
    expect(source).toContain('const atMaxStock = available !== null && available > 0 && currentQuantity >= available;');
    expect(source).toContain('if (available !== null && available > 0 && quantity > available) {');
    expect(source).not.toContain('quantityAvailable === 0 AND not backorder-accepting');
  });

  it('renders inactive category section rows after the active category grid', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('createCategorySectionRows(this.currentStepIndex)');
    expect(source).toContain('fpb-category-section-rows');
    expect(source).toContain('fpb-category-section-row--collapsed');
    expect(source).toContain('if (categoryEntries.length <= 1) return null;');
    expect(source).toContain('categoryRowsContainer.appendChild(categoryRow);');
  });

  it('adds a multiple-category timeline item between the paid step and add-ons step', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/bundle-widget-full-page.js'),
      'utf8',
    );

    expect(source).toContain('buildStepTimelineEntries()');
    expect(source).toContain('shouldRenderMultipleCategoryTimelineEntry(step)');
    expect(source).toContain("label: 'Multiple Categories'");
    expect(source).toContain("type: 'multiple_categories'");
    expect(source).toContain('timelineEntries.forEach((entry, displayIndex)');
    expect(source).toContain('const step = entry.step;');
    expect(source).toContain('stepEl.dataset.timelineType = entry.type;');
  });
});
