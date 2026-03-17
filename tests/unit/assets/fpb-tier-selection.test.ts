/**
 * Unit Tests: Full-Page Bundle Tier Pill Helper Functions
 *
 * Tests the pure helper functions for the Beco-style pricing tier pill selector:
 * - parseTierConfig: parses the JSON array from data-tier-config
 * - isTierActive:    returns whether a given tier index is the active one
 */

// ============================================================
// Types
// ============================================================

interface TierConfig {
  label: string;
  bundleId: string;
}

// ============================================================
// Pure function implementations under test
// These must match exactly what is implemented in bundle-widget-full-page.js
// ============================================================

function parseTierConfig(rawJson: string): TierConfig[] {
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t: any) => typeof t?.label === 'string' && typeof t?.bundleId === 'string')
      .map((t: any) => ({
        label: t.label.trim(),
        bundleId: t.bundleId.trim(),
      }))
      .filter((t: TierConfig) => t.label !== '' && t.bundleId !== '')
      .slice(0, 4);
  } catch {
    return [];
  }
}

function isTierActive(activeTierIndex: number, candidateIndex: number): boolean {
  return candidateIndex === activeTierIndex;
}

function buildTierPillsAriaLabel(_tierCount: number): string {
  return 'Bundle pricing tiers';
}

// ============================================================
// parseTierConfig
// ============================================================

describe('parseTierConfig', () => {
  it('returns empty array for empty string input', () => {
    expect(parseTierConfig('')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseTierConfig('not-json')).toEqual([]);
  });

  it('returns empty array for JSON null', () => {
    expect(parseTierConfig('null')).toEqual([]);
  });

  it('returns empty array for JSON that is not an array', () => {
    expect(parseTierConfig('{"label":"a","bundleId":"b"}')).toEqual([]);
  });

  it('parses two valid tiers correctly', () => {
    const input = JSON.stringify([
      { label: 'Buy 2 @499', bundleId: 'bundle-a' },
      { label: 'Buy 3 @699', bundleId: 'bundle-b' },
    ]);
    expect(parseTierConfig(input)).toEqual([
      { label: 'Buy 2 @499', bundleId: 'bundle-a' },
      { label: 'Buy 3 @699', bundleId: 'bundle-b' },
    ]);
  });

  it('parses four valid tiers correctly', () => {
    const input = JSON.stringify([
      { label: 'T1', bundleId: 'b1' },
      { label: 'T2', bundleId: 'b2' },
      { label: 'T3', bundleId: 'b3' },
      { label: 'T4', bundleId: 'b4' },
    ]);
    const result = parseTierConfig(input);
    expect(result).toHaveLength(4);
    expect(result[3]).toEqual({ label: 'T4', bundleId: 'b4' });
  });

  it('filters out tiers with blank label', () => {
    const input = JSON.stringify([
      { label: '', bundleId: 'bundle-a' },
      { label: 'Buy 2', bundleId: 'bundle-b' },
    ]);
    expect(parseTierConfig(input)).toEqual([{ label: 'Buy 2', bundleId: 'bundle-b' }]);
  });

  it('filters out tiers with blank bundleId', () => {
    const input = JSON.stringify([
      { label: 'Buy 2', bundleId: '' },
      { label: 'Buy 3', bundleId: 'bundle-b' },
    ]);
    expect(parseTierConfig(input)).toEqual([{ label: 'Buy 3', bundleId: 'bundle-b' }]);
  });

  it('filters out tiers with both fields blank', () => {
    const input = JSON.stringify([{ label: '', bundleId: '' }]);
    expect(parseTierConfig(input)).toEqual([]);
  });

  it('trims whitespace from label and bundleId', () => {
    const input = JSON.stringify([{ label: '  Buy 2  ', bundleId: '  bundle-a  ' }]);
    expect(parseTierConfig(input)).toEqual([{ label: 'Buy 2', bundleId: 'bundle-a' }]);
  });

  it('returns at most 4 tiers even if input has more', () => {
    const input = JSON.stringify([
      { label: 'T1', bundleId: 'b1' },
      { label: 'T2', bundleId: 'b2' },
      { label: 'T3', bundleId: 'b3' },
      { label: 'T4', bundleId: 'b4' },
      { label: 'T5', bundleId: 'b5' },
    ]);
    expect(parseTierConfig(input)).toHaveLength(4);
  });
});

// ============================================================
// isTierActive
// ============================================================

describe('isTierActive', () => {
  it('returns true when candidateIndex equals activeTierIndex', () => {
    expect(isTierActive(1, 1)).toBe(true);
  });

  it('returns false when candidateIndex does not equal activeTierIndex', () => {
    expect(isTierActive(0, 1)).toBe(false);
  });

  it('returns true for index 0 when activeTierIndex is 0', () => {
    expect(isTierActive(0, 0)).toBe(true);
  });

  it('returns false for index 0 when activeTierIndex is 1', () => {
    expect(isTierActive(1, 0)).toBe(false);
  });
});

// ============================================================
// buildTierPillsAriaLabel
// ============================================================

describe('buildTierPillsAriaLabel', () => {
  it('returns "Bundle pricing tiers" for any count >= 2', () => {
    expect(buildTierPillsAriaLabel(2)).toBe('Bundle pricing tiers');
    expect(buildTierPillsAriaLabel(4)).toBe('Bundle pricing tiers');
  });
});
