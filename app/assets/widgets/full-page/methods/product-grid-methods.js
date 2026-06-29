import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { createBundleBannerElement, createStepBannerImageElement } from '../../shared/components/bundle-banners.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from '../../shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from '../../shared/engine/cart-lines.js';


export function shouldCategoryTabActivateProducts({
  designPreset,
  viewportWidth,
  hasCategoryEntries,
}) {
  return !(designPreset === 'STANDARD' && hasCategoryEntries && viewportWidth < 768);
}

export const fullPageProductGridMethods = {
scrollActiveCategoryTitleIntoView() {
  if (this.getFullPageDesignPreset?.() !== 'STANDARD') return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const title = this.elements?.stepsContainer?.querySelector('.fpb-step-category-title');
      if (!title) return;

      const targetTop = title.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    });
  });
},

activateStepCategory(categoryId) {
  this.activeCollectionId = categoryId;
  Promise.resolve(this.reRenderFullPage()).then(() => {
    this.scrollActiveCategoryTitleIntoView();
  });
},

createCategorySectionRows(stepIndex, placement = 'all') {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const step = this.selectedBundle.steps[stepIndex];
  const categoryEntries = this.getStepCategoryTabEntries(step);
  if (categoryEntries.length <= 1) return null;

  const activeCategoryId = this.getActiveStepCategoryId(step);
  const activeCategoryIndex = categoryEntries.findIndex(entry => entry.id === activeCategoryId);
  const inactiveCategoryEntries = categoryEntries.filter((entry, index) => {
    if (entry.id === activeCategoryId) return false;
    if (placement === 'before') return index < activeCategoryIndex;
    if (placement === 'after') return index > activeCategoryIndex;
    return true;
  });
  if (inactiveCategoryEntries.length === 0) return null;

  const categoryRowsContainer = document.createElement('div');
  categoryRowsContainer.className = 'fpb-category-section-rows';

  inactiveCategoryEntries.forEach(entry => {
    const categoryRow = document.createElement('button');
    categoryRow.type = 'button';
    categoryRow.className = 'fpb-category-section-row fpb-category-section-row--collapsed';
    categoryRow.textContent = entry.title;
    categoryRow.addEventListener('click', () => {
      this.activateStepCategory(entry.id);
    });
    categoryRowsContainer.appendChild(categoryRow);
  });

  return categoryRowsContainer;
},

getNoProductsAvailableMessage() {
  if (typeof this._resolveText === 'function') {
    return this._resolveText('noProductsAvailable', 'No Products Available');
  }

  return 'No Products Available';
},

createCategoryTabs(stepIndex) {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const step = this.selectedBundle.steps[stepIndex];
  const categoryEntries = this.getStepCategoryTabEntries(step);
  const hasCategoryEntries = categoryEntries.length > 0;

  if (categoryEntries.length === 0 && (!step.collections || step.collections.length === 0)) {
    return null;
  }

  const customFilters = Array.isArray(step.filters) && step.filters.length > 0
    ? step.filters
    : null;

  let tabEntries;
  if (hasCategoryEntries) {
    tabEntries = categoryEntries;
  } else if (customFilters) {
    tabEntries = customFilters
      .map(f => {
        const col = step.collections.find(c => (c.handle || c.id) === f.collectionHandle);
        return col ? { id: col.id, title: f.label } : null;
      })
      .filter(Boolean);
  } else {
    tabEntries = step.collections.map(c => ({ id: c.id, title: c.title }));
  }

  if (tabEntries.length === 0) {
    return null;
  }

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'category-tabs';

  const activeCategoryId = hasCategoryEntries ? this.getActiveStepCategoryId(step) : this.activeCollectionId;

  if (!hasCategoryEntries) {
    const allTab = document.createElement('button');
    allTab.className = 'category-tab';
    if (!this.activeCollectionId) {
      allTab.classList.add('active');
    }
    allTab.innerHTML = `<span class="tab-label">All</span>`;
    allTab.addEventListener('click', () => {
      this.activeCollectionId = null;
      this.reRenderFullPage();
    });
    tabsContainer.appendChild(allTab);
  }

  tabEntries.forEach(entry => {
    const tab = document.createElement('button');
    tab.className = 'category-tab';
    if (activeCategoryId === entry.id) {
      tab.classList.add('active');
    }
    tab.innerHTML = `<span class="tab-label">${ComponentGenerator.escapeHtml(entry.title)}</span>`;
    tab.addEventListener('click', () => {
      if (shouldCategoryTabActivateProducts({
        designPreset: this.getFullPageDesignPreset?.(),
        viewportWidth: window.innerWidth,
        hasCategoryEntries,
      })) {
        this.activateStepCategory(entry.id);
        return;
      }

      tabsContainer.querySelectorAll('.category-tab').forEach(tabElement => {
        tabElement.classList.remove('active');
      });
      tab.classList.add('active');
    });
    tabsContainer.appendChild(tab);
  });

  return tabsContainer;
},

