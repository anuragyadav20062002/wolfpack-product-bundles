/**
 * Unit tests for FullPagePreset.
 *
 * Issue: feedback-jun26-3 (phase 3c — wire preset attribute on FPB container)
 */
export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FullPagePreset = require('../../../app/assets/widgets/shared/full-page-preset.js');

describe('FullPagePreset.resolvePresetAttr', () => {
  it('returns DEFAULT when bundle has no preset fields', () => {
    expect(FullPagePreset.resolvePresetAttr({})).toBe('DEFAULT');
    expect(FullPagePreset.resolvePresetAttr(null)).toBe('DEFAULT');
    expect(FullPagePreset.resolvePresetAttr(undefined)).toBe('DEFAULT');
  });

  it('maps STANDARD to DEFAULT', () => {
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'STANDARD' })).toBe('DEFAULT');
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'standard' })).toBe('DEFAULT');
  });

  it('passes through CLASSIC / COMPACT / HORIZONTAL', () => {
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'CLASSIC' })).toBe('CLASSIC');
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'COMPACT' })).toBe('COMPACT');
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'HORIZONTAL' })).toBe('HORIZONTAL');
  });

  it('uppercases lowercase preset values', () => {
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPresetId: 'horizontal' })).toBe('HORIZONTAL');
  });

  it('falls back through bundleDesignPreset and templateId', () => {
    expect(FullPagePreset.resolvePresetAttr({ bundleDesignPreset: 'CLASSIC' })).toBe('CLASSIC');
    expect(FullPagePreset.resolvePresetAttr({ templateId: 'COMPACT' })).toBe('COMPACT');
  });

  it('prefers bundleDesignPresetId over the fallbacks', () => {
    const result = FullPagePreset.resolvePresetAttr({
      bundleDesignPresetId: 'HORIZONTAL',
      bundleDesignPreset: 'CLASSIC',
      templateId: 'COMPACT',
    });
    expect(result).toBe('HORIZONTAL');
  });
});

describe('FullPagePreset.resolveTemplateAttr', () => {
  it('returns FBP_SIDE_FOOTER when missing', () => {
    expect(FullPagePreset.resolveTemplateAttr({})).toBe('FBP_SIDE_FOOTER');
    expect(FullPagePreset.resolveTemplateAttr(null)).toBe('FBP_SIDE_FOOTER');
  });

  it('uppercases and trims the template value', () => {
    expect(FullPagePreset.resolveTemplateAttr({ bundleDesignTemplate: '  fbp_side_footer ' })).toBe('FBP_SIDE_FOOTER');
  });
});

describe('FullPagePreset.markContainer', () => {
  function makeContainer() {
    return { dataset: {} as Record<string, string> };
  }

  it('writes both data attributes on the container', () => {
    const container = makeContainer();
    FullPagePreset.markContainer(container, { bundleDesignPresetId: 'HORIZONTAL', bundleDesignTemplate: 'FBP_SIDE_FOOTER' });
    expect(container.dataset.fpbDesignPreset).toBe('HORIZONTAL');
    expect(container.dataset.fpbTemplate).toBe('FBP_SIDE_FOOTER');
  });

  it('writes DEFAULT + FBP_SIDE_FOOTER when bundle is empty', () => {
    const container = makeContainer();
    FullPagePreset.markContainer(container, {});
    expect(container.dataset.fpbDesignPreset).toBe('DEFAULT');
    expect(container.dataset.fpbTemplate).toBe('FBP_SIDE_FOOTER');
  });

  it('does nothing when container is null or has no dataset', () => {
    // Should not throw
    expect(() => FullPagePreset.markContainer(null, {})).not.toThrow();
    expect(() => FullPagePreset.markContainer({} as any, {})).not.toThrow();
  });

  it('is idempotent — second call rewrites the same values', () => {
    const container = makeContainer();
    FullPagePreset.markContainer(container, { bundleDesignPresetId: 'CLASSIC' });
    FullPagePreset.markContainer(container, { bundleDesignPresetId: 'CLASSIC' });
    expect(container.dataset.fpbDesignPreset).toBe('CLASSIC');
  });
});

describe('FullPagePreset.shouldUseReferenceStepBarTimeline', () => {
  it.each(['DEFAULT', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'enables the reference step bar for FPB footer-side preset %s',
    (presetId) => {
      expect(FullPagePreset.shouldUseReferenceStepBarTimeline({
        layout: 'footer_side',
        presetId,
      })).toBe(true);
    },
  );

  it('accepts STANDARD as the DEFAULT preset alias', () => {
    expect(FullPagePreset.shouldUseReferenceStepBarTimeline({
      layout: 'footer_side',
      presetId: 'STANDARD',
    })).toBe(true);
  });

  it('does not enable the reference step bar outside the footer-side FPB layout', () => {
    expect(FullPagePreset.shouldUseReferenceStepBarTimeline({
      layout: 'footer_bottom',
      presetId: 'DEFAULT',
    })).toBe(false);
  });
});
