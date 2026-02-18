// @ts-nocheck
/**
 * Bundle Checkout UI Extension - Flex Bundles Style
 *
 * Displays comprehensive bundle pricing breakdown on cart line items in checkout.
 * Shows bundle as SINGLE parent item with expandable component list.
 *
 * Targets (static - auto-render on each cart line):
 * - purchase.checkout.cart-line-item.render-after
 * - purchase.thank-you.cart-line-item.render-after
 *
 * Reads attributes set by Cart Transform:
 * - _is_bundle_parent: "true" (bundle parent item)
 * - _bundle_name: Bundle name
 * - _bundle_component_count: Number of components
 * - _bundle_components: JSON array of component details
 * - _bundle_total_retail_cents: Total retail price in cents
 * - _bundle_total_price_cents: Total bundle price in cents
 * - _bundle_total_savings_cents: Total savings in cents
 * - _bundle_discount_percent: Overall discount percentage
 *
 * Note: Shopify web components (s-stack, s-text, etc.) have incomplete type
 * definitions in @shopify/ui-extensions. The components work correctly at
 * runtime but TypeScript doesn't recognize all valid props like 'size', 'tone',
 * 'gap', etc. Using @ts-nocheck until Shopify updates types.
 */

import type {FunctionComponent} from 'preact';
import {useState} from 'preact/hooks';
import {
  useCartLineTarget,
  useTotalAmount,
} from '@shopify/ui-extensions/checkout/preact';

interface ComponentDetail {
  title: string;
  quantity: number;
  retailPrice: number;
  bundlePrice: number;
  discountPercent: number;
  savingsAmount: number;
}

// Parse compact array format [title, qty, retailCents, bundleCents, discountPct, savingsCents]
// into ComponentDetail objects.
function parseComponents(json: string): ComponentDetail[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  // Safe number coercion — returns 0 on NaN/Infinity/non-numeric
  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return parsed.map((item: any[]) => ({
    title: String(item[0] ?? ''),
    quantity: num(item[1]),
    retailPrice: num(item[2]),
    bundlePrice: num(item[3]),
    discountPercent: num(item[4]),
    savingsAmount: num(item[5]),
  }));
}

