/**
 * Unit Tests: Theme Color Inheritance in CSS Generator
 *
 * Verifies the three-level cascade in generateCSSFromSettings:
 *   DCP custom value → theme color → hardcoded default
 */

import { generateCSSFromSettings } from "../../../app/lib/css-generators";
import type { ThemeColors } from "../../../app/services/theme-colors.server";

const THEME_COLORS: ThemeColors = {
  globalPrimaryButton: "#1A56DB",
  globalButtonText: "#FFFFFF",
  globalPrimaryText: "#111827",
  globalSecondaryText: "#6B7280",
  globalFooterBg: "#F9FAFB",
  globalFooterText: "#111827",
  syncedAt: "2026-03-26T00:00:00.000Z",
};

describe("generateCSSFromSettings — theme color cascade", () => {
  describe("globalPrimaryButton", () => {
    it("uses DCP value when set (DCP wins over theme)", () => {
      const css = generateCSSFromSettings(
        { globalPrimaryButtonColor: "#FF0000" },
        "product_page",
        "",
        THEME_COLORS
      );
      expect(css).toContain("--bundle-global-primary-button: #FF0000");
    });

    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings(
        {},
        "product_page",
        "",
        THEME_COLORS
      );
      expect(css).toContain("--bundle-global-primary-button: #1A56DB");
    });

    it("uses hardcoded default when both DCP and theme are absent", () => {
      const css = generateCSSFromSettings(
        {},
        "product_page",
        "",
        null
      );
      expect(css).toContain("--bundle-global-primary-button: #000000");
    });
  });

  describe("globalButtonText", () => {
    it("uses DCP value when set", () => {
      const css = generateCSSFromSettings(
        { globalButtonTextColor: "#333333" },
        "product_page",
        "",
        THEME_COLORS
      );
      expect(css).toContain("--bundle-global-button-text: #333333");
    });

    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-global-button-text: #FFFFFF");
    });

    it("uses hardcoded default when both absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", null);
      expect(css).toContain("--bundle-global-button-text: #FFFFFF");
    });
  });

  describe("globalPrimaryText", () => {
    it("uses DCP value when set", () => {
      const css = generateCSSFromSettings(
        { globalPrimaryTextColor: "#222222" },
        "product_page",
        "",
        THEME_COLORS
      );
      expect(css).toContain("--bundle-global-primary-text: #222222");
    });

    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-global-primary-text: #111827");
    });

    it("uses hardcoded default when both absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", null);
      expect(css).toContain("--bundle-global-primary-text: #000000");
    });
  });

  describe("globalSecondaryText", () => {
    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-global-secondary-text: #6B7280");
    });

    it("uses hardcoded default when both absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", null);
      expect(css).toContain("--bundle-global-secondary-text: #6B7280"); // same as hardcoded
    });
  });

  describe("globalFooterBg", () => {
    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-global-footer-bg: #F9FAFB");
    });

    it("uses hardcoded default when both absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", null);
      expect(css).toContain("--bundle-global-footer-bg: #FFFFFF");
    });
  });

  describe("globalFooterText", () => {
    it("uses theme color when DCP value is absent", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-global-footer-text: #111827");
    });
  });

  describe("backward compatibility — themeColors not passed", () => {
    it("works identically when themeColors param is omitted", () => {
      const withUndefined = generateCSSFromSettings({ globalPrimaryButtonColor: "#ABCDEF" }, "product_page");
      const withNull = generateCSSFromSettings({ globalPrimaryButtonColor: "#ABCDEF" }, "product_page", "", null);
      expect(withUndefined).toBe(withNull);
    });

    it("uses hardcoded defaults when DCP color absent and themeColors omitted", () => {
      const css = generateCSSFromSettings({}, "product_page");
      expect(css).toContain("--bundle-global-primary-button: #000000");
      expect(css).toContain("--bundle-global-button-text: #FFFFFF");
    });
  });

  describe("downstream cascade — theme colors propagate to dependent vars", () => {
    it("button-add-to-cart uses globalPrimaryButton when no explicit setting", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      // --bundle-add-to-cart-button-bg falls back to globalPrimaryButton
      expect(css).toContain("--bundle-add-to-cart-button-bg: #1A56DB");
    });

    it("tabs-active-bg uses globalPrimaryButton when no explicit setting", () => {
      const css = generateCSSFromSettings({}, "product_page", "", THEME_COLORS);
      expect(css).toContain("--bundle-tabs-active-bg-color: #1A56DB");
    });
  });
});
