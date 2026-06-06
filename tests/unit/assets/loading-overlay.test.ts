// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  hideLoadingOverlayElement,
  markLoadingOverlayVisible,
} = require('../../../app/assets/widgets/shared/loading-overlay.js');

function createOverlay() {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const listeners = new Map<string, Array<() => void>>();
  return {
    removed: false,
    classList: {
      add: (className: string) => classes.add(className),
      remove: (className: string) => classes.delete(className),
      contains: (className: string) => classes.has(className),
    },
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    addEventListener: (name: string, listener: () => void) => {
      listeners.set(name, [...(listeners.get(name) || []), listener]);
    },
    dispatchEvent: (name: string) => {
      (listeners.get(name) || []).forEach((listener) => listener());
    },
    remove() {
      this.removed = true;
    },
  };
}

describe('loading overlay helpers', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('marks a visible overlay as exposed to assistive tech while loading', () => {
    const overlay = createOverlay();

    markLoadingOverlayVisible(overlay);

    expect(overlay.classList.contains('is-visible')).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('false');
  });

  it('removes and hides the overlay when transitionend fires', () => {
    jest.useFakeTimers();
    const overlay = createOverlay();
    overlay.classList.add('is-visible');

    hideLoadingOverlayElement(overlay);
    overlay.dispatchEvent('transitionend');

    expect(overlay.removed).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('removes and hides the overlay when no transitionend event fires', () => {
    jest.useFakeTimers();
    const overlay = createOverlay();
    overlay.classList.add('is-visible');

    hideLoadingOverlayElement(overlay, 250);
    jest.advanceTimersByTime(250);

    expect(overlay.removed).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });
});
