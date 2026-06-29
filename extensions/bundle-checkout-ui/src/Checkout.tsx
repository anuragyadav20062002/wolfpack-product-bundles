/**
 * Bundle Checkout UI Extension
 *
 * EB-style checkout display is handled by Shopify native line properties and
 * discount allocations. The extension target stays registered but intentionally
 * renders nothing so it cannot duplicate native checkout rows.
 */

import type {FunctionComponent} from 'preact';

export const BundlePricingExtension: FunctionComponent = () => {
  return null;
};
