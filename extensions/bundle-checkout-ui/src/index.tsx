// src/index.tsx

import '@shopify/ui-extensions/preact';  // Runtime import for Preact with Shopify web components
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// Named exports for each extension target in shopify.extension.toml

export function checkoutExtension() {
  render(<BundlePricingExtension />, document.body);
}

export function thankYouExtension() {
  render(<BundlePricingExtension />, document.body);
}

