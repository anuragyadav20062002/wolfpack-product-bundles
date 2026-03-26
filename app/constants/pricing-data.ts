/**
 * Pricing Data Constants
 *
 * Shared constants for pricing and billing pages.
 * Extracted from app.pricing.tsx for better maintainability.
 */

/**
 * Feature comparison data for pricing table
 * Used in the feature comparison table on the pricing page
 */
export interface FeatureComparisonRow {
  feature: string;
  free: boolean | string;
  grow: boolean | string;
  highlight?: boolean;
}

export const FEATURE_COMPARISON: FeatureComparisonRow[] = [
  { feature: "Bundle limit", free: "10 bundles", grow: "20 bundles", highlight: true },
  { feature: "Product Page Bundles", free: true, grow: true },
  { feature: "Full Page Bundles", free: true, grow: true },
  { feature: "Basic discount rules", free: true, grow: true },
  { feature: "Advanced discount rules", free: false, grow: true, highlight: true },
  { feature: "Design Control Panel", free: false, grow: true, highlight: true },
  { feature: "Bundle analytics", free: false, grow: true, highlight: true },
  { feature: "Priority support", free: false, grow: true, highlight: true },
  { feature: "Early access to features", free: false, grow: true },
  { feature: "Community access", free: true, grow: true },
];

/**
 * Value proposition items for upgrade marketing
 * Used in the "Why Upgrade" section on the pricing page
 */
export interface ValueProp {
  title: string;
  description: string;
  icon: string;
}

export const VALUE_PROPS: ValueProp[] = [
  {
    title: "Double your bundle capacity",
    description: "Create up to 20 bundles to maximize your product offerings",
    icon: "📦",
  },
  {
    title: "Full design control",
    description: "Customize colors, fonts, and layouts to match your brand perfectly",
    icon: "🎨",
  },
  {
    title: "Priority support",
    description: "Get help faster with dedicated support for Grow plan members",
    icon: "⚡",
  },
];

/**
 * Grow plan upgrade benefits
 * Used in the upgrade confirmation modal
 */
export const GROW_PLAN_BENEFITS = [
  "Up to 20 bundles",
  "Design Control Panel for full customization",
  "Advanced discount rules",
  "Priority support",
] as const;

/**
 * FAQ items for pricing page
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const PRICING_FAQ: FAQItem[] = [
  {
    question: "Can I change plans at any time?",
    answer: "Yes! You can upgrade to Grow anytime. If you need to downgrade, you can cancel from the Billing page.",
  },
  {
    question: "What happens to my bundles if I downgrade?",
    answer: "If you have more than 10 bundles when downgrading to Free, the excess bundles will be archived but not deleted. You can upgrade again to access them.",
  },
  {
    question: "How does billing work?",
    answer: "All subscriptions are billed monthly through your Shopify account. The charge will appear on your Shopify invoice.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Subscriptions are billed through Shopify. Please contact our support team for any billing inquiries.",
  },
];
