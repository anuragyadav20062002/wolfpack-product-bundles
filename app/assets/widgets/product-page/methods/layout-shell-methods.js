import { CurrencyManager, ComponentGenerator, ToastManager } from '../../../bundle-widget-components.js';
import { getDiscountProgressData } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { formatProductPageStepValidationToast } from './modal-state-methods.js';

export function shouldHideInpageStepChrome({ isCascade = false, steps = [], step = null } = {}) {
  if (!isCascade) return false;

  const categories = Array.isArray(step?.categories) ? step.categories : [];
  return Array.isArray(steps) && steps.length === 1 && categories.length <= 1;
}

export function shouldUseCascadeStepFlow({ isInpage = false, isCascade = false, isGrid = false, steps = [] } = {}) {
  return Boolean(isInpage && (isCascade || isGrid) && Array.isArray(steps) && steps.length > 1);
}

export function getCascadeStepNavigationState({
  currentStepIndex = 0,
  direction = 0,
  stepCount = 0,
  isCurrentStepValid = false,
} = {}) {
  const lastStepIndex = Math.max(0, Number(stepCount || 0) - 1);
  const current = Math.min(Math.max(0, Number(currentStepIndex || 0)), lastStepIndex);

  if (direction < 0) {
    return {
      targetStepIndex: Math.max(0, current - 1),
      blocked: false,
      isFinal: false,
    };
  }

  if (current >= lastStepIndex) {
    return { targetStepIndex: current, blocked: false, isFinal: true };
  }

  if (!isCurrentStepValid) {
    return { targetStepIndex: current, blocked: true, isFinal: false };
  }

  return { targetStepIndex: current + 1, blocked: false, isFinal: false };
}

export function getCogniveStepRenderSequence({ stepCount = 0, currentStepIndex = 0 } = {}) {
  const count = Math.max(0, Number(stepCount || 0));
  const activeIndex = Math.min(Math.max(0, Number(currentStepIndex || 0)), Math.max(0, count - 1));
  const sequence = [];

  for (let stepIndex = 0; stepIndex < count; stepIndex += 1) {
    sequence.push({ type: 'header', stepIndex });
    if (stepIndex === activeIndex) {
      sequence.push({ type: 'body', stepIndex });
    }
  }

  return sequence;
}

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
  img.style.width = '100%';
  img.style.display = 'block';
  wrapper.appendChild(img);
  return wrapper;
},

// In-page templates use an active-step flow when multiple steps are configured.
renderProductPageLayout() {
  const usesCascadeStepFlow = this._usesCascadeStepFlow();
  const lastStepIndex = Math.max(0, this.selectedBundle.steps.length - 1);
  this.currentStepIndex = Math.min(Math.max(0, this.currentStepIndex), lastStepIndex);

  if (usesCascadeStepFlow && this._isProductPageGridTemplate?.() === true) {
    this._renderCogniveStepFlowLayout();
    return;
  }

  if (usesCascadeStepFlow) {
    this.elements.stepsContainer.appendChild(this._createCascadeStepFlowHeader());
  }

  const stepsToRender = usesCascadeStepFlow
    ? [[this.selectedBundle.steps[this.currentStepIndex], this.currentStepIndex]]
    : this.selectedBundle.steps.map((step, stepIndex) => [step, stepIndex]);

  stepsToRender.forEach(([step, stepIndex]) => {
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
        const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
        if (this._isProductPageModalSlotTemplate()) {
          this._appendModalSlotEmptyCards(target, step, stepIndex, totalQty);
        } else if (!this.validateStep(stepIndex)) {
          target.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
        }
      } else {
        if (this._isProductPageModalSlotTemplate()) {
          this._appendModalSlotEmptyCards(target, step, stepIndex, 0);
        } else {
          target.appendChild(this.createAddMoreCard(step, stepIndex, 0));
        }
      }
    }
  });
},

_renderCogniveStepFlowLayout() {
  const sequence = getCogniveStepRenderSequence({
    stepCount: this.selectedBundle.steps.length,
    currentStepIndex: this.currentStepIndex,
  });

  sequence.forEach(({ type, stepIndex }) => {
    const step = this.selectedBundle.steps[stepIndex];
    if (type === 'header') {
      this.elements.stepsContainer.appendChild(this._createCogniveStepHeader(step, stepIndex));
      return;
    }

    const section = this._createInpageStepSection(step, stepIndex);
    const target = section.querySelector('.bw-ppb-inpage-step-grid');
    this.elements.stepsContainer.appendChild(section);

    const banner = this._createStepBannerImage(step);
    if (banner) target.appendChild(banner);
    this._renderInpageStepProducts(stepIndex, target);
  });
},

