// src/index.tsx

import '@shopify/ui-extensions/preact';  // Runtime import for Preact with Shopify web components
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// Shopify's Preact extension build system uses default imports for all targets.
// Both checkout and thank-you targets share this single entry point.
export default function extension() {
  render(<BundlePricingExtension />, document.body);
}
