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


export const fullPageTimelineBannerMethods = {
getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex) {
  const entries = Array.isArray(timelineEntries) ? timelineEntries : [];
  const timelinePageSize = this.getStandardTimelinePageSize();

  if (entries.length <= timelinePageSize) {
    this.standardTimelineWindowStart = 0;
    this.standardTimelineLastActiveEntryIndex = activeEntryIndex;
    return {
      visibleEntries: entries,
      windowStart: 0,
      pageSize: timelinePageSize,
      isPaged: false,
    };
  }

  const activeChanged = this.standardTimelineLastActiveEntryIndex !== activeEntryIndex;
  let windowStart = Number.isFinite(this.standardTimelineWindowStart)
    ? this.standardTimelineWindowStart
    : 0;

  if (activeChanged && (activeEntryIndex < windowStart || activeEntryIndex >= windowStart + timelinePageSize)) {
    windowStart = activeEntryIndex;
  }

  if (windowStart + timelinePageSize > entries.length) {
    windowStart = entries.length - timelinePageSize;
  }

  windowStart = Math.max(0, windowStart);
  this.standardTimelineWindowStart = windowStart;
  this.standardTimelineLastActiveEntryIndex = activeEntryIndex;

  return {
    visibleEntries: entries.slice(windowStart, windowStart + timelinePageSize),
    windowStart,
    pageSize: timelinePageSize,
    isPaged: true,
  };
},

ensureTimelinePagingStyles() {
  return true;
},

shouldRenderMultipleCategoryTimelineEntry(step) {
  if (!step || step.isFreeGift === true) return false;
  return this.getStepCategoryTabEntries(step).length > 1;
},

