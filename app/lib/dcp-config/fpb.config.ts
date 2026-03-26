import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const FPB_PRODUCT_CARD_EXTRAS = [
  { key: 'searchInput' as const, label: 'Search Input', description: 'Product search bar colors and focus state' },
];

function buildFpbProductCard(): DCPGroup {
  const base = BASE_DCP_CONFIG.find((g) => g.key === 'productCard')!;
  const children = base.children ?? [];
  const insertAt = children.findIndex((c) => c.key === 'skeletonLoading');
  return {
    ...base,
    children: [
      ...children.slice(0, insertAt),
      ...FPB_PRODUCT_CARD_EXTRAS,
      ...children.slice(insertAt),
    ],
  };
}

// Order: Global Colors → FPB-specific header controls → shared base controls
// The NavigationSidebar adds a divider after index 0 (globalColors) and before
// index 4 (productCard), cleanly separating FPB-specific sections from base ones.
export const FPB_DCP_CONFIG: DCPGroup[] = [
  // 0 — brand-wide token baseline
  BASE_DCP_CONFIG.find((g) => g.key === 'globalColors')!,
  // 1–3 — FPB-specific header controls (top of page, above the product grid)
  {
    key: 'bundleHeader' as const,
    label: 'Bundle Header',
    description: 'Step navigation bar and header text shown above the product grid',
    hasChildren: true,
    children: [
      { key: 'headerTabs' as const, label: 'Tabs', description: 'Step bar circles, progress bar, and step name label styling' },
      { key: 'headerText' as const, label: 'Header Text', description: 'Conditions and discount text styling shown in the bundle header area' },
    ],
  },
  {
    key: 'tierPills' as const,
    label: 'Pricing Tier Pills',
    description: 'Tier selector pills showing available discount levels for the bundle',
    hasChildren: false,
    sectionKey: 'tierPills' as const,
  },
  {
    key: 'promoBanner' as const,
    label: 'Promo Banner',
    description: 'Full-width promotional banner displayed above the bundle product grid',
    hasChildren: false,
    sectionKey: 'promoBanner' as const,
  },
  // 4–6 — shared base controls
  buildFpbProductCard(),
  BASE_DCP_CONFIG.find((g) => g.key === 'bundleFooter')!,
  BASE_DCP_CONFIG.find((g) => g.key === 'general')!,
];
