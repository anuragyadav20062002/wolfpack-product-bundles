import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const PDP_GENERAL_EXTRAS = [
  { key: 'emptyState' as const, label: 'Empty State', description: 'Empty slot appearance shown before products are added to the bundle' },
  { key: 'modalCloseButton' as const, label: 'Modal Close Button', description: 'Close button styling in the product detail modal' },
  { key: 'widgetStyle' as const, label: 'Widget Style', description: 'Widget presentation style, background, and drawer animation' },
];

export const PDP_DCP_CONFIG: DCPGroup[] = BASE_DCP_CONFIG.map((group) => {
  if (group.key === 'general') {
    return {
      ...group,
      children: [...(group.children ?? []), ...PDP_GENERAL_EXTRAS],
    };
  }
  return group;
});
