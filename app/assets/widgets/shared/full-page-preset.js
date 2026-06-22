/**
 * Full-page bundle preset resolution.
 *
 * Pure helpers used by the FPB widget to derive the data attributes that
 * drive preset-scoped CSS rules in bundle-widget-full-page.css. The CSS
 * rules key on `data-fpb-design-preset` and `data-fpb-template`; this
 * module turns the bundle config into those attribute values.
 *
 * Exported as a single `FullPagePreset` object so that:
 *  - The widget bundle (IIFE) can access it as a local variable in scope
 *  - Node.js test environments can require() it via module.exports
 */

'use strict';

const FullPagePreset = (function () {
  const SUPPORTED_PRESETS = ['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'];

  /**
   * Normalize a raw preset id to one of the four supported values.
   * STANDARD is the canonical Standard preset and the fallback value.
   */
  function resolvePresetAttr(bundle) {
    const raw =
      (bundle && (bundle.bundleDesignPresetId || bundle.bundleDesignPreset || bundle.templateId)) || '';
    if (typeof raw !== 'string') return 'STANDARD';
    const upper = raw.trim().toUpperCase();
    if (SUPPORTED_PRESETS.includes(upper)) return upper;
    return 'STANDARD';
  }

  function resolveTemplateAttr(bundle) {
    const raw = bundle && bundle.bundleDesignTemplate;
    if (typeof raw !== 'string' || raw.trim() === '') return 'FBP_SIDE_FOOTER';
    return raw.trim().toUpperCase();
  }

  /**
   * Apply the preset + template data attributes to the widget container.
   * Safe to call repeatedly (idempotent).
   */
  function markContainer(container, bundle) {
    if (!container || !container.dataset) return;
    container.dataset.fpbDesignPreset = resolvePresetAttr(bundle);
    container.dataset.fpbTemplate = resolveTemplateAttr(bundle);
  }

  function shouldUseReferenceStepBarTimeline({ layout, presetId } = {}) {
    const normalizedLayout = typeof layout === 'string' ? layout.trim().toLowerCase() : '';
    if (normalizedLayout !== 'footer_side') return false;

    const preset = resolvePresetAttr({ bundleDesignPresetId: presetId });
    return SUPPORTED_PRESETS.includes(preset);
  }

  return {
    resolvePresetAttr,
    resolveTemplateAttr,
    markContainer,
    shouldUseReferenceStepBarTimeline,
  };
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullPagePreset;
}
