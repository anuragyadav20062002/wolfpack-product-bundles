/**
 * Shared imperative helpers for Polaris web component modals.
 *
 * showOverlay()/hideOverlay() fire events but do not reliably open/close the
 * dialog in all Polaris versions; always call show()/hide() unconditionally.
 *
 * React 18 does not wire custom event listeners for web component custom events
 * when passed as JSX props (e.g. onHide). Use useModalHideListener to attach
 * native close handlers via addEventListener instead.
 */

import { useEffect, useRef } from "react";

export function showPolarisModal(ref: { current: any }): void {
  const modal = ref.current as any;
  modal?.showOverlay?.();
  modal?.show?.();
}

export function hidePolarisModal(ref: { current: any }): void {
  const modal = ref.current as any;
  modal?.hideOverlay?.();
  modal?.hide?.();
  modal?.close?.();
  if (modal) {
    modal.open = false;
    modal.removeAttribute?.("open");
  }
}

/**
 * Attaches native dismiss/hide event listeners to an s-modal so React state
 * stays in sync when the user closes the modal via Escape, backdrop, or the
 * built-in close button. React 18 does not wire onHide as a DOM event
 * listener for custom elements — use this hook instead.
 */
export function useModalHideListener(
  ref: { current: HTMLElement | null },
  onHide: () => void
): void {
  const handlerRef = useRef(onHide);
  handlerRef.current = onHide;

  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    const handler = () => handlerRef.current();
    modal.addEventListener("dismiss", handler);
    modal.addEventListener("hide", handler);
    return () => {
      modal.removeEventListener("dismiss", handler);
      modal.removeEventListener("hide", handler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
