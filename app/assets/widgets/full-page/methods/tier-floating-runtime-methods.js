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


export const fullPageTierFloatingRuntimeMethods = {
initTierPills(tiers) {
  if (tiers.length < 2) return;

  const bar = document.createElement('div');
  bar.className = 'bundle-tier-pill-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Bundle pricing tiers');

  tiers.forEach((tier, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bundle-tier-pill' + (i === 0 ? ' bundle-tier-pill--active' : '');
    btn.dataset.tierIndex = String(i);
    btn.dataset.bundleId = tier.bundleId;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.textContent = tier.label;
    bar.appendChild(btn);
  });

  this.container.insertBefore(bar, this.container.firstChild);
  this.elements.tierPillBar = bar;
},

/** Updates aria-pressed and active CSS class on all pills to match activeTierIndex. */
updatePillActiveStates() {
  if (!this.elements.tierPillBar) return;
  this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill').forEach(pill => {
    const idx = parseInt(pill.dataset.tierIndex, 10);
    const active = idx === this.activeTierIndex;
    pill.classList.toggle('bundle-tier-pill--active', active);
    pill.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
},

/** Switches the active bundle tier — fetches new bundle data and re-renders the widget. */
async switchTier(bundleId, tierIndex) {
  if (tierIndex === this.activeTierIndex) return;

  const pills = this.elements.tierPillBar
    ? [...this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill')]
    : [];

  // Disable all pills while loading
  pills.forEach(p => p.classList.add('bundle-tier-pill--disabled'));
  if (pills[tierIndex]) pills[tierIndex].classList.add('bundle-tier-pill--loading');

  this.showLoadingOverlay(null);

  try {
    // Reset mutable widget state
    this.selectedProducts = [];
    this.stepProductData = [];
    this.currentStepIndex = 0;
    this.stepCollectionProductIds = {};
    this.searchQuery = '';

    // Swap bundle ID and fetch new data
    this.config.bundleId = bundleId;
    await this.loadBundleData();
    this.selectBundle();

    if (!this.selectedBundle) {
      throw new Error('Bundle not found for this tier.');
    }
    this.applyPersonalizationAddonProducts();

    // Re-resolve showStepTimeline from the newly loaded tier bundle's API value
    this.config.showStepTimeline = this.resolveShowStepTimeline(
      this.selectedBundle.showStepTimeline ?? null,
      this.config.showStepTimeline
    );

    this.initializeDataStructures();

    // Clear existing step content and re-render
    if (this.elements.stepsContainer) {
      this.elements.stepsContainer.innerHTML = '';
    }
    await this.renderUI();

    this.activeTierIndex = tierIndex;
    this.updatePillActiveStates();
  } catch (err) {
    ToastManager.show('Failed to load tier: ' + err.message);
    // Restore previous active state styling
    this.updatePillActiveStates();
  } finally {
    this.hideLoadingOverlay();
    pills.forEach(p => {
      p.classList.remove('bundle-tier-pill--disabled', 'bundle-tier-pill--loading');
    });
  }
},

_mergeBundleSettings(settings) {
  if (!settings || !this.selectedBundle) return;
  const keys = [
    'promoBannerBgImage',
    'bundleBannerDesktopUrl', 'bundleBannerMobileUrl', 'loadingGif',
    'showStepTimeline', 'floatingBadgeEnabled', 'floatingBadgeText', 'tierConfig',
  ];
  for (const key of keys) {
    if (settings[key] !== undefined) this.selectedBundle[key] = settings[key];
  }
},

_initFloatingBadge() {
  const enabled = this.selectedBundle && this.selectedBundle.floatingBadgeEnabled;
  const text = this.selectedBundle && this.selectedBundle.floatingBadgeText;
  if (!enabled || !text || !text.trim()) return;

  const DISMISS_KEY = `fpb_badge_dismissed_${this.selectedBundle.id}`;
  if (sessionStorage.getItem(DISMISS_KEY)) return;

  const badge = document.createElement('div');
  badge.className = 'floating-promo-badge';
  badge.setAttribute('role', 'status');
  badge.innerHTML = `<span class="floating-promo-badge__text">${this._escapeHtml(text.trim())}</span><button class="floating-promo-badge__close" aria-label="Dismiss">&times;</button>`;

  badge.querySelector('.floating-promo-badge__close').addEventListener('click', () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    badge.remove();
  });

  document.body.appendChild(badge);
},

_escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
},

attachEventListeners() {
  // Tier pill click handler
  if (this.elements.tierPillBar) {
    this.elements.tierPillBar.addEventListener('click', e => {
      const pill = e.target.closest('.bundle-tier-pill');
      if (!pill) return;
      this.switchTier(pill.dataset.bundleId, parseInt(pill.dataset.tierIndex, 10));
    });
    this.elements.tierPillBar.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const pill = e.target.closest('.bundle-tier-pill');
        if (!pill) return;
        e.preventDefault();
        pill.click();
      }
    });
  }

  // Modal close handlers
  const modal = this.elements.modal;
  const closeButton = modal.querySelector('.close-button');
  const overlay = modal.querySelector('.modal-overlay');
  const prevButton = modal.querySelector('.prev-button');
  const nextButton = modal.querySelector('.next-button');

  if (closeButton) {
    closeButton.addEventListener('click', () => this.closeModal());
  }

  if (overlay) {
    overlay.addEventListener('click', () => this.closeModal());
  }

  // Modal navigation
  if (prevButton) {
    prevButton.addEventListener('click', () => this.navigateModal(-1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => this.navigateModal(1));
  }

  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'block' && e.key === 'Escape') {
      this.closeModal();
    }
  });
},