export const BundlePricingExtension: FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const lineItem = useCartLineTarget();
  const totalAmount = useTotalAmount();

  if (!lineItem) {
    return null;
  }

  const attributes = lineItem.attributes ?? [];

  const getAttr = (key: string): string | undefined => {
    return attributes.find((attr) => attr.key === key)?.value;
  };

  const isBundleParent = getAttr('_is_bundle_parent') === 'true';

  if (!isBundleParent) {
    return null;
  }

  // Use || instead of ?? to catch empty string which would cause Intl.NumberFormat to throw
  const currency = totalAmount?.currencyCode || 'USD';

  const formatMoney = (cents: number) => {
    const safeCents = Number.isFinite(cents) ? cents : 0;
    const amount = safeCents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to safely format discount percentage — guards against NaN
  const formatPercent = (pct: unknown): string => {
    const num = Number(pct ?? 0);
    if (!Number.isFinite(num)) return '0';
    return num.toFixed(num % 1 === 0 ? 0 : 2);
  };

  // Safe number parsing — returns 0 on NaN to prevent "NaN" display
  const safeInt = (val: string | undefined): number => {
    const n = parseInt(val ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  };
  const safeFloat = (val: string | undefined): number => {
    const n = parseFloat(val ?? '0');
    return Number.isFinite(n) ? n : 0;
  };

  // Bundle Parent with Expandable Components
  const bundleName = getAttr('_bundle_name') || 'Bundle';
  const componentCount = safeInt(getAttr('_bundle_component_count'));
  const totalRetailCents = safeInt(getAttr('_bundle_total_retail_cents'));
  const totalBundleCents = safeInt(getAttr('_bundle_total_price_cents'));
  const totalSavingsCents = safeInt(getAttr('_bundle_total_savings_cents'));
  const discountPercent = safeFloat(getAttr('_bundle_discount_percent'));

  let components: ComponentDetail[] = [];
  try {
    const componentsJson = getAttr('_bundle_components');
    if (componentsJson) {
      components = parseComponents(componentsJson);
    }
  } catch (e) {
    // JSON parse failed — likely truncated attribute value
  }

  const hasDiscount = totalSavingsCents > 0 || discountPercent > 0;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <s-stack direction="block" gap="tight">
      <s-divider />

      {/* Bundle Summary Header */}
      <s-stack direction="block" gap="extraTight">
        {hasDiscount && (
          <>
            <s-stack direction="inline" gap="tight" inline-alignment="space-between">
              <s-text size="small" tone="subdued">Retail Price:</s-text>
              <s-text size="small" tone="subdued" strikethrough>
                {formatMoney(totalRetailCents)}
              </s-text>
            </s-stack>

            <s-stack direction="inline" gap="tight" inline-alignment="space-between">
              <s-text size="small">Bundle Price:</s-text>
              <s-text size="small" emphasis="bold">
                {formatMoney(totalBundleCents)}
              </s-text>
            </s-stack>

            <s-stack direction="inline" gap="tight" inline-alignment="space-between">
              <s-text size="small" tone="subdued">Percentage Savings:</s-text>
              <s-badge tone="success">
                {formatPercent(discountPercent)}%
              </s-badge>
            </s-stack>

            <s-stack direction="inline" gap="tight" inline-alignment="space-between">
              <s-text size="small" tone="subdued">Exact Savings:</s-text>
              <s-text size="small" emphasis="bold" tone="success">
                {formatMoney(totalSavingsCents)}
              </s-text>
            </s-stack>
          </>
        )}

        {!hasDiscount && (
          <s-text size="small" tone="subdued">
            Bundle ({componentCount} items)
          </s-text>
        )}
      </s-stack>

      {/* Expandable Component List */}
      {components.length > 0 && (
        <s-stack direction="block" gap="extraTight">
          <s-pressable onPress={toggleExpand}>
            <s-stack direction="inline" gap="tight" inline-alignment="start">
              <s-text size="small" tone="subdued">
                {isExpanded ? `Hide ${components.length} Items ▲` : `Show ${components.length} Items ▼`}
              </s-text>
            </s-stack>
          </s-pressable>

          {isExpanded && (
            <s-stack direction="block" gap="extraTight">
              {components.map((component, index) => (
                <s-stack key={index} direction="block" gap="none">
                  <s-divider />
                  <s-stack direction="block" gap="none">
                    <s-text size="small" emphasis="bold">
                      {component.quantity}x {component.title || `Item ${index + 1}`}
                    </s-text>
                    <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                      <s-text size="small" tone="subdued">Retail Price:</s-text>
                      <s-text size="small" tone="subdued">
                        {formatMoney(component.retailPrice * component.quantity)}
                      </s-text>
                    </s-stack>
                    <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                      <s-text size="small" tone="subdued">Bundle Price:</s-text>
                      <s-text size="small">
                        {formatMoney(component.bundlePrice * component.quantity)}
                      </s-text>
                    </s-stack>
                    <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                      <s-text size="small" tone="subdued">Percentage Savings:</s-text>
                      <s-text size="small" tone="success">
                        {formatPercent(component.discountPercent)}%
                      </s-text>
                    </s-stack>
                    <s-stack direction="inline" gap="tight" inline-alignment="space-between">
                      <s-text size="small" tone="subdued">Exact Savings:</s-text>
                      <s-text size="small" tone="success">
                        {formatMoney(component.savingsAmount * component.quantity)}
                      </s-text>
                    </s-stack>
                  </s-stack>
                </s-stack>
              ))}
            </s-stack>
          )}
        </s-stack>
      )}
    </s-stack>
  );
};
