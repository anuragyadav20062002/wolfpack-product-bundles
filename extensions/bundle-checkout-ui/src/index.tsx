// src/index.tsx

import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// DEBUG: Log when extension loads
console.log('[BundleCheckoutUI] Extension module loaded');

// Shopify's Preact extension build system uses default imports for all targets.
export default function extension() {
  console.log('[BundleCheckoutUI] Extension function called');

  try {
    render(<BundlePricingExtension />, document.body);
    console.log('[BundleCheckoutUI] Render completed');
  } catch (error) {
    console.error('[BundleCheckoutUI] Render error:', error);
  }
}
