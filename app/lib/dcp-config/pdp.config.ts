import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const PDP_GENERAL_EXTRAS = [
  { key: 'modalCloseButton' as const, label: 'Modal Close Button', description: 'Close button styling in the product detail modal' },
  { key: 'widgetStyle' as const, label: 'Widget Style', description: 'Widget presentation style, overlay, animation, and empty state card styling' },
];

const PDP_BADGE_GROUP: DCPGroup = {
  key: 'pdpBadge' as const,
  label: 'Product Badges',
  description: 'Free gift badge image and placement on product cards',
  hasChildren: false,
  sectionKey: 'pdpBadge' as const,
};

export const PDP_DCP_CONFIG: DCPGroup[] = (() => {
  const mapped = BASE_DCP_CONFIG.map((group) => {
    if (group.key === 'general') {
      return { ...group, children: [...(group.children ?? []), ...PDP_GENERAL_EXTRAS] };
    }
    return group;
  });
  // Insert Product Badges before the Product Card group
  const productCardIdx = mapped.findIndex((g) => g.key === 'productCard');
  return [
    ...mapped.slice(0, productCardIdx),
    PDP_BADGE_GROUP,
    ...mapped.slice(productCardIdx),
  ];
})();
