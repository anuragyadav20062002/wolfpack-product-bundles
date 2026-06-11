import { CurrencyManager, ComponentGenerator } from '../../../bundle-widget-components.js';
import { getDiscountProgressData } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';

export const ProductPageLayoutShellMethods = {
renderUI() {
  this._renderDirectDefaultProducts();
  this.renderSteps();
  this.renderQuantityOptionPills();
  this.renderFooter();
  this.updateAddToCartButton();
},

renderSteps() {
  // Clear existing steps
  this.elements.stepsContainer.innerHTML = '';
  this._markProductPageTemplate();

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return;
  }

  // Check bundle type and render accordingly
  const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

  if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    // Full-page bundle: Render with tabs layout
    this.renderFullPageLayout();
  } else {
    // Product-page bundle: Render with step boxes (current implementation)
    this.renderProductPageLayout();
  }
},

_renderDirectDefaultProducts() {
  const el = this.elements.defaultProducts;
  if (!el) return;
  el.innerHTML = '';

  const data = this._getDirectDefaultProductsData();
  const products = this.directDefaultProducts || [];
  if (!data || products.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';

  if (data.defaultProductsTitle) {
    const title = document.createElement('h3');
    title.className = 'bw-default-products__title';
    title.textContent = data.defaultProductsTitle;
    el.appendChild(title);
  }

  const list = document.createElement('div');
  list.className = 'bw-default-products__list';
  const currencyInfo = CurrencyManager.getCurrencyInfo();

  products.forEach(product => {
    const quantity = this.getSelectedQuantity(0, product.variantId) || product.defaultRequiredQuantity || 1;
    const line = document.createElement('div');
    line.className = 'bw-default-products__line';

    const details = document.createElement('div');
    details.className = 'bw-default-products__details';

    const image = document.createElement('img');
    image.className = 'bw-default-products__image';
    image.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    image.alt = product.title || '';
    details.appendChild(image);

    const text = document.createElement('div');
    text.className = 'bw-default-products__text';

    const name = document.createElement('span');
    name.className = 'bw-default-products__name';
    name.textContent = `${product.title} x ${quantity}`;
    text.appendChild(name);

    const price = document.createElement('span');
    price.className = 'bw-default-products__price';
    price.textContent = CurrencyManager.convertAndFormat(product.price * quantity, currencyInfo);
    text.appendChild(price);
    details.appendChild(text);
    line.appendChild(details);

    const quantityBadge = document.createElement('span');
    quantityBadge.className = 'bw-default-products__quantity';
    quantityBadge.textContent = `x ${quantity}`;
    line.appendChild(quantityBadge);
    list.appendChild(line);
  });

  el.appendChild(list);
},

// Returns a full-width banner image element for a step, or null if not configured
_createStepBannerImage(step) {
  if (!step?.bannerImageUrl) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'step-banner-image';
  const img = document.createElement('img');
  img.src = step.bannerImageUrl;
  img.alt = step.name || '';
  img.style.cssText = 'width:100%;display:block;';
  wrapper.appendChild(img);
  return wrapper;
},

// Product-page bundle layout: always renders all steps at once.
// Each step gets the appropriate card variant based on its type and selection state.
renderProductPageLayout() {
  this.selectedBundle.steps.forEach((step, stepIndex) => {
    if (this._isProductPageInpageTemplate()) {
      const section = this._createInpageStepSection(step, stepIndex);
      const target = section.querySelector('.bw-ppb-inpage-step-grid');
      this.elements.stepsContainer.appendChild(section);

      const banner = this._createStepBannerImage(step);
      if (banner) target.appendChild(banner);

      this._renderInpageStepProducts(stepIndex, target);
      return;
    }

    const section = this._isProductPageModalSlotTemplate()
      ? this._createModalSlotStepSection(step)
      : this._isProductPageCogniveTemplate()
        ? this._createInpageStepSection(step, stepIndex)
      : null;
    const target =
      section?.querySelector('.bw-ppb-modal-slot-grid')
      || section?.querySelector('.bw-ppb-inpage-step-grid')
      || this.elements.stepsContainer;

    if (section) {
      this.elements.stepsContainer.appendChild(section);
    }

    // Inject per-step banner image above this step's card(s)
    const banner = this._createStepBannerImage(step);
    if (banner) target.appendChild(banner);

    if (step.isDefault) {
      // Default/compulsory slot — always pre-filled, not removable
      const product = this._getDefaultStepProduct(stepIndex);
      if (product) {
        const card = this.createDefaultProductCard(step, stepIndex, product);
        target.appendChild(card);
      } else {
        // Product data not yet loaded — show placeholder
        const card = this._createDefaultLoadingCard(step, stepIndex);
        target.appendChild(card);
      }
    } else if (step.isFreeGift) {
      // Free gift slot — ribbon icon, locked until paid steps complete
      const card = this.createFreeGiftSlotCard(step, stepIndex);
      target.appendChild(card);
    } else {
      // Regular selectable step
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

      if (selectedEntries.length > 0) {
        const products = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);
        selectedEntries.forEach(([variantId, qty]) => {
          const product = this.findProductBySelectionKey(products, variantId);
          if (product) {
            for (let i = 0; i < qty; i++) {
              const card = this.createSelectedProductCard(
                { product, stepIndex, step, variantId, instanceIndex: i },
                i
              );
              target.appendChild(card);
            }
          }
        });
        // Show "add more" card if step condition not yet met
        if (!this.validateStep(stepIndex)) {
          const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
          target.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
        }
      } else {
        // No selection yet — use EB Product Slots when enabled, otherwise show a simple add CTA.
        let card;
        if (this._shouldRenderProductSlots()) {
          card = this.createEmptyStateCard(step, stepIndex, 0);
        } else {
          card = this.createAddMoreCard(step, stepIndex, 0);
        }
        target.appendChild(card);
      }
    }
  });
},

