import { useEffect, useRef } from "react";

type WizardModalApi = {
  show: (id: string) => void;
  hide: (id: string) => void;
};

type FocusTarget = {
  focus: () => void;
};

type WizardModalElement = {
  addEventListener: (name: string, listener: EventListener) => void;
  removeEventListener: (name: string, listener: EventListener) => void;
};

declare const shopify: { modal: WizardModalApi };

export const WIZARD_MODAL_IDS = {
  customFields: "wizard-custom-fields-modal",
  filters: "wizard-filters-modal",
  language: "wizard-language-modal",
} as const;

export function setWizardModalVisibility(
  modal: WizardModalApi,
  modalId: string,
  open: boolean,
) {
  if (open) {
    modal.show(modalId);
    return;
  }
  modal.hide(modalId);
}

export function restoreWizardModalFocus(opener: FocusTarget | null) {
  opener?.focus();
}

export function bindWizardModalDismiss(
  modal: WizardModalElement,
  onClose: EventListener,
) {
  modal.addEventListener("dismiss", onClose);
  modal.addEventListener("hide", onClose);
  return () => {
    modal.removeEventListener("dismiss", onClose);
    modal.removeEventListener("hide", onClose);
  };
}

export function useWizardModalController({
  modalId,
  open,
  onClose,
}: {
  modalId: string;
  open: boolean;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<FocusTarget | null>(null);
  const openRef = useRef(open);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
    if (open && !wasOpenRef.current) {
      openerRef.current = document.activeElement as unknown as FocusTarget;
    }

    setWizardModalVisibility(shopify.modal, modalId, open);

    if (!open && wasOpenRef.current) {
      window.requestAnimationFrame(() =>
        restoreWizardModalFocus(openerRef.current),
      );
    }
    wasOpenRef.current = open;
  }, [modalId, open]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const handleDismiss = () => {
      if (!openRef.current) return;
      openRef.current = false;
      onClose();
      window.requestAnimationFrame(() =>
        restoreWizardModalFocus(openerRef.current),
      );
    };

    return bindWizardModalDismiss(modal, handleDismiss);
  }, [onClose]);

  return modalRef;
}