// Create circular icon-based step timeline with connecting lines and three icon states
createStepTimeline() {
  if (this._usesReferenceStepBarTimeline()) {
    return this.createStandardStepTimeline();
  }

  const timeline = document.createElement('div');
  timeline.className = 'step-timeline';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return timeline;
  }

  const timelineEntries = this.buildStepTimelineEntries();
  const totalEntryCount = Math.max(timelineEntries.length, 1);
  const hasMultipleCategoryEntryForStep = (entry) => (
    this.shouldRenderMultipleCategoryTimelineEntry(entry?.step)
  );
  const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
    entry.type === 'multiple_categories'
      ? Number(entry.stepIndex) === Number(this.currentStepIndex)
      : entry.type === 'step'
        ? Number(entry.stepIndex) === Number(this.currentStepIndex)
          && !hasMultipleCategoryEntryForStep(entry)
        : false
  )));
  const {
    visibleEntries,
    windowStart,
    pageSize,
    isPaged,
  } = this.getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex);
  const visibleEntryCount = Math.max(visibleEntries.length, 1);

  if (isPaged) {
    this.ensureTimelinePagingStyles();
  }
  timeline.classList.toggle('step-timeline--paged', isPaged);
  timeline.dataset.windowStart = String(windowStart);
  timeline.dataset.pageSize = String(pageSize);
  timeline.dataset.totalEntries = String(totalEntryCount);

  const createTimelineArrow = (direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = direction === 'prev'
      ? 'timeline-navigation-arrow timeline-navigation-arrow--prev'
      : 'timeline-navigation-arrow timeline-navigation-arrow--next';
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous timeline items' : 'Next timeline items');
    button.textContent = direction === 'prev' ? '‹' : '›';
    button.addEventListener('click', () => {
      if (direction === 'prev') {
        this.standardTimelineWindowStart = Math.max(0, windowStart - pageSize);
      } else {
        this.standardTimelineWindowStart = Math.min(totalEntryCount - pageSize, windowStart + pageSize);
      }
      this.reRenderFullPage();
    });
    return button;
  };

  if (isPaged && windowStart > 0) {
    timeline.appendChild(createTimelineArrow('prev'));
  }

  if (isPaged && windowStart + visibleEntryCount < totalEntryCount) {
    timeline.appendChild(createTimelineArrow('next'));
  }

  visibleEntries.forEach((entry, displayIndex) => {
    const step = entry.step;
    const index = entry.stepIndex;
    const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
    const isCategoryEntry = entry.type === 'multiple_categories';
    const timelineState = getTimelineEntryState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isCompleted: isCategoryEntry
        ? this.isStepCompleted(index)
        : this.isStepCompleted(index) || (hasMultipleCategoryEntry && index === this.currentStepIndex),
      isAccessible: this.isStepAccessible(index),
      hasMultipleCategoryEntry,
    });

    const tabLabel = entry.label;
    const escapedName = this._escapeHTML(tabLabel) || `Step ${index + 1}`;

    // Icon: addon-uploaded, then Step Config image, else default SVG.
    const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
    const iconContent = uploadedIconUrl
      ? `<img class="timeline-step-icon" src="${uploadedIconUrl}" alt="${escapedName}">`
      : this._getDefaultTimelineIcon(step);

    // Checkmark badge — always rendered, shown via CSS only when completed
    const checkmarkSvg = `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const stepWrapper = document.createElement('div');
    stepWrapper.innerHTML = renderStepTimelineEntry({
      stepIndex: index,
      timelineType: entry.type,
      label: tabLabel || `Step ${index + 1}`,
      iconHtml: iconContent,
      checkmarkHtml: checkmarkSvg,
      classes: timelineState.classes,
    }).trim();
    const stepEl = stepWrapper.firstElementChild;

    // Click handler — accessible steps only
    if (entry.type === 'step' && timelineState.isAccessible && !timelineState.isDefaultStep) {
      stepEl.style.cursor = 'pointer';
      stepEl.addEventListener('click', () => {
        if (!this.isStepAccessible(index)) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }
        if (index > this.currentStepIndex && !this.canProceedToNextStep()) {
          ToastManager.show('Please meet the step conditions before proceeding.');
          return;
        }
        this.currentStepIndex = index;
        this.searchQuery = '';
        this.activeCollectionId = null;
        this.reRenderFullPage();
      });
    }

    timeline.appendChild(stepEl);

    // Connector — sibling between steps (not child), so flex layout drives width
    if (displayIndex < visibleEntries.length - 1) {
      const connectorEl = document.createElement('div');
      connectorEl.className = 'timeline-connector';
      const connectorFill = document.createElement('div');
      connectorFill.className = 'timeline-connector-fill';
      connectorFill.style.display = 'block';
      connectorFill.style.width = `${Math.round(this._getStepProgressRatio(index) * 100)}%`;
      connectorEl.appendChild(connectorFill);
      timeline.appendChild(connectorEl);
    }
  });

  return timeline;
},

createStandardStepTimeline() {
  const timeline = document.createElement('div');
  timeline.className = 'step-timeline step-timeline--standard';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return timeline;
  }

  const timelineEntries = this.buildStepTimelineEntries();
  const totalEntryCount = Math.max(timelineEntries.length, 1);
  const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
    entry.type === 'multiple_categories'
      ? Number(entry.stepIndex) === Number(this.currentStepIndex)
      : entry.type === 'step'
        ? Number(entry.stepIndex) === Number(this.currentStepIndex)
          && !this.shouldRenderMultipleCategoryTimelineEntry(entry.step)
        : false
  )));
  const {
    visibleEntries,
    windowStart,
    pageSize,
    isPaged,
  } = this.getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex);
  const entryCount = Math.max(visibleEntries.length, 1);
  const activeVisibleEntryIndex = Math.max(0, visibleEntries.findIndex((entry) => {
    if (Number(entry.stepIndex) !== Number(this.currentStepIndex)) {
      return false;
    }
    if (entry.type === 'multiple_categories') return true;
    if (entry.type === 'step') return !this.shouldRenderMultipleCategoryTimelineEntry(entry.step);
    return false;
  }));
  const progressFill = entryCount > 1
    ? Math.max(0, Math.min(100, (activeVisibleEntryIndex / (entryCount - 1)) * 100))
    : 0;
  const progressLeft = 100 / (entryCount * 2);
  const progressWidth = entryCount > 1 ? ((entryCount - 1) / entryCount) * 100 : 0;
  const timelineWidth = Math.min(100, entryCount * 20);

  timeline.style.setProperty('--standard-timeline-count', String(entryCount));
  timeline.style.setProperty('--standard-timeline-visible-count', String(entryCount));
  timeline.style.setProperty('--standard-timeline-total-count', String(totalEntryCount));
  timeline.style.setProperty('--standard-timeline-width', `${timelineWidth.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-left', `${progressLeft.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-width', `${progressWidth.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-fill', `${progressFill.toFixed(4)}%`);
  timeline.classList.toggle('standard-timeline--paged', isPaged);

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'standard-navigation-items-container';
  itemsContainer.classList.toggle('standard-navigation-items-container--paged', isPaged);
  itemsContainer.dataset.windowStart = String(windowStart);
  itemsContainer.dataset.pageSize = String(pageSize);
  itemsContainer.dataset.totalEntries = String(totalEntryCount);

  const createTimelineArrow = (direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = direction === 'prev'
      ? 'standard-navigation-arrow standard-navigation-arrow--prev'
      : 'standard-navigation-arrow standard-navigation-arrow--next';
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous timeline items' : 'Next timeline items');
    button.textContent = direction === 'prev' ? '‹' : '›';
    button.addEventListener('click', () => {
      if (direction === 'prev') {
        this.standardTimelineWindowStart = Math.max(0, windowStart - pageSize);
      } else {
        this.standardTimelineWindowStart = Math.min(totalEntryCount - pageSize, windowStart + pageSize);
      }
      this.reRenderFullPage();
    });
    return button;
  };

  if (isPaged && windowStart > 0) {
    itemsContainer.appendChild(createTimelineArrow('prev'));
  }

  if (isPaged && windowStart + entryCount < totalEntryCount) {
    itemsContainer.appendChild(createTimelineArrow('next'));
  }

  visibleEntries.forEach((entry) => {
    const step = entry.step;
    const index = entry.stepIndex;
    const isCategoryEntry = entry.type === 'multiple_categories';
    const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
    const itemEl = document.createElement('div');
    itemEl.className = 'standard-navigation-item timeline-step';
    itemEl.dataset.stepIndex = index;
    itemEl.dataset.timelineType = entry.type;

    const timelineState = getTimelineEntryState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isCompleted: isCategoryEntry
        ? this.isStepCompleted(index)
        : this.isStepCompleted(index) || (hasMultipleCategoryEntry && index === this.currentStepIndex),
      isAccessible: this.isStepAccessible(index),
      hasMultipleCategoryEntry,
    });
    timelineState.classes.forEach((className) => itemEl.classList.add(className));

    const escapedName = this._escapeHTML(entry.label) || `Step ${index + 1}`;
    const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
    const iconUrl = uploadedIconUrl || this._getDefaultTimelineIconDataUri(step);

    itemEl.innerHTML = `
      <div class="standard-navigation-step-img-container timeline-icon-wrapper">
        <img class="standard-navigation-image timeline-step-icon" src="${this._escapeHTML(iconUrl)}" alt="${escapedName}">
      </div>
      <div class="standard-navigation-title-container">
        <p class="standard-navigation-title timeline-step-name">${escapedName}</p>
      </div>
    `;

    if (entry.type === 'step' && timelineState.isAccessible && !timelineState.isDefaultStep) {
      itemEl.style.cursor = 'pointer';
      itemEl.addEventListener('click', () => {
        if (!this.isStepAccessible(index)) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }
        if (index > this.currentStepIndex && !this.canProceedToNextStep()) {
          ToastManager.show('Please meet the step conditions before proceeding.');
          return;
        }
        this.currentStepIndex = index;
        this.searchQuery = '';
        this.activeCollectionId = null;
        this.reRenderFullPage();
      });
    }

    itemsContainer.appendChild(itemEl);
  });

  if (entryCount > 1) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'standard-steps-progress-bar-container';
    progressContainer.innerHTML = `
      <div class="standard-steps-progress-bar">
        <div class="standard-steps-progress-bar-filled"></div>
      </div>
    `;
    itemsContainer.appendChild(progressContainer);
  }

  timeline.appendChild(itemsContainer);
  return timeline;
},

// Returns a full-width banner image element for the active step, or null if not configured
createStepBannerImage(stepIndex) {
  const step = (this.selectedBundle?.steps || [])[stepIndex];
  return createStepBannerImageElement(step, value => this._escapeHTML(value), document);
},

createBundleBanners() {
  return createBundleBannerElement({
    desktopBannerUrl: this.selectedBundle?.bundleBannerDesktopUrl,
    mobileBannerUrl: this.selectedBundle?.bundleBannerMobileUrl,
  }, document);
},

ensureBundleBannerRuntimeStyles() {
  return true;
},

// Get a compact quantity hint string for a step tab (e.g. "Pick 2" or "Pick 2–5")
getStepQuantityHint(step) {
  if (!step) return null;

  const { conditionOperator, conditionValue, conditionOperator2, conditionValue2, minQuantity, maxQuantity } = step;
  const OPERATORS = ConditionValidator.OPERATORS;

  if (conditionOperator && conditionValue != null) {
    const val = Number(conditionValue);

    // Range condition: primary AND secondary
    if (conditionOperator2 && conditionValue2 != null) {
      const val2 = Number(conditionValue2);
      const min = Math.min(val, val2);
      const max = Math.max(val, val2);
      return `Pick ${min}–${max}`;
    }

    switch (conditionOperator) {
      case OPERATORS.EQUAL_TO:                  return `Pick ${val}`;
      case OPERATORS.GREATER_THAN:              return `Pick ${val + 1}+`;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO:  return `Pick ${val}+`;
      case OPERATORS.LESS_THAN:                 return `Up to ${val - 1}`;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:     return `Up to ${val}`;
      default:                                  return null;
    }
  }

  // Fallback to minQuantity / maxQuantity
  const min = minQuantity != null ? Number(minQuantity) : null;
  const max = maxQuantity != null ? Number(maxQuantity) : null;
  if (min && max && min !== max) return `Pick ${min}–${max}`;
  if (min && min > 1) return `Pick ${min}+`;
  if (max && max > 1) return `Up to ${max}`;
  return null;
},

// Get product images for a step (helper for tabs)
getStepProductImages(stepIndex) {
  const selectedProducts = this.selectedProducts[stepIndex] || {};
  const productImages = [];

  Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
    if (quantity > 0) {
      const product = this.stepProductData[stepIndex]?.find(p => (p.variantId || p.id) === variantId);
      if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
        productImages.push({
          url: product.imageUrl,
          alt: product.title || 'Product'
        });
      }
    }
  });

  return productImages;
},

// Create search input for filtering products within the current step
};
