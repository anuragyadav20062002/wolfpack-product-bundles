import type { DCPGroup } from './types';

export const BASE_DCP_CONFIG: DCPGroup[] = [
  {
    key: 'globalColors',
    label: 'Global Colors',
    description: 'Brand-wide color settings applied consistently across the entire widget',
    hasChildren: false,
    sectionKey: 'globalColors',
  },
  {
    key: 'productCard',
    label: 'Product Card',
    description: 'Appearance, layout, and typography of product cards in the bundle grid',
    hasChildren: true,
    children: [
      { key: 'productCard', label: 'Card Appearance', description: 'Card background, image settings, layout, product name, price, and text styling' },
      { key: 'button', label: 'Card Button', description: 'Add-to-bundle button colors, size, border radius, and added state styling' },
      { key: 'quantityVariantSelector', label: 'Quantity & Variant Selector', description: 'Quantity stepper and variant option pill styling' },
      { key: 'skeletonLoading', label: 'Skeleton Loading', description: 'Placeholder shimmer colors shown while product data loads' },
      { key: 'typography', label: 'Button Typography', description: 'Button text transform and letter spacing overrides' },
    ],
  },
  {
    key: 'bundleFooter',
    label: 'Bundle Footer',
    description: 'Checkout footer showing price summary and navigation buttons',
    hasChildren: true,
    children: [
      { key: 'footer', label: 'Footer', description: 'Footer container background, border radius, and padding' },
      { key: 'footerPrice', label: 'Price', description: 'Final and strike-through price display in the footer' },
      { key: 'footerButton', label: 'Button', description: 'Back and Next button styling in the footer navigation' },
      { key: 'footerDiscountProgress', label: 'Discount Text', description: 'Success message shown when a discount threshold is reached' },
      { key: 'quantityBadge', label: 'Quantity Badge', description: 'Quantity indicator badge overlaid on product tiles' },
    ],
  },
  {
    key: 'general',
    label: 'General',
    description: 'Widget-wide controls for the add-to-cart button, toasts, and accessibility',
    hasChildren: true,
    children: [
      { key: 'addToCartButton', label: 'Add to Cart Button', description: 'Main add-to-cart button colors and discount pill badge' },
      { key: 'toasts', label: 'Toasts', description: 'In-widget toast notification appearance and animation' },
      { key: 'accessibility', label: 'Accessibility', description: 'Focus outline style for keyboard navigation' },
    ],
  },
];