_shouldRenderProductSlots() {
  return this.selectedBundle?.productSlotsEnabled === true;
},

_createInpageStepSection(step, stepIndex) {
  const section = document.createElement('div');
  const preset = this._getProductPageDesignPreset();
  const isCascade = this._isProductPageCascadeTemplate?.() === true;
  section.className = `bw-ppb-inpage-step-section bw-ppb-inpage-step-section--${preset.toLowerCase()}${isCascade ? ' gbbMixCascadeBodyWrapper' : ''}`;

  const title = document.createElement('div');
  title.className = `bw-ppb-inpage-step-title${isCascade ? ' gbbMixCascadeBodyHeaderCategoryName' : ''}`;
  title.textContent = step.pageTitle || step.name || '';
  section.appendChild(title);

  const tabs = this._createInpageCategoryTabs(step, stepIndex);
  if (tabs) section.appendChild(tabs);

  const grid = document.createElement('div');
  grid.className = 'bw-ppb-inpage-step-grid';
  section.appendChild(grid);

  return section;
},

_createInpageCategoryTabs(step, stepIndex) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length === 0) return null;

  if (typeof this.activeInpageCategoryIndexes[stepIndex] !== 'number') {
    this.activeInpageCategoryIndexes[stepIndex] = 0;
  }

  const tabs = document.createElement('div');
  const isCascade = this._isProductPageCascadeTemplate?.() === true;
  tabs.className = `bw-ppb-inpage-category-tabs${isCascade ? ' gbbMixCascadeCategoryTabsWrapper' : ''}`;

  categories.forEach((category, categoryIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    const isActive = categoryIndex === this.activeInpageCategoryIndexes[stepIndex];
    button.className = `bw-ppb-inpage-category-tab${isActive ? ' active' : ''}${isCascade ? ` gbbMixCascadeCategoryTab${isActive ? ' gbbMixCascadeCategoryTab--active' : ''}` : ''}`;
    button.dataset.categoryIndex = String(categoryIndex);
    button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
    button.addEventListener('click', () => {
      this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
      tabs.querySelectorAll('.bw-ppb-inpage-category-tab').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.classList.toggle('gbbMixCascadeCategoryTab--active', active);
      });
      const grid = tabs.parentElement?.querySelector('.bw-ppb-inpage-step-grid');
      if (grid) this._renderInpageStepProducts(stepIndex, grid);
    });
    tabs.appendChild(button);
  });

  return tabs;
},

_getInpageCategoryLabel(category, categoryIndex) {
  return category?.title || category?.name || `Category ${categoryIndex + 1}`;
},

_getCategoryProductIds(category) {
  const ids = new Set();
  const addProductId = (product) => {
    const id = product?.id || product?.graphqlId || product?.productId;
    if (id) ids.add(this.extractId(id));
  };

  (category?.products || []).forEach(addProductId);
  (category?.selectedProducts || []).forEach(addProductId);
  return ids;
},

_categoryHasCollections(category) {
  return Boolean(
    category?.collections?.length
    || category?.collectionsData?.length
    || category?.collectionsSelectedData?.length
  );
},

_filterProductsForInpageCategory(step, products, stepIndex) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length <= 1) return products;

  const activeIndex = this.activeInpageCategoryIndexes[stepIndex] || 0;
  const category = categories[activeIndex];
  const categoryProductIds = this._getCategoryProductIds(category);

  if (categoryProductIds.size === 0) {
    return this._categoryHasCollections(category) ? products : [];
  }

  return products.filter(product => {
    const productId = this.extractId(product.parentProductId || product.id);
    return categoryProductIds.has(productId);
  });
}
};
