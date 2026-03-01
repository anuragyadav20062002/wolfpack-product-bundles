// Color Utility Functions for hex <-> HSB conversion
// Used by the Polaris ColorPicker which works with HSB color model

export interface HSBColor {
  hue: number;       // 0-360
  saturation: number; // 0-1
  brightness: number; // 0-1
}

export interface HSBAColor extends HSBColor {
  alpha: number;     // 0-1
}

/**
 * Convert hex color string to HSB color object
 * @param hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns HSBColor object
 */
export function hexToHsb(hex: string): HSBColor {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate brightness
  const brightness = max;

  // Calculate saturation
  const saturation = max === 0 ? 0 : delta / max;

  // Calculate hue
  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return {
    hue,
    saturation,
    brightness,
  };
}

/**
 * Convert HSB color object to hex color string
 * @param hsb - HSBColor object
 * @returns Hex color string (e.g., "#FF0000")
 */
export function hsbToHex(hsb: HSBColor): string {
  const { hue, saturation, brightness } = hsb;

  const c = brightness * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness - c;

  let r = 0, g = 0, b = 0;

  if (hue >= 0 && hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Validate hex color format
 * @param hex - Hex color string to validate
 * @returns boolean indicating if the hex is valid
 */
export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Normalize hex color (ensure it has # prefix and is uppercase)
 * @param hex - Hex color string
 * @returns Normalized hex color string
 */
export function normalizeHex(hex: string): string {
  const cleanHex = hex.replace(/^#/, '');
  return `#${cleanHex.toUpperCase()}`;
}
