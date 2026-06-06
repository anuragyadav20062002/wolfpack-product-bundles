/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays aggregate bundle savings on cart line items in checkout.
 *
 * Targets (static - auto-render on each cart line):
 * - purchase.checkout.cart-line-item.render-after
 * - purchase.thank-you.cart-line-item.render-after
 *
 * Reads attributes set by Cart Transform:
 * - _is_bundle_parent: "true" (bundle parent item)
 * - _bundle_total_retail_cents: Total retail price in cents
 * - _bundle_total_price_cents: Total bundle price in cents
 * - _bundle_total_savings_cents: Total savings in cents
 */

import type {FunctionComponent} from 'preact';

export const BundlePricingExtension: FunctionComponent = () => {
  // Access cart line via Preact shopify global signal
  const lineItem = shopify.target.value;
  const currency = shopify.cost.totalAmount.value?.currencyCode ?? 'USD';

  if (!lineItem) {
    return null;
  }

  const attributes = lineItem.attributes ?? [];

  const getAttr = (key: string): string | undefined => {
    return attributes.find((attr: {key: string; value?: string}) => attr.key === key)?.value;
  };

  const isBundleParent = getAttr('_is_bundle_parent') === 'true';

  if (!isBundleParent) {
    return null;
  }

  const formatMoney = (cents: number) => {
    const safeCents = Number.isFinite(cents) ? cents : 0;
    const amount = safeCents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (pct: number): string => {
    if (!Number.isFinite(pct)) return '0';
    return pct.toFixed(pct % 1 === 0 ? 0 : 2);
  };

  const safeInt = (val: string | undefined): number => {
    const n = parseInt(val ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  };

  const calculateSavingsPercent = (savingsCents: number, retailCents: number): number => {
    if (retailCents <= 0 || savingsCents <= 0) return 0;
    return (savingsCents / retailCents) * 100;
  };

  const totalRetailCents = safeInt(getAttr('_bundle_total_retail_cents'));
  const totalBundleCents = safeInt(getAttr('_bundle_total_price_cents'));
  const totalSavingsCents = safeInt(getAttr('_bundle_total_savings_cents'));
  const hasDiscount = totalSavingsCents > 0 && totalRetailCents > 0;

  if (!hasDiscount) {
    return null;
  }

  const savingsPercent = calculateSavingsPercent(totalSavingsCents, totalRetailCents);

  return (
    <s-stack direction="block" gap="small-200">
      <s-divider />

      <s-stack direction="block" gap="small-100">
        <s-text type="strong">Bundle Savings</s-text>

        <s-stack direction="inline" gap="small-200" justifyContent="space-between">
          <s-text>Actual Price:</s-text>
          <s-text type="strong" color="subdued">
            {formatMoney(totalRetailCents)}
          </s-text>
        </s-stack>

        <s-stack direction="inline" gap="small-200" justifyContent="space-between">
          <s-text>Bundle Price:</s-text>
          <s-text type="strong">
            {formatMoney(totalBundleCents)}
          </s-text>
        </s-stack>

        <s-stack direction="inline" gap="small-200" justifyContent="space-between">
          <s-text>Savings:</s-text>
          <s-stack direction="inline" gap="small-100" alignItems="center">
            <s-text type="strong" tone="success">
              {formatMoney(totalSavingsCents)}
            </s-text>
            <s-text tone="success" type="small">
              ({formatPercent(savingsPercent)}%)
            </s-text>
          </s-stack>
        </s-stack>
      </s-stack>
    </s-stack>
  );
};
