/**
 * Unit Tests: resolveTierConfig — API-source tier config resolution
 *
 * Tests the pure helper that decides whether to use the API response's
 * tierConfig (admin-saved) or fall back to the legacy data-tier-config
 * HTML attribute source.
 *
 * Rules:
 *  - apiTierConfig null/undefined  → return dataTierConfig as-is
 *  - apiTierConfig < 2 entries     → return [] (merchant intentionally has < 2)
 *  - apiTierConfig >= 2 entries    → map { linkedBundleId } → { bundleId }, return
 *  - Empty/invalid entries are filtered before counting
 */

// ============================================================
// Types
// ============================================================

interface TierPill {
  label: string;
  bundleId: string;
}

interface ApiTierEntry {
  label: string;
  linkedBundleId: string;
}

// ============================================================
// Pure function under test — must match bundle-widget-full-page.js
// ============================================================

function resolveTierConfig(
  apiTierConfig: ApiTierEntry[] | null | undefined,
  dataTierConfig: TierPill[]
): TierPill[] {
  if (apiTierConfig == null) return dataTierConfig;

  const mapped: TierPill[] = (Array.isArray(apiTierConfig) ? apiTierConfig : [])
    .filter(
      (t: any) =>
        typeof t?.label === 'string' &&
        typeof t?.linkedBundleId === 'string' &&
        t.label.trim() !== '' &&
        t.linkedBundleId.trim() !== ''
    )
    .map((t: any) => ({
      label: (t.label as string).trim(),
      bundleId: (t.linkedBundleId as string).trim(),
    }))
    .slice(0, 4);

  return mapped.length >= 2 ? mapped : [];
}

// ============================================================
// Tests
// ============================================================

describe('resolveTierConfig', () => {
  const DATA_TIERS: TierPill[] = [
    { label: 'Buy 2', bundleId: 'data-bundle-a' },
    { label: 'Buy 3', bundleId: 'data-bundle-b' },
  ];

  describe('fallback to dataTierConfig when API source is absent', () => {
    it('returns dataTierConfig when apiTierConfig is null', () => {
      expect(resolveTierConfig(null, DATA_TIERS)).toBe(DATA_TIERS);
    });

    it('returns dataTierConfig when apiTierConfig is undefined', () => {
      expect(resolveTierConfig(undefined, DATA_TIERS)).toBe(DATA_TIERS);
    });

    it('returns empty dataTierConfig when API is null and dataTierConfig is empty', () => {
      expect(resolveTierConfig(null, [])).toEqual([]);
    });
  });

  describe('returns [] when API source has fewer than 2 valid tiers', () => {
    it('returns [] for empty array', () => {
      expect(resolveTierConfig([], DATA_TIERS)).toEqual([]);
    });

    it('returns [] for single valid entry', () => {
      const single: ApiTierEntry[] = [{ label: 'Buy 2', linkedBundleId: 'bundle-a' }];
      expect(resolveTierConfig(single, DATA_TIERS)).toEqual([]);
    });

    it('returns [] when all entries have blank labels', () => {
      const blankLabels: ApiTierEntry[] = [
        { label: '  ', linkedBundleId: 'bundle-a' },
        { label: '  ', linkedBundleId: 'bundle-b' },
      ];
      expect(resolveTierConfig(blankLabels, DATA_TIERS)).toEqual([]);
    });

    it('returns [] when all entries have blank linkedBundleId', () => {
      const blankIds: ApiTierEntry[] = [
        { label: 'Tier 1', linkedBundleId: '' },
        { label: 'Tier 2', linkedBundleId: '   ' },
      ];
      expect(resolveTierConfig(blankIds, DATA_TIERS)).toEqual([]);
    });
  });

  describe('maps API source to pill format when >= 2 valid entries', () => {
    it('maps linkedBundleId to bundleId for 2-tier config', () => {
      const api: ApiTierEntry[] = [
        { label: 'Buy 2 @ ₹499', linkedBundleId: 'api-bundle-a' },
        { label: 'Buy 3 @ ₹699', linkedBundleId: 'api-bundle-b' },
      ];
      expect(resolveTierConfig(api, DATA_TIERS)).toEqual([
        { label: 'Buy 2 @ ₹499', bundleId: 'api-bundle-a' },
        { label: 'Buy 3 @ ₹699', bundleId: 'api-bundle-b' },
      ]);
    });

    it('maps 4-tier config correctly', () => {
      const api: ApiTierEntry[] = [
        { label: 'T1', linkedBundleId: 'b1' },
        { label: 'T2', linkedBundleId: 'b2' },
        { label: 'T3', linkedBundleId: 'b3' },
        { label: 'T4', linkedBundleId: 'b4' },
      ];
      const result = resolveTierConfig(api, DATA_TIERS);
      expect(result).toHaveLength(4);
      expect(result[3]).toEqual({ label: 'T4', bundleId: 'b4' });
    });

    it('trims whitespace from label and bundleId', () => {
      const api: ApiTierEntry[] = [
        { label: '  Tier A  ', linkedBundleId: '  bundle-a  ' },
        { label: '  Tier B  ', linkedBundleId: '  bundle-b  ' },
      ];
      expect(resolveTierConfig(api, DATA_TIERS)).toEqual([
        { label: 'Tier A', bundleId: 'bundle-a' },
        { label: 'Tier B', bundleId: 'bundle-b' },
      ]);
    });

    it('caps at 4 entries even when API has more', () => {
      const api: ApiTierEntry[] = Array.from({ length: 6 }, (_, i) => ({
        label: `Tier ${i + 1}`,
        linkedBundleId: `bundle-${i + 1}`,
      }));
      expect(resolveTierConfig(api, DATA_TIERS)).toHaveLength(4);
    });

    it('filters invalid entries and counts only valid ones', () => {
      const api: ApiTierEntry[] = [
        { label: '', linkedBundleId: 'b1' },      // filtered — blank label
        { label: 'T2', linkedBundleId: 'b2' },
        { label: 'T3', linkedBundleId: '' },      // filtered — blank id
        { label: 'T4', linkedBundleId: 'b4' },
      ];
      // 2 valid remain → returned
      expect(resolveTierConfig(api, DATA_TIERS)).toEqual([
        { label: 'T2', bundleId: 'b2' },
        { label: 'T4', bundleId: 'b4' },
      ]);
    });

    it('ignores dataTierConfig when API has >= 2 valid entries', () => {
      const api: ApiTierEntry[] = [
        { label: 'API Tier 1', linkedBundleId: 'api-b1' },
        { label: 'API Tier 2', linkedBundleId: 'api-b2' },
      ];
      const result = resolveTierConfig(api, DATA_TIERS);
      // Must NOT include data-bundle-a or data-bundle-b
      expect(result.every(t => !t.bundleId.startsWith('data-'))).toBe(true);
    });
  });
});
