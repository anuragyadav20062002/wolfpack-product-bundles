import type { DCPGroup } from './types';

export const BASE_DCP_CONFIG: DCPGroup[] = [
  {
    key: 'globalColors',
    label: 'Global Colors',
    hasChildren: false,
    sectionKey: 'globalColors',
  },
  {
    key: 'productCard',
    label: 'Product Card',
    hasChildren: true,
    children: [
      { key: 'productCard', label: 'Product Card' },
      { key: 'productCardTypography', label: 'Product Card Typography' },
      { key: 'button', label: 'Button' },
      { key: 'addedButtonState', label: 'Added State' },
      { key: 'quantityVariantSelector', label: 'Quantity & Variant Selector' },
      { key: 'skeletonLoading', label: 'Skeleton Loading' },
      { key: 'typography', label: 'Typography' },
    ],
  },
  {
    key: 'bundleFooter',
    label: 'Bundle Footer',
    hasChildren: true,
    children: [
      { key: 'footer', label: 'Footer' },
      { key: 'footerPrice', label: 'Price' },
      { key: 'footerButton', label: 'Button' },
      { key: 'footerDiscountProgress', label: 'Discount Text' },
      { key: 'quantityBadge', label: 'Quantity Badge' },
    ],
  },
  {
    key: 'general',
    label: 'General',
    hasChildren: true,
    children: [
      { key: 'addToCartButton', label: 'Add to Cart Button' },
      { key: 'toasts', label: 'Toasts' },
      { key: 'accessibility', label: 'Accessibility' },
    ],
  },
  {
    key: 'customCss',
    label: 'Custom CSS',
    hasChildren: false,
    sectionKey: 'customCss',
  },
];
