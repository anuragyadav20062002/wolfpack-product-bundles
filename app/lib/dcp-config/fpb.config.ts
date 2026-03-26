import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const FPB_PRODUCT_CARD_EXTRAS = [
  { key: 'searchInput' as const, label: 'Search Input', description: 'Product search bar colors and focus state' },
];

export const FPB_DCP_CONFIG: DCPGroup[] = [
  ...BASE_DCP_CONFIG.map((group) => {
    if (group.key === 'productCard') {
      // Insert searchInput before skeletonLoading
      const children = group.children ?? [];
      const insertAt = children.findIndex((c) => c.key === 'skeletonLoading');
      return {
        ...group,
        children: [
          ...children.slice(0, insertAt),
          ...FPB_PRODUCT_CARD_EXTRAS,
          ...children.slice(insertAt),
        ],
      };
    }
    return group;
  }),
  // FPB-only top-level groups
  {
    key: 'bundleHeader' as const,
    label: 'Bundle Header',
    description: 'Step navigation bar and header text shown above the product grid',
    hasChildren: true,
    children: [
      { key: 'headerTabs' as const, label: 'Tabs', description: 'Step bar circles, progress bar, and step name label styling' },
      { key: 'headerText' as const, label: 'Header Text', description: 'Tab styles for multi-step bundle navigation' },
    ],
  },
  {
    key: 'promoBanner' as const,
    label: 'Promo Banner',
    description: 'Full-width promotional banner displayed above the bundle product grid',
    hasChildren: false,
    sectionKey: 'promoBanner' as const,
  },
  {
    key: 'tierPills' as const,
    label: 'Pricing Tier Pills',
    description: 'Tier selector pills showing available discount levels for the bundle',
    hasChildren: false,
    sectionKey: 'tierPills' as const,
  },
];
