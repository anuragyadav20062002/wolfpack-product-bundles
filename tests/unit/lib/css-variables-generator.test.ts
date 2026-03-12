/**
 * Unit Tests for app/lib/css-generators/css-variables-generator.ts
 *
 * TDD — tests written before implementation of buttonAddedBgColor / buttonAddedTextColor.
 * Covers: generateCSSVariables emits --bundle-button-added-bg and --bundle-button-added-text
 */

import { generateCSSVariables } from '../../../app/lib/css-generators/css-variables-generator';
import type { CSSGenerationContext } from '../../../app/lib/css-generators/css-variables-generator';

// Minimal valid context
function makeCtx(overrides: Partial<CSSGenerationContext['settings']> = {}): CSSGenerationContext {
  return {
    settings: {
      // Required fields with safe defaults
      buttonBgColor: '#FF9000',
      buttonTextColor: '#FFFFFF',
      buttonFontSize: 16,
      buttonFontWeight: 600,
      buttonBorderRadius: 8,
      buttonHoverBgColor: '#E68200',
      buttonAddToCartText: 'Add to cart',
      ...overrides,
    } as any,
    globalPrimaryButton: '#000000',
    globalButtonText: '#FFFFFF',
    globalPrimaryText: '#111111',
    globalSecondaryText: '#666666',
    globalFooterBg: '#FFFFFF',
    globalFooterText: '#111111',
  };
}

describe('generateCSSVariables — added button state', () => {
  describe('--bundle-button-added-bg', () => {
    it('emits the default green (#10B981) when buttonAddedBgColor is not set', () => {
      const ctx = makeCtx({ buttonAddedBgColor: undefined });
      const css = generateCSSVariables(ctx);
      expect(css).toContain('--bundle-button-added-bg: #10B981');
    });

    it('emits the custom colour when buttonAddedBgColor is set', () => {
      const ctx = makeCtx({ buttonAddedBgColor: '#7132FF' });
      const css = generateCSSVariables(ctx);
      expect(css).toContain('--bundle-button-added-bg: #7132FF');
    });

    it('does NOT emit the hardcoded green when a custom colour is provided', () => {
      const ctx = makeCtx({ buttonAddedBgColor: '#FF0000' });
      const css = generateCSSVariables(ctx);
      expect(css).not.toContain('--bundle-button-added-bg: #10B981');
      expect(css).toContain('--bundle-button-added-bg: #FF0000');
    });
  });

  describe('--bundle-button-added-text', () => {
    it('emits white (#FFFFFF) when buttonAddedTextColor is not set', () => {
      const ctx = makeCtx({ buttonAddedTextColor: undefined });
      const css = generateCSSVariables(ctx);
      expect(css).toContain('--bundle-button-added-text: #FFFFFF');
    });

    it('emits the custom colour when buttonAddedTextColor is set', () => {
      const ctx = makeCtx({ buttonAddedTextColor: '#000000' });
      const css = generateCSSVariables(ctx);
      expect(css).toContain('--bundle-button-added-text: #000000');
    });

    it('does NOT emit white when a dark text colour is provided', () => {
      const ctx = makeCtx({ buttonAddedTextColor: '#1A1A1A' });
      const css = generateCSSVariables(ctx);
      expect(css).not.toContain('--bundle-button-added-text: #FFFFFF');
      expect(css).toContain('--bundle-button-added-text: #1A1A1A');
    });
  });

  describe('coexistence with existing button vars', () => {
    it('emits both --bundle-button-bg and --bundle-button-added-bg independently', () => {
      const ctx = makeCtx({ buttonBgColor: '#FF9000', buttonAddedBgColor: '#10B981' });
      const css = generateCSSVariables(ctx);
      expect(css).toContain('--bundle-button-bg: #FF9000');
      expect(css).toContain('--bundle-button-added-bg: #10B981');
    });
  });
});
