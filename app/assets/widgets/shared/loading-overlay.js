/**
 * Loading overlay lifecycle helpers.
 *
 * Keeps visual transition behavior independent from accessibility exposure, and
 * removes overlays even if the browser does not emit a transitionend event.
 */

'use strict';

const DEFAULT_HIDE_TIMEOUT_MS = 400;

export function markLoadingOverlayVisible(overlay) {
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-visible');
}

export function hideLoadingOverlayElement(overlay, timeoutMs = DEFAULT_HIDE_TIMEOUT_MS) {
  if (!overlay) return;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
  };

  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('is-visible');
  overlay.addEventListener('transitionend', finish, { once: true });

  const scheduler = typeof window !== 'undefined' && window.setTimeout
    ? window.setTimeout.bind(window)
    : setTimeout;
  scheduler(finish, timeoutMs);
}
