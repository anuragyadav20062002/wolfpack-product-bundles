/**
 * Shared imperative helpers for Polaris web component modals.
 *
 * Polaris modals (s-modal) expose `showOverlay`/`hideOverlay` in newer builds
 * and fall back to `show`/`hide` in older ones. These wrappers handle both.
 */

export function showPolarisModal(ref: { current: any }): void {
  const modal = ref.current as any;
  modal?.showOverlay?.();
  if (!modal?.showOverlay) modal?.show?.();
}

export function hidePolarisModal(ref: { current: any }): void {
  const modal = ref.current as any;
  modal?.hideOverlay?.();
  if (!modal?.hideOverlay) modal?.hide?.();
}