async navigateModal(direction) {
  const newStepIndex = this.currentStepIndex + direction;

  if (direction < 0 && newStepIndex >= 0) {
    // Previous step — no validation required, user must be free to correct mistakes
    this.currentStepIndex = newStepIndex;

    // Update modal header
    const headerText = this.getFormattedHeaderText();
    this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

    // Load products for this step
    await this.loadStepProducts(newStepIndex);

    this.renderModalTabs();
    this.renderModalProducts(this.currentStepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();
  } else if (direction > 0) {
    if (newStepIndex < this.selectedBundle.steps.length) {
      // Next step
      if (this.validateStep(this.currentStepIndex)) {
        this.currentStepIndex = newStepIndex;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step
        await this.loadStepProducts(newStepIndex);

        this.renderModalTabs();
        this.renderModalProducts(this.currentStepIndex);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      } else {
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
      }
    } else {
      // Done button clicked on last step
      if (this.validateStep(this.currentStepIndex)) {
        this.closeModal();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before finishing.');
      }
    }
  }
},

// ========================================================================
// UTILITY METHODS
// ========================================================================

showFallbackUI() {
  this.container.innerHTML = `
    <div class="bundle-fallback">
      <h3>Bundle Configuration</h3>
      <p>No active bundles found for this product.</p>
      <details>
        <summary>Debug Information</summary>
        <pre>${JSON.stringify({
    config: this.config,
    bundleDataKeys: this.bundleData ? Object.keys(this.bundleData) : 'No data',
    currentProductId: this.config.currentProductId
  }, null, 2)}</pre>
      </details>
    </div>
  `;
},

showErrorUI(_error) {
  this.container.innerHTML = `
    <div class="bundle-error">
      <h3>Bundle unavailable</h3>
      <p>We couldn&apos;t load this bundle right now. Please refresh the page or try again later.</p>
      <p>If the problem persists, please contact the store owner.</p>
    </div>
  `;
},

/**
 * Fire-and-forget error report to the server so AppLogger can track widget failures.
 * Does NOT await — never blocks the render path.
 */

/**
 * Background layout refresh — runs after initial render.
 *
 * In compact-marker mode, we always fetch the bundle via API before render,
 * so this refresh path is effectively a no-op for initialized API loads.
 * It is preserved for legacy cached payload paths and exits early when not needed.
 *
 * Fire-and-forget: all errors are silently swallowed.
 */
async _scheduleLayoutRefresh() {
  const bundleId = this.container.dataset.bundleId;
  if (!bundleId) return;

  if (this._bundleConfigCacheMode !== 'full') return;

  try {
    const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;
    const response = await fetch(apiUrl);
    if (!response.ok) return;

    const data = await response.json();
    if (!data?.bundle) return;

    const freshLayout = this.resolveFullPageLayout(data.bundle);
    const currentLayout = this.resolveFullPageLayout();
    const freshTemplate = data.bundle.bundleDesignTemplate ?? null;
    const currentTemplate = this.selectedBundle?.bundleDesignTemplate ?? null;
    const freshPreset = data.bundle.bundleDesignPresetId ?? null;
    const currentPreset = this.selectedBundle?.bundleDesignPresetId ?? null;

    if ((freshLayout !== currentLayout || freshTemplate !== currentTemplate || freshPreset !== currentPreset) && this.selectedBundle) {
      this.selectedBundle.fullPageLayout = data.bundle.fullPageLayout;
      this.selectedBundle.bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.selectedBundle.bundleDesignTemplate;
      this.selectedBundle.bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.selectedBundle.bundleDesignPresetId;
      this.selectedBundle.bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.selectedBundle.bundleDesignTemplateData;
      if (this.bundleData?.[bundleId]) {
        this.bundleData[bundleId].fullPageLayout = data.bundle.fullPageLayout;
        this.bundleData[bundleId].bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.bundleData[bundleId].bundleDesignTemplate;
        this.bundleData[bundleId].bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.bundleData[bundleId].bundleDesignPresetId;
        this.bundleData[bundleId].bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.bundleData[bundleId].bundleDesignTemplateData;
      }
      await this.renderSteps();
    }
  } catch (_e) {
    // Best-effort: silently ignore all errors
  }
},

_reportError(error) {
  try {
    const payload = {
      message: error?.message ?? String(error),
      bundleId: this.config?.bundleId ?? null,
      bundleType: this.container?.dataset?.bundleType ?? null,
      shop: window.Shopify?.shop ?? null,
      url: window.location?.href ?? null,
    };
    // Use the app proxy path so the request is authenticated by Shopify
    fetch('/apps/product-bundles/api/widget-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* best-effort — ignore if proxy is also down */ });
  } catch (_) {
    // Never throw from error reporting
  }
},

_resolveText(key, fallback) {
  const locale = window.Shopify?.locale;
  if (locale && this.config?.textOverridesByLocale?.[locale]?.[key]) {
    return this.config.textOverridesByLocale[locale][key];
  }
  if (this.config?.textOverrides?.[key]) {
    return this.config.textOverrides[key];
  }
  return fallback;
},

_recordView() {
  try {
    const bundleId = this.config?.bundleId ?? this.container?.dataset?.bundleId;
    const shop = window.Shopify?.shop;
    if (!bundleId || !shop) return;
    fetch(`/apps/product-bundles/api/bundle/${bundleId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop }),
      keepalive: true,
    }).catch(() => { /* best-effort */ });
  } catch (_) {
    // Never throw from analytics
  }
},
};
