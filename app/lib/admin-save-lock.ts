const EDITABLE_TARGET_SELECTOR = [
  'input:not([type="hidden"])',
  "textarea",
  "select",
  "button",
  "s-button",
  "s-switch",
  "s-checkbox",
  "s-select",
  "s-text-field",
  "s-number-field",
  "s-search-field",
  "s-drop-zone",
  "s-clickable",
  "s-clickable-chip",
  "s-chip",
  '[role="button"]',
  '[contenteditable="true"]',
].join(",");

const SAVE_LOCK_ALLOW_SELECTOR = '[data-save-lock-allow="true"]';

type ClosestCapableTarget = {
  closest?: (selector: string) => unknown;
};

type CancellableEvent = {
  target: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
};

export function shouldBlockAdminConfigInteraction({
  isSaving,
  target,
}: {
  isSaving: boolean;
  target: EventTarget | ClosestCapableTarget | null;
}): boolean {
  const closestTarget = target as ClosestCapableTarget | null;
  if (!isSaving || !closestTarget || typeof closestTarget.closest !== "function") {
    return false;
  }

  if (closestTarget.closest(SAVE_LOCK_ALLOW_SELECTOR)) {
    return false;
  }

  return Boolean(closestTarget.closest(EDITABLE_TARGET_SELECTOR));
}

export function handleAdminSaveLockedEvent(
  event: CancellableEvent,
  isSaving: boolean,
  onBlocked: () => void,
): boolean {
  if (!shouldBlockAdminConfigInteraction({ isSaving, target: event.target })) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  onBlocked();
  return true;
}
