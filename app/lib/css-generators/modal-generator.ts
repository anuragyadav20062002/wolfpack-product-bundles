/**
 * Modal CSS Generator
 *
 * Generates CSS rules for modals and general styling in the bundle widget.
 */

/**
 * Generate modal and general CSS rules
 */
export function generateModalCSS(): string {
  return `
/* EMPTY STATE CARDS IN MODAL */
.bundle-builder-modal .modal-body .empty-state-card {
  background-color: var(--bundle-empty-state-card-bg);
  border: 2.6px var(--bundle-empty-state-border-style) var(--bundle-empty-state-card-border);
}

.bundle-builder-modal .modal-body .empty-state-card-icon,
.bundle-builder-modal .modal-body .empty-state-card-text {
  color: var(--bundle-empty-state-text);
}

/* MODAL HEADER STYLING */
.bundle-builder-modal .modal-step-title {
  color: var(--modal-step-title-color);
}

/* BUNDLE HEADER TABS STYLING */
.bundle-builder-modal .modal-tabs .bundle-header-tab {
  border-radius: var(--bundle-header-tab-radius);
}

.bundle-builder-modal .modal-tabs .bundle-header-tab:not(.active):not(.locked) {
  background-color: var(--bundle-header-tab-inactive-bg);
  color: var(--bundle-header-tab-inactive-text);
}

.bundle-builder-modal .modal-tabs .bundle-header-tab.active {
  background-color: var(--bundle-header-tab-active-bg);
  color: var(--bundle-header-tab-active-text);
  border: 1px solid var(--bundle-header-tab-active-bg);
}

/* GENERAL STYLING */
#bundle-builder-app,
.bundle-builder-modal .modal-content {
  background-color: var(--bundle-bg-color);
}`;
}
