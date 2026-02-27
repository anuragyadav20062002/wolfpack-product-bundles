'use strict';

/**
 * Default Loading Animation
 *
 * A polished three-dot pulsing loader rendered as inline SVG with CSS animations.
 * Designed from a Lottie JSON source (see default-loading-animation.json).
 * Used as the fallback when merchants have not uploaded a custom loading GIF.
 */

/**
 * Creates and returns the default loading animation DOM element.
 * The animation is a three-dot pulse rendered as inline SVG.
 * CSS keyframes are injected once on first call (idempotent).
 *
 * @returns {HTMLDivElement} A wrapper div containing the animated SVG
 */
export function createDefaultLoadingAnimation() {
  // Inject CSS keyframes once (idempotent check)
  if (!document.getElementById('bundle-default-loading-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bundle-default-loading-keyframes';
    style.textContent = `
      @keyframes bundle-dot-pulse {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'bundle-loading-overlay__default-animation';

  wrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40" role="img" aria-label="Loading">
  <circle cx="20" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out -0.32s infinite; transform-origin: 20px 20px;" />
  <circle cx="60" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out -0.16s infinite; transform-origin: 60px 20px;" />
  <circle cx="100" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out 0s infinite; transform-origin: 100px 20px;" />
</svg>`;

  return wrapper;
}
