# PG11 Keyboard and visibility behavior evidence

## Environment
- URL: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test?horizontal-smoke=168`
- Store: `agent-5sfidg3m.myshopify.com`
- Widget data root: `#bundle-builder-app`
- Evidence session date: 2026-07-13

## Desktop evidence (Product Grid in-page shell -> PDP_MODAL/MODAL path)

1. Initial state (desktop viewport)
   - `ppbTemplateType=PDP_MODAL`, `ppbDesignPreset=MODAL`, `ppbSlotOrientation=horizontal`.
   - Modal shell exists: `div.bw-bs-panel`, `dialog` container present.
   - Panel closed baseline: `panel.hidden=true`, `panelHeight=0`, `overlay.opacity=0`, `bodyOverflow=visible`.

2. Open path
   - Clicked a step slot (`.bw-slot-card`) in the visible step list.
   - Result: panel opened with `panel.hidden=false`, `panelHeight=880`, `overlay.opacity=1`, `overlay.pointerEvents=auto`, `bodyOverflow=hidden`.
   - Dialog content included: `Step 1`, `Step 2`, category tabs, product cards, `Previous step`, `Next step`, and `Close` button.

3. Keyboard traversal
   - Focus moved from body to `Step 1` then `Step 2` with `Tab`.
   - Enter/click close action was available from open state (button `Close`).

4. Close path
   - `Enter` on dialog close/`Escape` key closed modal.
   - Verified after close: `panel.hidden=true`, `panelHeight=0`, `overlay.opacity=0`, `bodyOverflow=visible`, focus returned to page context.

## Mobile emulation evidence (Product Grid in-page fallback path)

1. Same URL with viewport emulation `390x844x2,mobile,touch`.
   - Widget switched to mobile runtime (`ppbTemplateType=PDP_INPAGE`, `ppbDesignPreset=COGNIVE`, panel not displayed for modal overlay mode).
   - Baseline body: `bodyOverflow=visible`, `overlay.opacity=0`, no visible modal sheet.

2. Core controls and focus
   - Clicking `1 Step 1` kept in-page mode (panel remained hidden, `panelHeight=0`).
   - Keyboard `Tab` traversal reached `Category 2Long Label Empty Category` and then in-page controls (`Next`, `View Bundle Items`).
   - `View Bundle Items` and `Next` were reachable and remained focusable in this mode.

## Outcome
- For Product Grid (`PG`) this supports `Q05` as proven for core keyboard access and close-path behavior in desktop modal mode plus mobile in-page fallback mode.
