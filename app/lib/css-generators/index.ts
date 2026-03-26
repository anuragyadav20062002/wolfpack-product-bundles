/**
 * CSS Generators Module
 *
 * Generates CSS from design settings for the bundle widget.
 * Exports the main generateCSSFromSettings function used by the API endpoint.
 */

import type { CSSDesignSettings, CSSGenerationContext } from "./types";
import type { ThemeColors } from "../../services/theme-colors.server";
import { generateCSSVariables, generateFullPageVariables } from "./css-variables-generator";
import { generateProductCardCSS } from "./product-card-generator";
import { generateButtonCSS } from "./button-generator";
import { generateFooterCSS } from "./footer-generator";
import { generateModalCSS } from "./modal-generator";
import { generateResponsiveCSS } from "./responsive-generator";

// Re-export types
export type { CSSDesignSettings, CSSGenerationContext } from "./types";
export type { ThemeColors } from "../../services/theme-colors.server";

// Re-export individual generators for testing/direct access
export { generateCSSVariables, generateFullPageVariables } from "./css-variables-generator";
export { generateProductCardCSS } from "./product-card-generator";
export { generateButtonCSS } from "./button-generator";
export { generateFooterCSS } from "./footer-generator";
export { generateModalCSS } from "./modal-generator";
export { generateResponsiveCSS } from "./responsive-generator";

/**
 * Generate complete CSS from design settings
 *
 * @param settings - Design settings object
 * @param bundleType - Bundle type (product_page or full_page)
 * @param customCss - Custom CSS to append
 * @returns Complete CSS string
 */
export function generateCSSFromSettings(
  settings: CSSDesignSettings,
  bundleType: string,
  customCss: string = "",
  themeColors?: ThemeColors | null
): string {
  // Resolve global color anchors: DCP custom value → theme color → hardcoded default
  const globalPrimaryButton = settings.globalPrimaryButtonColor || themeColors?.globalPrimaryButton || '#000000';
  const globalButtonText = settings.globalButtonTextColor || themeColors?.globalButtonText || '#FFFFFF';
  const globalPrimaryText = settings.globalPrimaryTextColor || themeColors?.globalPrimaryText || '#000000';
  const globalSecondaryText = settings.globalSecondaryTextColor || themeColors?.globalSecondaryText || '#6B7280';
  const globalFooterBg = settings.globalFooterBgColor || themeColors?.globalFooterBg || '#FFFFFF';
  const globalFooterText = settings.globalFooterTextColor || themeColors?.globalFooterText || '#000000';

  // Create generation context
  const ctx: CSSGenerationContext = {
    settings,
    globalPrimaryButton,
    globalButtonText,
    globalPrimaryText,
    globalSecondaryText,
    globalFooterBg,
    globalFooterText,
    bundleType,
    customCss
  };

  // Generate CSS sections
  const cssVariables = generateCSSVariables(ctx);
  const fullPageVariables = bundleType === 'full_page' ? generateFullPageVariables(ctx) : '';
  const productCardCSS = generateProductCardCSS();
  const buttonCSS = generateButtonCSS();
  const footerCSS = generateFooterCSS();
  const modalCSS = generateModalCSS();
  const responsiveCSS = generateResponsiveCSS();

  // Compose final CSS
  return `
/*
 * Wolfpack Bundle Widget - Design Settings
 * Bundle Type: ${bundleType}
 * Auto-generated from Design Control Panel
 *
 * Global Colors System:
 * - Global colors automatically cascade to all relevant components
 * - Component-specific colors override global colors when set
 * - This ensures brand consistency while allowing fine-grained control
 */

:root {
${cssVariables}
${fullPageVariables}
}
${productCardCSS}
${buttonCSS}
${footerCSS}
${modalCSS}
${responsiveCSS}

/* ============================================
   MERCHANT CUSTOM CSS
   Add your own CSS rules below to further
   customize the bundle widget appearance.
   ============================================ */
${customCss ? customCss : '/* No custom CSS defined */'}
`.trim();
}
