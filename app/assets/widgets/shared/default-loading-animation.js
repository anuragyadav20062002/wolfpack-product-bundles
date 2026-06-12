'use strict';

/**
 * Default Loading Animation
 *
 * A CSS spinner fallback used when merchants have not uploaded a custom
 * loading GIF.
 */

/**
 * Creates and returns the default loading animation DOM element.
 * Styling lives in the widget CSS assets so this helper does not inject
 * runtime styles.
 *
 * @returns {HTMLDivElement} A spinner element
 */
export function createDefaultLoadingAnimation() {
  const spinner = document.createElement('div');
  spinner.className = 'bundle-loading-overlay__spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading');
  return spinner;
}
