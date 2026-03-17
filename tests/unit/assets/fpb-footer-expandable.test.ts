/**
 * Unit Tests: Beco-style Expandable Footer for Full-Page Bundles
 *
 * Tests the pure helper logic extracted from renderFullPageFooter():
 *  - shouldShowFooter()       — visibility gating
 *  - buildThumbnailStripData() — thumbnail strip + overflow badge
 *  - getToggleText()          — "X/Y Products" label
 *  - getDiscountBadgePct()    — discount % calculation
 *  - shouldShowCallout()      — deal callout visibility
 *  - shouldShowBackBtn()      — back button visibility
 *  - isFooterSideLayout()     — layout guard
 *
 * DOM-toggle behaviour is tested via a minimal fake-DOM stub.
 */

// ============================================================
// Pure helpers — mirror what will be in bundle-widget-full-page.js
// ============================================================

interface SelectedProduct {
  productId: string;
  variantId?: string;
  quantity?: number;
  image?: string;
  title?: string;
  price?: number;
}

interface DiscountInfo {
  hasDiscount: boolean;
  finalPrice: number;
}

/**
 * Determines whether the sticky footer should be shown.
 * Hidden when: no products selected, or sidebar layout is active.
 */
function shouldShowFooter(
  selectedProducts: SelectedProduct[],
  layout: string
): boolean {
  if (layout === 'footer_side') return false;
  return selectedProducts.length > 0;
}

/**
 * Returns data for the thumbnail strip.
 * Shows up to maxVisible images + overflow count for extras.
 */
function buildThumbnailStripData(
  products: SelectedProduct[],
  maxVisible = 3
): { visibleImages: { src: string; alt: string }[]; overflow: number } {
  const visibleImages = products.slice(0, maxVisible).map(p => ({
    src: p.image || '',
    alt: p.title || '',
  }));
  const overflow = Math.max(0, products.length - maxVisible);
  return { visibleImages, overflow };
}

/**
 * Returns the "X/Y Products" toggle button label.
 */
function getToggleText(selectedCount: number, requiredCount: number): string {
  return `${selectedCount}/${requiredCount} Products`;
}

/**
 * Returns the discount percentage (0–100) or null when no discount applies.
 */
function getDiscountBadgePct(
  hasDiscount: boolean,
  totalPrice: number,
  finalPrice: number
): number | null {
  if (!hasDiscount || totalPrice <= 0 || finalPrice >= totalPrice) return null;
  const pct = Math.round((1 - finalPrice / totalPrice) * 100);
  return pct > 0 ? pct : null;
}

/**
 * Whether the green deal-callout banner should be shown in the expanded panel.
 */
function shouldShowCallout(discountInfo: DiscountInfo): boolean {
  return discountInfo.hasDiscount;
}

/**
 * Whether the Back button should be rendered (hidden on first step).
 */
function shouldShowBackBtn(currentStepIndex: number): boolean {
  return currentStepIndex > 0;
}

/**
 * Guard: returns true when the sidebar layout is active (footer_side).
 */
function isFooterSideLayout(layout: string): boolean {
  return layout === 'footer_side';
}

// ============================================================
// Minimal fake-DOM for toggle tests
// ============================================================

class FakeElement {
  classList: { classes: Set<string>; add(c: string): void; remove(c: string): void; toggle(c: string): void; contains(c: string): boolean };
  style: Record<string, string> = {};

  constructor() {
    const classes = new Set<string>();
    this.classList = {
      classes,
      add(c: string) { classes.add(c); },
      remove(c: string) { classes.delete(c); },
      toggle(c: string) { classes.has(c) ? classes.delete(c) : classes.add(c); },
      contains(c: string) { return classes.has(c); },
    };
  }
}

/**
 * Simulates the toggleFooterPanel() behaviour from the widget:
 * toggles the 'is-open' class on the footer element.
 */
function toggleFooterPanel(footerEl: FakeElement): void {
  footerEl.classList.toggle('is-open');
}

// ============================================================
// Tests
// ============================================================

