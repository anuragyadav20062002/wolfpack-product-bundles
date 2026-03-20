import { BASE_DCP_CONFIG } from './base.config';
import type { DCPGroup } from './types';

const PDP_GENERAL_EXTRAS = [
  { key: 'emptyState' as const, label: 'Empty State' },
  { key: 'modalCloseButton' as const, label: 'Modal Close Button' },
  { key: 'widgetStyle' as const, label: 'Widget Style' },
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
