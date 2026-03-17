/**
 * Unit Tests: resolveShowStepTimeline — Admin-controlled step timeline visibility
 *
 * Rules:
 *  - apiValue non-null (true | false) → return apiValue (admin override wins)
 *  - apiValue null | undefined          → return dataAttrValue (theme editor fallback)
 */

// ============================================================
// Pure helper — mirrors what will be in bundle-widget-full-page.js
// ============================================================

/**
 * Resolves whether to show the step timeline.
 *
 * @param apiValue     - From selectedBundle.showStepTimeline (DB value, nullable)
 * @param dataAttrValue - From data-show-step-timeline attribute (theme editor, boolean)
 * @returns resolved boolean
 */
function resolveShowStepTimeline(
  apiValue: boolean | null | undefined,
  dataAttrValue: boolean
): boolean {
  if (apiValue !== null && apiValue !== undefined) return apiValue;
  return dataAttrValue;
}

// ============================================================
// Pure helper — mirrors server-side reset logic in handler
// ============================================================

/**
 * Determines the value to persist for showStepTimeline.
 * Resets to null when fewer than 2 tiers are active (no pills shown),
 * ensuring the theme editor data attribute regains control.
 *
 * @param tierCount         - Number of valid tiers after validation
 * @param adminValue        - The value the merchant set in Admin UI (null | true | false)
 */
function resolveShowStepTimelineForSave(
  tierCount: number,
  adminValue: boolean | null
): boolean | null {
  if (tierCount < 2) return null;  // Reset — no pills active, theme editor controls
  return adminValue;               // Persist what merchant set
}

// ============================================================
// Tests
// ============================================================

describe('resolveShowStepTimeline — widget helper', () => {

  describe('when API value is null (not set in admin UI)', () => {
    it('returns true when theme editor data attr is true', () => {
      expect(resolveShowStepTimeline(null, true)).toBe(true);
    });

    it('returns false when theme editor data attr is false', () => {
      expect(resolveShowStepTimeline(null, false)).toBe(false);
    });

    it('treats undefined same as null — falls back to data attr', () => {
      expect(resolveShowStepTimeline(undefined, true)).toBe(true);
      expect(resolveShowStepTimeline(undefined, false)).toBe(false);
    });
  });

  describe('when API value is set (admin override)', () => {
    it('returns true from API even if data attr is false', () => {
      expect(resolveShowStepTimeline(true, false)).toBe(true);
    });

    it('returns false from API even if data attr is true', () => {
      expect(resolveShowStepTimeline(false, true)).toBe(false);
    });

    it('returns true from API when data attr also true', () => {
      expect(resolveShowStepTimeline(true, true)).toBe(true);
    });

    it('returns false from API when data attr also false', () => {
      expect(resolveShowStepTimeline(false, false)).toBe(false);
    });
  });
});

describe('resolveShowStepTimelineForSave — server handler logic', () => {

  describe('when tier count < 2 (pills inactive)', () => {
    it('resets to null when tierCount=0, adminValue=false', () => {
      expect(resolveShowStepTimelineForSave(0, false)).toBeNull();
    });

    it('resets to null when tierCount=1, adminValue=false', () => {
      expect(resolveShowStepTimelineForSave(1, false)).toBeNull();
    });

    it('resets to null when tierCount=1, adminValue=true', () => {
      expect(resolveShowStepTimelineForSave(1, true)).toBeNull();
    });

    it('resets to null when tierCount=1, adminValue already null', () => {
      expect(resolveShowStepTimelineForSave(1, null)).toBeNull();
    });
  });

  describe('when tier count >= 2 (pills active)', () => {
    it('persists false when tierCount=2, adminValue=false', () => {
      expect(resolveShowStepTimelineForSave(2, false)).toBe(false);
    });

    it('persists true when tierCount=2, adminValue=true', () => {
      expect(resolveShowStepTimelineForSave(2, true)).toBe(true);
    });

    it('persists null when tierCount=3, adminValue=null', () => {
      expect(resolveShowStepTimelineForSave(3, null)).toBeNull();
    });

    it('persists false when tierCount=4, adminValue=false', () => {
      expect(resolveShowStepTimelineForSave(4, false)).toBe(false);
    });
  });
});