describe('Beco-style expandable footer — pure helpers', () => {

  // ——————————————————————————————————————————
  // 1. shouldShowFooter
  // ——————————————————————————————————————————

  describe('shouldShowFooter()', () => {
    it('hides footer when no products selected', () => {
      expect(shouldShowFooter([], 'footer_bottom')).toBe(false);
    });

    it('shows footer when at least 1 product selected', () => {
      const products: SelectedProduct[] = [{ productId: 'p1', image: 'img.jpg', title: 'P1' }];
      expect(shouldShowFooter(products, 'footer_bottom')).toBe(true);
    });

    it('hides footer when layout is footer_side regardless of selection', () => {
      const products: SelectedProduct[] = [{ productId: 'p1' }];
      expect(shouldShowFooter(products, 'footer_side')).toBe(false);
    });
  });

  // ——————————————————————————————————————————
  // 2. buildThumbnailStripData
  // ——————————————————————————————————————————

  describe('buildThumbnailStripData()', () => {
    it('returns up to 3 images with no overflow when ≤ 3 products', () => {
      const products: SelectedProduct[] = [
        { productId: 'p1', image: 'a.jpg', title: 'A' },
        { productId: 'p2', image: 'b.jpg', title: 'B' },
      ];
      const { visibleImages, overflow } = buildThumbnailStripData(products);
      expect(visibleImages).toHaveLength(2);
      expect(overflow).toBe(0);
    });

    it('caps at 3 images and counts overflow correctly for 5 products', () => {
      const products: SelectedProduct[] = Array.from({ length: 5 }, (_, i) => ({
        productId: `p${i}`,
        image: `img${i}.jpg`,
        title: `P${i}`,
      }));
      const { visibleImages, overflow } = buildThumbnailStripData(products);
      expect(visibleImages).toHaveLength(3);
      expect(overflow).toBe(2);
    });

    it('uses empty string for missing image/title', () => {
      const products: SelectedProduct[] = [{ productId: 'p1' }];
      const { visibleImages } = buildThumbnailStripData(products);
      expect(visibleImages[0].src).toBe('');
      expect(visibleImages[0].alt).toBe('');
    });

    it('respects custom maxVisible parameter', () => {
      const products: SelectedProduct[] = Array.from({ length: 6 }, (_, i) => ({
        productId: `p${i}`,
      }));
      const { visibleImages, overflow } = buildThumbnailStripData(products, 5);
      expect(visibleImages).toHaveLength(5);
      expect(overflow).toBe(1);
    });
  });

  // ——————————————————————————————————————————
  // 3. getToggleText
  // ——————————————————————————————————————————

  describe('getToggleText()', () => {
    it('returns "X/Y Products" with correct counts', () => {
      expect(getToggleText(2, 3)).toBe('2/3 Products');
    });

    it('returns "0/0 Products" for zero counts', () => {
      expect(getToggleText(0, 0)).toBe('0/0 Products');
    });
  });

  // ——————————————————————————————————————————
  // 4. getDiscountBadgePct
  // ——————————————————————————————————————————

  describe('getDiscountBadgePct()', () => {
    it('returns percentage when discount applies', () => {
      const pct = getDiscountBadgePct(true, 10000, 6500); // 35% off
      expect(pct).toBe(35);
    });

    it('returns null when hasDiscount is false', () => {
      expect(getDiscountBadgePct(false, 10000, 8000)).toBeNull();
    });

    it('returns null when totalPrice is 0', () => {
      expect(getDiscountBadgePct(true, 0, 0)).toBeNull();
    });

    it('returns null when finalPrice equals totalPrice (no savings)', () => {
      expect(getDiscountBadgePct(true, 5000, 5000)).toBeNull();
    });

    it('rounds to nearest integer', () => {
      // 1/3 discount → 33.33% → 33
      const pct = getDiscountBadgePct(true, 3000, 2000);
      expect(pct).toBe(33);
    });
  });

  // ——————————————————————————————————————————
  // 5. shouldShowCallout
  // ——————————————————————————————————————————

  describe('shouldShowCallout()', () => {
    it('shows callout when discount is active', () => {
      expect(shouldShowCallout({ hasDiscount: true, finalPrice: 499 })).toBe(true);
    });

    it('hides callout when no discount', () => {
      expect(shouldShowCallout({ hasDiscount: false, finalPrice: 0 })).toBe(false);
    });
  });

  // ——————————————————————————————————————————
  // 6. shouldShowBackBtn
  // ——————————————————————————————————————————

  describe('shouldShowBackBtn()', () => {
    it('hides back button on step 0', () => {
      expect(shouldShowBackBtn(0)).toBe(false);
    });

    it('shows back button on step 1+', () => {
      expect(shouldShowBackBtn(1)).toBe(true);
      expect(shouldShowBackBtn(3)).toBe(true);
    });
  });

  // ——————————————————————————————————————————
  // 7. isFooterSideLayout
  // ——————————————————————————————————————————

  describe('isFooterSideLayout()', () => {
    it('returns true for footer_side', () => {
      expect(isFooterSideLayout('footer_side')).toBe(true);
    });

    it('returns false for footer_bottom', () => {
      expect(isFooterSideLayout('footer_bottom')).toBe(false);
    });
  });

  // ——————————————————————————————————————————
  // 8. toggleFooterPanel — DOM toggle behaviour
  // ——————————————————————————————————————————

  describe('toggleFooterPanel()', () => {
    it('adds is-open class on first call', () => {
      const el = new FakeElement();
      toggleFooterPanel(el);
      expect(el.classList.contains('is-open')).toBe(true);
    });

    it('removes is-open class on second call (toggle off)', () => {
      const el = new FakeElement();
      toggleFooterPanel(el);
      toggleFooterPanel(el);
      expect(el.classList.contains('is-open')).toBe(false);
    });
  });
});
