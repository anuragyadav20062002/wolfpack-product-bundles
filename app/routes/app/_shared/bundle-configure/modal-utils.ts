/**
 * Shared imperative helpers for Polaris web component modals.
 *
 * Polaris s-modal in the embedded Admin iframe opens through showOverlay().
 * Always pair that with hideOverlay() before React unmounts the modal so the
 * Shopify Admin chrome is not left dimmed/inert.
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
 * Attaches native dismiss/hide/close event listeners to an s-modal so React state
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
    const closeClickHandler = (event: MouseEvent) => {
      const path = event.composedPath();
      const clickedCloseButton = path.some((node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.getAttribute("aria-label") === "Close" || node.textContent?.trim() === "Close";
      });
      if (clickedCloseButton) handlerRef.current();
    };
    modal.addEventListener("dismiss", handler);
    modal.addEventListener("hide", handler);
    modal.addEventListener("close", handler);
    modal.addEventListener("afterhide", handler);
    modal.addEventListener("click", closeClickHandler);
    return () => {
      modal.removeEventListener("dismiss", handler);
      modal.removeEventListener("hide", handler);
      modal.removeEventListener("close", handler);
      modal.removeEventListener("afterhide", handler);
      modal.removeEventListener("click", closeClickHandler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
