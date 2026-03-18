# SDE Implementation Plan: Free Gift Badge — DCP Asset Picker

## Overview
Replace the `freeGiftBadgeUrl` text field with a FilePicker, add sidebar nav entry, and add image badge rendering to the full-page widget. No DB or type changes needed.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/assets/bundle-widget-full-page-free-badge.test.ts` | `_getFreeGiftBadgeUrl()` returns URL when CSS var set; returns null when `none`; badge renders `<img>` when URL set; badge renders text when URL empty | Pending |

---

## Phase 1: Full-page widget — image badge (TDD)

**Tests (Red):**
Write `tests/unit/assets/bundle-widget-full-page-free-badge.test.ts`:
- `_getFreeGiftBadgeUrl()` returns the URL string when `--bundle-free-gift-badge-url` is `url("https://cdn.shopify.com/badge.png")`
- `_getFreeGiftBadgeUrl()` returns `null` when CSS var is `none`
- `_getFreeGiftBadgeUrl()` returns `null` when CSS var is empty string
- When `_getFreeGiftBadgeUrl()` returns a URL, the badge `<span>` contains an `<img>` not a text node
- When `_getFreeGiftBadgeUrl()` returns null, the badge `<span>` contains `textContent === 'Free'`

**Implementation (Green):**
In `app/assets/bundle-widget-full-page.js` at line ~1888 (inside the `if (currentStepData?.isFreeGift)` block):

1. Add static helper `_getFreeGiftBadgeUrl()`:
```js
static _getFreeGiftBadgeUrl() {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-free-gift-badge-url')
    .trim();
  if (!val || val === 'none') return null;
  // Strip url("...") wrapper
  const match = val.match(/^url\(['"]?(.*?)['"]?\)$/);
  return match ? match[1] : null;
}
```

2. Replace badge text assignment with conditional image/text:
```js
const badgeImgUrl = BundleWidgetFullPage._getFreeGiftBadgeUrl();
if (badgeImgUrl) {
  const img = document.createElement('img');
  img.src = badgeImgUrl;
  img.alt = 'Free gift';
  img.className = 'fpb-free-badge-img';
  badge.appendChild(img);
} else {
  badge.textContent = 'Free';
}
```

**CSS (no tests needed):**
In `extensions/bundle-builder/assets/bundle-widget-full-page.css`, after `.fpb-free-badge` rule:
```css
.fpb-free-badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
```

**Refactor:** Confirm `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css` is under 100,000 B.

**Run tests:** `npm test -- --testPathPattern=bundle-widget-full-page-free-badge`

---

## Phase 2: DCP UI — FilePicker + sidebar nav (no tests — Polaris UI)

**Step 2.1: Add "Widget Style" to NavigationSidebar**
In `NavigationSidebar.tsx`, inside the General `<Collapsible>` block (after "Accessibility"), add:
```tsx
<NavigationItem
  label="Widget Style"
  sectionKey="widgetStyle"
  isChild
  onClick={() => onSubSectionClick("widgetStyle")}
  isActive={activeSubSection === "widgetStyle"}
/>
```

**Step 2.2: Replace TextField with FilePicker in WidgetStyleSettings**
In `WidgetStyleSettings.tsx`:
1. Import `FilePicker` from `"./FilePicker"`
2. Remove the existing `<TextField>` for `freeGiftBadgeUrl` (currently inside `{isBottomSheet && ...}`)
3. Add a new section at the bottom of the component, **outside** any conditional block:
```tsx
<>
  <Divider />
  <Text as="h3" variant="headingMd">Free Gift Badge</Text>
  <Text as="p" variant="bodySm" tone="subdued">
    Shown on locked gift-step slot cards. Leave blank to use the built-in ribbon.
  </Text>
  <FilePicker
    value={settings.freeGiftBadgeUrl ?? ""}
    onChange={(url) => onUpdate("freeGiftBadgeUrl", url)}
    label="Free Gift Badge"
    hideCropEditor
  />
</>
```

---

## Phase 3: Widget rebuild + version bump

1. In `scripts/build-widget-bundles.js`, bump `WIDGET_VERSION`:
   - e.g. `'2.0.0'` → `'2.1.0'` (MINOR: new storefront feature)
2. Run `npm run build:widgets`
3. Verify: `wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css` < 100,000 B
4. Run `npx tsc --noEmit` — confirm 0 errors

---

## Phase 4: Issue file + commit

Create `docs/issues-prod/free-gift-badge-dcp-1.md` and commit:
```
[free-gift-badge-dcp-1] feat: Free gift badge image picker via DCP store assets
```

---

## Build & Verification Checklist
- [ ] New test file written and passing
- [ ] No regressions in existing tests (`npm test`)
- [ ] TypeScript compiles without new errors
- [ ] Widget rebuilt (v2.1.0), full-page bundle at `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- [ ] CSS file under 100,000 B
- [ ] "Widget Style" visible in DCP sidebar for both product-page and full-page modals
- [ ] Badge picker visible in all widget style modes (not gated behind bottom-sheet)
- [ ] Selecting a store file sets the thumbnail preview in the DCP
- [ ] Saving DCP persists URL to DB
- [ ] Full-page widget renders `<img>` badge on gift steps when URL set
- [ ] Full-page widget renders "Free" text when URL not set (regression check)
- [ ] Product-page widget unchanged (CSS variable already consumed)

## Rollback Notes
- Revert `bundle-widget-full-page.js` line ~1888 to `badge.textContent = 'Free'`
- Revert `WidgetStyleSettings.tsx` to `<TextField>` if needed
- Remove nav item from `NavigationSidebar.tsx`
- Redeploy with previous WIDGET_VERSION