orderProductsForActiveCategory(products, activeCategory, stepIndex) {
  if (!activeCategory) return products;

  const productOrder = new Map();
  const addProductId = (productId) => {
    const normalizedProductId = this.extractId(productId) || productId;
    if (normalizedProductId && !productOrder.has(normalizedProductId)) {
      productOrder.set(normalizedProductId, productOrder.size);
    }
  };

  (activeCategory.productIds || []).forEach(addProductId);
  (activeCategory.handles || []).forEach(handle => {
    const collectionProductIds = this.stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
    collectionProductIds.forEach(addProductId);
  });

  return products
    .map((product, index) => {
      const productId = product.parentProductId || product.id || '';
      return {
        product,
        index,
        order: productOrder.get(this.extractId(productId) || productId),
      };
    })
    .filter(entry => entry.order !== undefined)
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(entry => entry.product);
},

// Create horizontal scrollable product grid
createFullPageProductGrid(stepIndex) {
  const grid = document.createElement('div');
  grid.className = 'full-page-product-grid';

  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return grid;
  }

  const step = this.selectedBundle.steps[stepIndex];
  // Use processed product data with proper variant IDs
  let products = this.stepProductData[stepIndex] || [];


  const activeCategory = this.getActiveStepCategoryEntry(step);
  const activeCollectionId = activeCategory ? activeCategory.id : this.activeCollectionId;

  // Filter by active category/collection if selected
  if (activeCollectionId) {
    if (activeCategory) {
      const allowedProductIds = new Set();
      activeCategory.productIds.forEach(productId => {
        allowedProductIds.add(this.extractId(productId) || productId);
      });
      activeCategory.handles.forEach(handle => {
        const collectionProductIds = this.stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
        collectionProductIds.forEach(productId => {
          allowedProductIds.add(this.extractId(productId) || productId);
        });
      });

      if (allowedProductIds.size > 0) {
        products = products.filter(p => {
          const numericPid = p.parentProductId || p.id || '';
          return allowedProductIds.has(numericPid);
        });
        products = this.orderProductsForActiveCategory(products, activeCategory, stepIndex);
      }
    } else if (step.collections) {
      const activeCollection = step.collections.find(c => c.id === activeCollectionId);
    if (activeCollection && activeCollection.handle) {
      const membershipKey = `${stepIndex}:${activeCollection.handle}`;
      const collectionProductIds = this.stepCollectionProductIds[membershipKey];
      if (collectionProductIds && collectionProductIds.length > 0) {
        products = products.filter(p => {
          // parentProductId is numeric product ID (set when displayVariantsAsIndividual is true)
          // p.id is numeric product ID otherwise
          const numericPid = p.parentProductId || p.id || '';
          return collectionProductIds.some(cid => {
            const numericCid = this.extractId(cid) || cid;
            return numericPid === numericCid;
          });
        });
      }
    }
    }
  }

  const shouldDisplayVariantsAsIndividual = this.shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory);
  let expandedProducts = this.expandProductsByVariant(products, shouldDisplayVariantsAsIndividual);

  // Filter by search query if active
  if (this.searchQuery && this.searchQuery.trim()) {
    const query = this.searchQuery.toLowerCase().trim();
    expandedProducts = expandedProducts.filter(product => {
      const title = (product.title || '').toLowerCase();
      const variantTitle = (product.variantTitle || '').toLowerCase();
      const parentTitle = (product.parentTitle || '').toLowerCase();
      return title.includes(query) || variantTitle.includes(query) || parentTitle.includes(query);
    });
  }

  if (expandedProducts.length === 0) {
    // Show appropriate message based on whether there's a search query
    const message = this.searchQuery
      ? `No products match "${ComponentGenerator.escapeHtml(this.searchQuery)}"`
      : ComponentGenerator.escapeHtml(this.getNoProductsAvailableMessage());
    grid.innerHTML = `<p class="no-products">${message}</p>`;
    return grid;
  }


  // Check if step is at capacity (adding 1 more item would be blocked)
  // When at capacity, unselected cards are dimmed
  const stepSelections = this.selectedProducts[stepIndex] || {};
  const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
  const isStepAtCapacity = !capacityCheck.allowed;

  // Create product cards using ComponentGenerator
  expandedProducts.forEach(product => {
    const productCard = this.createProductCard(product, stepIndex);
    const productId = product.variantId || product.id;
    const currentQty = stepSelections[productId] || 0;
    // Dim unselected cards when step quota is full
    if (isStepAtCapacity && currentQty === 0) {
      productCard.classList.add('dimmed');
    }
    grid.appendChild(productCard);
  });

  return grid;
},

