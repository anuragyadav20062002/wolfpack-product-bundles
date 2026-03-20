import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const FPB_PRODUCT_CARD_EXTRAS = [
  { key: 'searchInput' as const, label: 'Search Input' },
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
    hasChildren: true,
    children: [
      { key: 'headerTabs' as const, label: 'Tabs' },
      { key: 'headerText' as const, label: 'Header Text' },
    ],
  },
  {
    key: 'promoBanner' as const,
    label: 'Promo Banner',
    hasChildren: false,
    sectionKey: 'promoBanner' as const,
  },
  {
    key: 'tierPills' as const,
    label: 'Pricing Tier Pills',
    hasChildren: false,
    sectionKey: 'tierPills' as const,
  },
];