_createCogniveStepHeader(step, stepIndex) {
  const button = document.createElement('button');
  const isActive = stepIndex === this.currentStepIndex;
  button.type = 'button';
  button.className = `bw-ppb-cognive-step${isActive ? ' is-active' : ''}${this.validateStep(stepIndex) ? ' is-complete' : ''}`;
  button.setAttribute('aria-current', isActive ? 'step' : 'false');
  button.innerHTML = `
    <span class="bw-ppb-cognive-step__number">${stepIndex + 1}</span>
    <span class="bw-ppb-cognive-step__label">${ComponentGenerator.escapeHtml(step.pageTitle || step.name || `Step ${stepIndex + 1}`)}</span>
  `;
  button.addEventListener('click', () => {
    if (isActive) return;
    if (!this.isStepAccessible(stepIndex)) {
      const currentStep = this.selectedBundle.steps[this.currentStepIndex];
      ToastManager.show(
        formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before proceeding.',
        4000,
        {
          dismissible: false,
          className: 'bundle-toast--cognive',
        },
      );
      return;
    }
    this.currentStepIndex = stepIndex;
    this.renderSteps();
    this.renderFooter();
    this.updateAddToCartButton();
  });
  return button;
},

_usesCascadeStepFlow() {
  return shouldUseCascadeStepFlow({
    isInpage: this._isProductPageInpageTemplate?.() === true,
    isCascade: this._isProductPageCascadeTemplate?.() === true,
    isGrid: this._isProductPageGridTemplate?.() === true,
    steps: this.selectedBundle?.steps,
  });
},

_createCascadeStepFlowHeader() {
  const header = document.createElement('div');
  header.className = 'bw-ppb-cascade-step-flow';

  this.selectedBundle.steps.forEach((step, stepIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bw-ppb-cascade-step-flow__step';
    button.classList.toggle('is-active', stepIndex === this.currentStepIndex);
    button.classList.toggle('is-complete', this.validateStep(stepIndex));
    button.setAttribute('aria-current', stepIndex === this.currentStepIndex ? 'step' : 'false');
    button.disabled = stepIndex > this.currentStepIndex && !this.isStepAccessible(stepIndex);
    button.innerHTML = `
      <span class="bw-ppb-cascade-step-flow__number">${stepIndex + 1}</span>
      <span class="bw-ppb-cascade-step-flow__label">${ComponentGenerator.escapeHtml(step.pageTitle || step.name || `Step ${stepIndex + 1}`)}</span>
    `;
    button.addEventListener('click', () => {
      if (button.disabled || stepIndex === this.currentStepIndex) return;
      this.currentStepIndex = stepIndex;
      this.renderSteps();
      this.renderFooter();
      this.updateAddToCartButton();
      this._focusCascadeStepFlowButton(stepIndex);
    });
    header.appendChild(button);
  });

  return header;
},

_focusCascadeStepFlowButton(stepIndex) {
  const buttons = this.elements?.stepsContainer
    ?.querySelectorAll?.('.bw-ppb-cascade-step-flow__step') || [];
  const target = buttons[stepIndex];
  if (target && typeof target.focus === 'function') {
    target.focus();
  }
},

navigateCascadeStep(direction) {
  if (!this._usesCascadeStepFlow()) return false;

  const navigation = getCascadeStepNavigationState({
    currentStepIndex: this.currentStepIndex,
    direction,
    stepCount: this.selectedBundle.steps.length,
    isCurrentStepValid: this.validateStep(this.currentStepIndex),
  });

  if (navigation.blocked || navigation.isFinal || navigation.targetStepIndex === this.currentStepIndex) {
    return false;
  }

  this.currentStepIndex = navigation.targetStepIndex;
  this.renderSteps();
  this.renderFooter();
  this.updateAddToCartButton();
  this._focusCascadeStepFlowButton(this.currentStepIndex);
  return true;
},