// Expand products with multiple variants into separate product entries
// Each variant becomes its own card showing "Product Title - Variant Name"
expandProductsByVariant(products, shouldExpand = true) {
  if (!shouldExpand) {
    return products;
  }

  return products.flatMap(product => {
    // If product already has a variantId and parentProductId, it was already expanded
    if (product.parentProductId && product.variantId) {
      return [product];
    }

    // If product has multiple variants, expand into separate cards
    if (product.variants && product.variants.length > 1) {
      return product.variants
        .filter(variant => variant.available !== false) // Only show available variants
        .map(variant => {
          // Use variant image if available, fallback to product image
          const imageUrl = variant.image?.src
            || variant.image?.url
            || (typeof variant.image === 'string' ? variant.image : null)
            || variant.imageUrl
            || product.imageUrl
            || product.featuredImage?.url
            || product.images?.[0]?.url
            || product.images?.[0]?.src
            || product.images?.[0]?.originalSrc
            || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            ...product,
            id: variant.id,
            title: product.title,
            variantTitle: variant.title === 'Default Title' ? '' : variant.title,
            imageUrl,
            price: typeof variant.price === 'number' ? variant.price : (parseFloat(variant.price || '0') * 100),
            compareAtPrice: variant.compareAtPrice ? (typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : parseFloat(variant.compareAtPrice) * 100) : null,
            variantId: variant.id,
            available: variant.available !== false,
            parentProductId: product.id,
            parentTitle: product.title,
            // Remove variants array from individual cards to prevent showing variant selector
            variants: null
          };
        });
    }

    // Single variant or no variants - return as-is
    return [product];
  });
},

// Create loading skeleton for product grid - solid pulsating cards
// No internal button/quantity skeletons - just clean solid cards
createProductGridLoadingState() {
  return `
    <div class="full-page-product-grid">
      ${Array(6).fill(0).map(() => `
        <div class="product-card skeleton-loading">
          <div class="skeleton-card-content"></div>
        </div>
      `).join('')}
    </div>
  `;
},

// Preload ALL remaining steps' products in the background (parallel).
// Called after step 0 renders so subsequent step transitions feel instant.
// loadStepProducts() is a no-op when data is already cached, so this is safe to call
// at any step without re-fetching.
preloadAllSteps() {
  const steps = this.selectedBundle?.steps;
  if (!steps) return;

  steps.forEach((_, index) => {
    // Skip the step already on screen — it's been loaded synchronously
    if (index === this.currentStepIndex) return;
    // Skip steps already cached
    if (this.stepProductData[index]?.length > 0) return;

    this.loadStepProducts(index).catch(() => {
      // Silent — background prefetch; errors here don't affect the user
    });
  });
},

// Keep legacy alias so any call sites that still say preloadNextStep() keep working
preloadNextStep() {
  this.preloadAllSteps();
},

// Create a product card DOM element for full-page layout
};
