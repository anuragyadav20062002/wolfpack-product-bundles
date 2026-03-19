/**
 * Unit Tests: FPB Widget — Free Gift Badge Image
 *
 * Tests the `_getFreeGiftBadgeUrl()` helper and the badge rendering logic
 * that reads `--bundle-free-gift-badge-url` from CSS variables and conditionally
 * renders an <img> (when set) or "Free" text (when not set).
 *
 * DOM rendering is tested via a minimal in-process element builder
 * (no jsdom required — matches the pattern of other widget unit tests).
 */

export {};

// ============================================================
// Pure helper — mirrors _getFreeGiftBadgeUrl in bundle-widget-full-page.js
// ============================================================

function getFreeGiftBadgeUrl(cssVarValue: string): string | null {
  const val = cssVarValue.trim();
  if (!val || val === 'none') return null;
  const match = val.match(/^url\(['"]?(.*?)['"]?\)$/);
  return match ? match[1] : null;
}

// ============================================================
// Minimal element model — avoids jsdom dependency
// ============================================================

interface FakeElement {
  tagName: string;
  className: string;
  src?: string;
  alt?: string;
  textContent: string;
  children: FakeElement[];
  appendChild(child: FakeElement): void;
  querySelector(selector: string): FakeElement | null;
}

function createFakeElement(tag: string): FakeElement {
  const el: FakeElement = {
    tagName: tag.toUpperCase(),
    className: '',
    src: undefined,
    alt: undefined,
    textContent: '',
    children: [],
    appendChild(child: FakeElement) { this.children.push(child); },
    querySelector(selector: string): FakeElement | null {
      const tag = selector.toLowerCase();
      for (const child of this.children) {
        if (child.tagName.toLowerCase() === tag) return child;
        const found = child.querySelector(tag);
        if (found) return found;
      }
      return null;
    },
  };
  return el;
}

// ============================================================
// Badge builder — mirrors the isFreeGift block in bundle-widget-full-page.js
// ============================================================

function buildFreeBadge(badgeUrl: string | null): FakeElement {
  const badge = createFakeElement('span');
  badge.className = 'fpb-free-badge';
  if (badgeUrl) {
    const img = createFakeElement('img');
    img.src = badgeUrl;
    img.alt = 'Free gift';
    img.className = 'fpb-free-badge-img';
    badge.appendChild(img);
  } else {
    badge.textContent = 'Free';
  }
  return badge;
}

// ============================================================
// Tests: getFreeGiftBadgeUrl helper
// ============================================================

describe('getFreeGiftBadgeUrl', () => {
  it('returns the URL when CSS var is url("https://...")', () => {
    expect(getFreeGiftBadgeUrl('url("https://cdn.shopify.com/badge.png")')).toBe('https://cdn.shopify.com/badge.png');
  });

  it('returns the URL when CSS var uses single quotes', () => {
    expect(getFreeGiftBadgeUrl("url('https://cdn.shopify.com/badge.svg')")).toBe('https://cdn.shopify.com/badge.svg');
  });

  it('returns the URL when CSS var has no quotes around url()', () => {
    expect(getFreeGiftBadgeUrl('url(https://cdn.shopify.com/badge.png)')).toBe('https://cdn.shopify.com/badge.png');
  });

  it('returns null when CSS var is "none"', () => {
    expect(getFreeGiftBadgeUrl('none')).toBeNull();
  });

  it('returns null when CSS var is empty string', () => {
    expect(getFreeGiftBadgeUrl('')).toBeNull();
  });

  it('returns null when CSS var is whitespace only', () => {
    expect(getFreeGiftBadgeUrl('   ')).toBeNull();
  });
});

// ============================================================
// Tests: badge DOM rendering
// ============================================================

describe('buildFreeBadge', () => {
  it('renders an <img> with correct src when badge URL is set', () => {
    const badge = buildFreeBadge('https://cdn.shopify.com/badge.png');
    const img = badge.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toBe('https://cdn.shopify.com/badge.png');
    expect(img!.className).toBe('fpb-free-badge-img');
  });

  it('does not render "Free" text when badge URL is set', () => {
    const badge = buildFreeBadge('https://cdn.shopify.com/badge.png');
    expect(badge.textContent).toBe('');
  });

  it('renders "Free" text when badge URL is null', () => {
    const badge = buildFreeBadge(null);
    expect(badge.querySelector('img')).toBeNull();
    expect(badge.textContent).toBe('Free');
  });

  it('sets className "fpb-free-badge" on the badge span', () => {
    expect(buildFreeBadge(null).className).toBe('fpb-free-badge');
    expect(buildFreeBadge('https://cdn.shopify.com/badge.png').className).toBe('fpb-free-badge');
  });

  it('sets alt text "Free gift" on the image', () => {
    const badge = buildFreeBadge('https://cdn.shopify.com/badge.png');
    expect(badge.querySelector('img')!.alt).toBe('Free gift');
  });
});
