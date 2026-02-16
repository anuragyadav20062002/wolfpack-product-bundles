// src/index.tsx

import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// Shopify's Preact extension build system uses default imports for all targets.
export default function extension() {
  try {
    render(<BundlePricingExtension />, document.body);
  } catch (error) {
    console.error('[BundleCheckoutUI] Render error:', error);
  }
}