_createInpageStepSection(step, stepIndex) {
  const section = document.createElement('div');
  const preset = this._getProductPageDesignPreset();
  const isCascade = this._isProductPageCascadeTemplate?.() === true;
  const hideStepChrome = shouldHideInpageStepChrome({
    isCascade,
    steps: this.selectedBundle?.steps,
    step,
  });
  section.className = `bw-ppb-inpage-step-section bw-ppb-inpage-step-section--${preset.toLowerCase()}${isCascade ? ' wpbMixCascadeBodyWrapper' : ''}`;

  if (!hideStepChrome) {
    const usesCascadeStepFlow = this._usesCascadeStepFlow();
    if (!usesCascadeStepFlow) {
      const title = document.createElement('div');
      title.className = `bw-ppb-inpage-step-title${isCascade ? ' wpbMixCascadeBodyHeaderCategoryName' : ''}`;
      title.textContent = step.pageTitle || step.name || '';
      section.appendChild(title);
    }

    const tabs = this._createInpageCategoryTabs(step, stepIndex);
    if (tabs) section.appendChild(tabs);
  }

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
  tabs.className = `bw-ppb-inpage-category-tabs${isCascade ? ' wpbMixCascadeCategoryTabsWrapper' : ''}`;

  categories.forEach((category, categoryIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    const isActive = categoryIndex === this.activeInpageCategoryIndexes[stepIndex];
    button.className = `bw-ppb-inpage-category-tab${isActive ? ' active' : ''}${isCascade ? ` wpbMixCascadeCategoryTab${isActive ? ' wpbMixCascadeCategoryTab--active' : ''}` : ''}`;
    button.dataset.categoryIndex = String(categoryIndex);
    button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
    button.addEventListener('click', () => {
      this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
      tabs.querySelectorAll('.bw-ppb-inpage-category-tab').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.classList.toggle('wpbMixCascadeCategoryTab--active', active);
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
  if (categories.length === 0) return products;

  const activeIndex = this.activeInpageCategoryIndexes[stepIndex] || 0;
  const category = categories[activeIndex];
  const categoryProductIds = this._getCategoryProductIds(category);
  const configuredProducts = [
    ...(Array.isArray(category?.products) ? category.products : []),
    ...(Array.isArray(category?.selectedProducts) ? category.selectedProducts : []),
  ];

  if (categoryProductIds.size === 0) {
    return this._categoryHasCollections(category) ? products : [];
  }

  const categoryProducts = categories.length > 1
    ? products.filter(product => {
      const productId = this.extractId(product.parentProductId || product.id);
      return categoryProductIds.has(productId);
    })
    : products;

  return categoryProducts.flatMap(product => {
    const productId = this.extractId(product.parentProductId || product.id);
    const configuredProduct = configuredProducts.find(candidate => (
      this.extractId(candidate?.id || candidate?.graphqlId || candidate?.productId) === productId
    ));
    const configuredVariantIds = new Set(
      (Array.isArray(configuredProduct?.variants) ? configuredProduct.variants : [])
        .map(variant => this.extractId(variant?.id || variant?.variantId))
        .filter(Boolean)
    );

    if (configuredVariantIds.size === 0 || !Array.isArray(product?.variants)) {
      return [product];
    }

    const variants = product.variants.filter(variant => (
      configuredVariantIds.has(this.extractId(variant?.id || variant?.variantId))
    ));
    if (variants.length === 0) return [];

    const selectedVariant = variants.find(variant => variant?.available !== false) || variants[0];
    const variantImageUrl = selectedVariant?.image?.src
      || selectedVariant?.image?.url
      || selectedVariant?.imageUrl
      || product.imageUrl;

    return [{
      ...product,
      variantId: this.extractId(selectedVariant?.id || selectedVariant?.variantId),
      variantTitle: selectedVariant?.title && selectedVariant.title !== 'Default Title'
        ? selectedVariant.title
        : '',
      price: selectedVariant?.price ?? product.price,
      compareAtPrice: selectedVariant?.compareAtPrice ?? null,
      available: selectedVariant?.available !== false,
      quantityAvailable: typeof selectedVariant?.quantityAvailable === 'number'
        ? selectedVariant.quantityAvailable
        : null,
      currentlyNotInStock: selectedVariant?.currentlyNotInStock === true,
      imageUrl: variantImageUrl,
      variants,
    }];
  });
}
};
