---
title: Storefront Parity Placement Board
type: operations
last_audited: 2026-07-11
---

# Storefront Parity Placement Board

Use a placement board when storefront parity depends on where a widget is mounted, not only on the default theme position. This is especially useful for EB-to-WPB Product Page Bundle Product List parity, where the same `PDP_INPAGE + CASCADE` widget can be constrained by product-info columns, mobile product forms, sidebars, or wider product sections.

The board is a temporary Chrome DevTools MCP probe. It must not be committed to theme files and must not mutate merchant themes. It clones the already-hydrated live widget DOM into controlled proof containers, then records screenshots and layout metrics under `/private/tmp`.

## PPB product-form ownership constraint

Live Theme Editor evidence on 2026-07-13 confirms that Product Page Bundle
placement remains owned by the native Buy buttons/product-form footprint. Even
when Shopify inserts the Bundle Builder block into a real standalone Apps section
through `target=newAppsSection`, WPB relocates that root into the product form and
marks it `bundle-widget-container--product-form-mounted`. This matches the current
EB placement reference.

Therefore, a full-width standalone Apps section is not an applicable final PPB
placement unless the product-form ownership contract changes. For real wide-host
proof, use an actual theme layout control that widens the product-information
column. Horizon's saved Equal columns setting produced a `520.5px` live widget
mount at an 1180px desktop viewport; restore the theme setting immediately after
capture. Synthetic placement boards remain supplemental only when a task
explicitly requires real mounted-location proof.

## When To Use

- A widget must stay responsive across different merchant theme placements.
- A visual bug appears only in a narrow column, full-width section, card, sidebar, or mobile product form.
- Old evidence contains one-store pixel measurements and needs to be translated into responsive CSS.
- A parity row needs proof that no horizontal overflow exists at multiple placement widths.

For PPB Product List parity, use this alongside `docs/competitor-analysis/ppb-product-list-agentic-parity/SPEC.md`, especially `PLS7-placement-responsive`.

## Guardrails

- Do not edit Shopify theme files to run the board.
- Do not deploy or restart the dev server just for placement probing.
- Do not commit screenshots or `/private/tmp` artifacts.
- Capture EB and WPB with the same case IDs and comparable desktop/mobile viewports.
- Verify the served widget version before trusting WPB proof, for example `window.__BUNDLE_WIDGET_VERSION__`.
- If the live preview still serves an older Shopify extension asset, record that as a proof blocker instead of claiming the patch is verified.

## Recommended Cases

Use these case IDs unless the parity row needs something more specific:

| Case ID | Purpose |
|---|---|
| `narrow-card-280` | Constrained card or sidebar width. |
| `product-column-360` | Narrow product-info column. |
| `desktop-column-480` | Normal desktop product-info column. |
| `wide-section-720` | Wider product section on desktop. |
| `mobile-fluid` | Mobile product column clamped to visual viewport. |
| `wide-section-clamped` | Wide section that must clamp to mobile viewport. |

Desktop proof should use a `1280x900` or wider viewport. Mobile proof should use `390x844` with mobile/touch emulation.

## Evidence To Capture

For each EB and WPB run:

- `*-placement-board.json` with case metrics.
- `*-placement-board.png` with the visual board.
- A short `delta.md` in the row evidence folder.

At minimum, the JSON should record:

- viewport width/height and device pixel ratio.
- widget version for WPB.
- container width, widget width, and `scrollWidth > clientWidth` overflow checks.
- row, footer, selected drawer, and action-button widths.
- stateful details for the row under test, such as selected count or drawer-open state.

## Probe Pattern

Run this pattern from Chrome DevTools MCP `evaluate_script` on the live storefront page after cache-bypass reload. Selectors must match the app under test.

```js
async () => {
  const root = document.querySelector('#bundle-builder-app');
  if (!root) return { error: 'WPB root not found' };

  document.querySelector('#ppb-placement-board')?.remove();

  const board = document.createElement('section');
  board.id = 'ppb-placement-board';
  board.style.cssText = [
    'box-sizing:border-box',
    'margin:24px auto',
    'padding:16px',
    'max-width:1180px',
    'display:grid',
    'grid-template-columns:repeat(2,minmax(0,1fr))',
    'gap:18px',
    'position:relative',
    'z-index:999999',
  ].join(';');

  const cases = [
    { id: 'narrow-card-280', label: 'Constrained card/sidebar 280px', width: '280px' },
    { id: 'product-column-360', label: 'Narrow product column 360px', width: '360px' },
    { id: 'desktop-column-480', label: 'Desktop product column 480px', width: '480px' },
    { id: 'wide-section-720', label: 'Wide full section 720px', width: '720px' },
  ];

  for (const item of cases) {
    const card = document.createElement('article');
    card.dataset.caseId = item.id;
    card.style.cssText = `box-sizing:border-box;width:${item.width};max-width:100%;padding:10px;overflow:visible`;

    const label = document.createElement('div');
    label.textContent = item.label;

    const clone = root.cloneNode(true);
    clone.dataset.placementClone = item.id;
    clone.style.maxWidth = '100%';

    card.append(label, clone);
    board.appendChild(card);
  }

  document.body.prepend(board);
  window.scrollTo(0, 0);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const measureNode = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      width: Math.round(r.width),
      height: Math.round(r.height),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX: el.scrollWidth > el.clientWidth + 1,
    };
  };

  return {
    version: window.__BUNDLE_WIDGET_VERSION__ || null,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    results: Array.from(board.querySelectorAll('article')).map((card) => ({
      caseId: card.dataset.caseId,
      card: measureNode(card),
      clone: measureNode(card.querySelector('[data-placement-clone]')),
      stepGrid: measureNode(card.querySelector('.bw-ppb-cascade-product-list')),
      footer: measureNode(card.querySelector('.bw-ppb-cascade-footer')),
      selectedDrawer: measureNode(card.querySelector('.bw-ppb-cascade-selected-drawer')),
      rows: Array.from(card.querySelectorAll('.bw-ppb-cascade-product-row')).slice(0, 3).map((row) => ({
        row: measureNode(row),
        media: measureNode(row.querySelector('.bw-product-card__media')),
        body: measureNode(row.querySelector('.bw-product-card__body')),
        action: measureNode(row.querySelector('.bw-product-card__action, .bw-product-card__add-button, .quantity-controls')),
      })),
    })),
  };
}
```

For mobile, clamp the proof board to the visual viewport. Do not let the harness itself create horizontal overflow.

```js
board.style.cssText = [
  'box-sizing:border-box',
  'margin:12px auto',
  'padding:10px',
  'width:calc(100vw - 16px)',
  'max-width:390px',
  'display:grid',
  'grid-template-columns:1fr',
  'gap:14px',
  'overflow:hidden',
].join(';');

const widthCss = item.width === '100%'
  ? '100%'
  : `min(${item.width}, calc(100vw - 42px))`;
```

## Known Gotchas

- Cloned DOM is for layout proof only. Do not use cloned widgets to prove event handlers, cart submission, or network behavior.
- If proving interaction state, first drive the real live widget, then clone the resulting hydrated DOM for placement metrics.
- A board that is wider than the mobile visual viewport invalidates mobile overflow results. Re-run with the clamped mobile harness.
- Shopify dev extension CDN can continue serving the previous widget version after local rebuild. Always record the served version in the WPB proof JSON.
- Placement board proof does not replace row-specific EB/WPB interaction proof. Use it as an additional responsiveness check.
