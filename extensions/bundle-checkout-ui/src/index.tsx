// src/index.tsx

import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {BundlePricingExtension} from './Checkout';

// Shopify's Preact extension build system uses default imports for all targets.
// Both purchase.checkout.cart-line-item.render-after and
// purchase.thank-you.cart-line-item.render-after are registered via shopify.extension.toml.
// The CLI wraps this default export in shopify.extend() for each declared target.
export default function extension() {
  // Cast needed: root tsconfig uses React JSX types while this extension uses Preact,
  // causing ComponentChildren vs ReactNode incompatibility in the combined type check.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ext = BundlePricingExtension as any;
  render(<Ext />, document.body);
}
