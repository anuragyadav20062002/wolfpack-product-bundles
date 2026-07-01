import type {FunctionComponent} from 'preact';
import {
  useCartLines,
  useDiscountAllocations,
  useTotalAmount,
} from '@shopify/ui-extensions/checkout/preact';

type CheckoutAttribute = {
  key: string;
  value: string;
};

type CheckoutMoney = {
  amount?: number | string;
  currencyCode?: string;
};

type CheckoutDiscountAllocation = {
  discountedAmount?: CheckoutMoney;
};

type CheckoutLine = {
  attributes?: CheckoutAttribute[];
  discountAllocations?: CheckoutDiscountAllocation[];
};

const BUNDLE_TOTAL_SAVINGS_ATTRIBUTE = '_bundle_total_savings_cents';

function sumDiscountAllocations(allocations: CheckoutDiscountAllocation[] = []) {
  return allocations.reduce((sum, allocation) => {
    const amount = Number(allocation.discountedAmount?.amount);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
}

function getLineAttributeValue(attributes: CheckoutAttribute[] = [], key: string) {
  return attributes.find((attribute) => attribute.key === key)?.value;
}

function getBundleAttributeSavings(line: CheckoutLine) {
  const cents = Number(getLineAttributeValue(line.attributes, BUNDLE_TOTAL_SAVINGS_ATTRIBUTE));
  return Number.isFinite(cents) && cents > 0 ? cents / 100 : 0;
}

function getCurrencyCode(
  lines: CheckoutLine[],
  discountAllocations: CheckoutDiscountAllocation[],
  totalAmount?: CheckoutMoney,
) {
  return (
    totalAmount?.currencyCode
    ?? lines
      .flatMap((line) => line.discountAllocations ?? [])
      .find((allocation) => allocation.discountedAmount?.currencyCode)
      ?.discountedAmount?.currencyCode
    ?? discountAllocations.find((allocation) => allocation.discountedAmount?.currencyCode)
      ?.discountedAmount?.currencyCode
    ?? 'USD'
  );
}

export function calculateCheckoutTotalSavings({
  lines = [],
  discountAllocations = [],
}: {
  lines?: CheckoutLine[];
  discountAllocations?: CheckoutDiscountAllocation[];
} = {}) {
  const lineSavings = lines.reduce((sum, line) => {
    const nativeSavings = sumDiscountAllocations(line.discountAllocations);
    const bundleSavings = getBundleAttributeSavings(line);
    return sum + Math.max(nativeSavings, bundleSavings);
  }, 0);

  return lineSavings > 0 ? lineSavings : sumDiscountAllocations(discountAllocations);
}

export function formatCheckoutMoney(amount: number, currencyCode = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * EB-style cart-line checkout display is handled by Shopify native line
 * properties and discount allocations. This target intentionally renders
 * nothing so it cannot duplicate native checkout rows.
 */
export const BundlePricingExtension: FunctionComponent = () => {
  return null;
};

export const TotalSavingsExtension: FunctionComponent = () => {
  const lines = useCartLines() as CheckoutLine[];
  const discountAllocations = useDiscountAllocations() as CheckoutDiscountAllocation[];
  const totalAmount = useTotalAmount() as CheckoutMoney | undefined;
  const totalSavings = calculateCheckoutTotalSavings({lines, discountAllocations});

  if (totalSavings <= 0) {
    return null;
  }

  const currencyCode = getCurrencyCode(lines, discountAllocations, totalAmount);

  return (
    <s-grid gridTemplateColumns="1fr auto" gap="base">
      <s-text type="strong">TOTAL SAVINGS</s-text>
      <s-text type="strong">{formatCheckoutMoney(totalSavings, currencyCode)}</s-text>
    </s-grid>
  );
};
