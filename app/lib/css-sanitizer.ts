/**
 * CSS Sanitizer Utility
 *
 * Sanitizes user-provided CSS to prevent XSS attacks and other security vulnerabilities.
 * This utility removes dangerous patterns that could be used for JavaScript injection
 * or other malicious purposes.
 *
 * Security patterns blocked:
 * - javascript: URLs
 * - vbscript: URLs
 * - data: URLs (can contain base64 JS)
 * - expression() (IE CSS expressions - can execute JS)
 * - behavior: (IE behavior property - can load HTC files with JS)
 * - -moz-binding: (Firefox XBL bindings - can execute JS)
 * - @import rules (can load external malicious CSS)
 * - @charset rules (can be used for encoding attacks)
 * - HTML tags within CSS (attempt to break out of style context)
 * - Event handlers (onclick, onerror, etc.)
 */

export interface CssSanitizeResult {
  sanitizedCss: string;
  isValid: boolean;
  warnings: string[];
  removedPatterns: string[];
}

// Dangerous patterns that can execute JavaScript or load external content
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  // JavaScript/VBScript URLs
  { pattern: /javascript\s*:/gi, name: "javascript: URL" },
  { pattern: /vbscript\s*:/gi, name: "vbscript: URL" },

  // Data URLs (can contain base64-encoded JavaScript)
  { pattern: /data\s*:/gi, name: "data: URL" },

  // IE CSS Expressions (execute JavaScript)
  { pattern: /expression\s*\(/gi, name: "CSS expression()" },

  // IE Behavior property (loads HTC files that can contain JS)
  { pattern: /behavior\s*:/gi, name: "behavior: property" },

  // Firefox XBL bindings (can execute JavaScript)
  { pattern: /-moz-binding\s*:/gi, name: "-moz-binding: property" },

  // Import rules (can load external malicious CSS)
  { pattern: /@import/gi, name: "@import rule" },

  // Charset rules (encoding attacks)
  { pattern: /@charset/gi, name: "@charset rule" },

  // HTML tags (attempt to break out of style context)
  { pattern: /<\s*script/gi, name: "<script> tag" },
  { pattern: /<\s*\/\s*script/gi, name: "</script> tag" },
  { pattern: /<\s*style/gi, name: "<style> tag" },
  { pattern: /<\s*\/\s*style/gi, name: "</style> tag" },
  { pattern: /<\s*link/gi, name: "<link> tag" },
  { pattern: /<\s*iframe/gi, name: "<iframe> tag" },
  { pattern: /<\s*object/gi, name: "<object> tag" },
  { pattern: /<\s*embed/gi, name: "<embed> tag" },
  { pattern: /<\s*img/gi, name: "<img> tag" },
  { pattern: /<\s*svg/gi, name: "<svg> tag" },

  // Event handlers (in case of HTML injection attempts)
  { pattern: /on\w+\s*=/gi, name: "event handler attribute" },

  // URL function with javascript/data
  { pattern: /url\s*\(\s*['"]?\s*javascript/gi, name: "url(javascript:)" },
  { pattern: /url\s*\(\s*['"]?\s*data/gi, name: "url(data:)" },
  { pattern: /url\s*\(\s*['"]?\s*vbscript/gi, name: "url(vbscript:)" },

  // Filter property (old IE, can be exploited)
  { pattern: /filter\s*:\s*[^;]*progid/gi, name: "filter: progid" },
  { pattern: /filter\s*:\s*[^;]*alpha\s*\(/gi, name: "filter: alpha()" },

  // -webkit-filter with url (potential SVG injection)
  { pattern: /-webkit-filter\s*:[^;]*url\s*\(/gi, name: "-webkit-filter with url()" },

  // CSS Houdini (can execute JavaScript via worklets)
  { pattern: /animation-timeline\s*:\s*[^;]*scroll\s*\(/gi, name: "animation-timeline worklet" },
  { pattern: /paint\s*\([^)]*\)/gi, name: "CSS paint() worklet" },

  // Null bytes and other escape sequences
  { pattern: /\\0/gi, name: "null byte escape" },
  { pattern: /\\x00/gi, name: "hex null escape" },
];

// Maximum allowed CSS length (50KB to match Shopify's liquid limit)
const MAX_CSS_LENGTH = 50 * 1024;

/**
 * Sanitizes CSS input by removing dangerous patterns that could execute JavaScript
 * or load external malicious content.
 *
 * @param css - Raw CSS string from user input
 * @returns Sanitized CSS result with warnings if any patterns were removed
 */
export function sanitizeCss(css: string): CssSanitizeResult {
  const warnings: string[] = [];
  const removedPatterns: string[] = [];
  let sanitizedCss = css;
  let isValid = true;

  // Check for empty input
  if (!css || css.trim() === "") {
    return {
      sanitizedCss: "",
      isValid: true,
      warnings: [],
      removedPatterns: [],
    };
  }

  // Check length limit
  if (css.length > MAX_CSS_LENGTH) {
    warnings.push(`CSS exceeds maximum length of ${MAX_CSS_LENGTH / 1024}KB. Content has been truncated.`);
    sanitizedCss = css.substring(0, MAX_CSS_LENGTH);
    isValid = false;
  }

  // Remove dangerous patterns
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitizedCss)) {
      removedPatterns.push(name);
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      sanitizedCss = sanitizedCss.replace(pattern, "/* [REMOVED: " + name + "] */");
      isValid = false;
    }
  }

  // Add warnings for removed patterns
  if (removedPatterns.length > 0) {
    warnings.push(
      `Potentially dangerous CSS patterns were removed: ${removedPatterns.join(", ")}`
    );
  }

  // Remove comments that might contain dangerous content (defense in depth)
  // This prevents attackers from hiding malicious code in comments
  sanitizedCss = sanitizedCss.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Check if the comment contains any dangerous patterns
    for (const { pattern, name } of DANGEROUS_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(match)) {
        return "/* [COMMENT REMOVED: contained potentially dangerous content] */";
      }
    }
    return match;
  });

  // Normalize whitespace and clean up multiple consecutive newlines
  sanitizedCss = sanitizedCss
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines

  return {
    sanitizedCss: sanitizedCss.trim(),
    isValid,
    warnings,
    removedPatterns,
  };
}

/**
 * Validates CSS syntax (basic check)
 * This is a lightweight validation that catches obvious syntax errors.
 *
 * @param css - CSS string to validate
 * @returns Object with validation result and error messages
 */
export function validateCssSyntax(css: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!css || css.trim() === "") {
    return { isValid: true, errors: [] };
  }

  // Count braces - they should be balanced
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening "{" vs ${closeBraces} closing "}"`);
  }

  // Count parentheses - they should be balanced
  const openParens = (css.match(/\(/g) || []).length;
  const closeParens = (css.match(/\)/g) || []).length;

  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening "(" vs ${closeParens} closing ")"`);
  }

  // Count brackets - they should be balanced
  const openBrackets = (css.match(/\[/g) || []).length;
  const closeBrackets = (css.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} opening "[" vs ${closeBrackets} closing "]"`);
  }

  // Check for unclosed strings
  const doubleQuotes = (css.match(/"/g) || []).length;
  const singleQuotes = (css.match(/'/g) || []).length;

  if (doubleQuotes % 2 !== 0) {
    errors.push("Unclosed double quote detected");
  }

  if (singleQuotes % 2 !== 0) {
    errors.push("Unclosed single quote detected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Full CSS processing pipeline: sanitize and validate
 *
 * @param css - Raw CSS string from user input
 * @returns Processed CSS result with all warnings and errors
 */
export function processCss(css: string): {
  sanitizedCss: string;
  isValid: boolean;
  warnings: string[];
  syntaxErrors: string[];
} {
  const sanitizeResult = sanitizeCss(css);
  const syntaxResult = validateCssSyntax(sanitizeResult.sanitizedCss);

  return {
    sanitizedCss: sanitizeResult.sanitizedCss,
    isValid: sanitizeResult.isValid && syntaxResult.isValid,
    warnings: sanitizeResult.warnings,
    syntaxErrors: syntaxResult.errors,
  };
}
