// src/index.tsx

import '@shopify/ui-extensions/preact';  // Runtime import for Preact with Shopify web components
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// Entry for the Checkout UI extension.
// This file should be referenced as `module` in shopify.extension.toml.
export default function extension() {
  render(<BundlePricingExtension />, document.body);
}
