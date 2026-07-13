Complete storefront parity between Easy Bundles and Wolfpack for the remaining Product Page Bundle templates:

**Status:** Reopened on 2026-07-13 for feature-to-storefront reconciliation.
The prior completion covered the scoped template visual/interaction rows, but it
did not prove every PPB feature and configuration mode across the templates.

The canonical coverage ledger is
`docs/competitor-analysis/ppb-feature-to-storefront-matrix.md`. A template is not
100% complete until every applicable matrix cell is Proven, an evidence-backed
EB-absent state, an accepted divergence, or Not applicable.

**2026-07-13 matrix reconciliation update:** row S08 exposed a shared selected-
state reload gap. EB restores offer-scoped selections from `sessionStorage`,
while WPB widget `5.0.169` reset them. Shared widget `5.0.171` now persists and
restores PPB selections after configured defaults. Vertical Slots is Proven on
desktop/mobile hard reload; the other three template cells remain Shared until
their own replays. Earlier Product List and Horizontal Proven cells were
downgraded because their cited evidence covered collection reload and
slot-capacity reset, not selected-state reload.

**Scoped template-lane result:** Horizontal Slots was re-accepted on dev widget `5.0.166`
after the HS19 modal-card/toast pass. Product Grid was re-accepted on the
hot-reloaded dev widget `5.0.167` after PG08 corrected the accordion flow,
complete card presentation, selected action, and validation toast. Vertical
Slots was re-accepted on hot-reloaded dev widget `5.0.168` after VS04 corrected
the mobile modal header, body-owned validation toast, and filled-row control
order. The three requested template lanes are accepted; final cross-template
regression is complete on the hot-reloaded dev environment.

1. Horizontal Slots
2. Product Grid
3. Vertical Slots

Work iteratively, completing and committing one template before beginning the next. Treat each template as an independent parity lane with its own fixture, evidence, gap ledger, implementation, verification, and completion audit.

## Environments

Wolfpack implementation:
- Store: agent-5sfidg3m.myshopify.com
- App: Wolfpack Product Bundles SIT
- Admin bundle:
  https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/bundles/product-page-bundle/configure/cmrf19c8d0000v0xpj8rz2wgh
- Storefront starting fixture:
  https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test
- Refer to this environment as WPB or agent.

Easy Bundles reference:
- Store: yash-wolfpack.myshopify.com
- App: EB / Easy Bundle Builder
- Admin starting point:
  https://admin.shopify.com/store/yash-wolfpack/apps/gift-box-builder-1
- Known storefront starting point:
  https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11
- Confirm the correct EB PPB bundle and parent product through EB Admin before trusting a storefront URL.
- Refer to this environment as EB or yash-wolfpack.

EB is the behavioral and visual source of truth. Existing WPB code, old screenshots, prior measurements, and historical parity documents are supporting context only.

## Template Contracts

Verify these contracts in Admin configuration, persisted bundle data, storefront runtime attributes, stylesheet selection, and rendered behavior:

- Horizontal Slots:
  - `bundleDesignTemplate = "PDP_MODAL"`
  - preset/template ID = `"MODAL"`
  - runtime slot orientation = `"horizontal"`

- Product Grid:
  - `bundleDesignTemplate = "PDP_INPAGE"`
  - preset/template ID = `"COGNIVE"`

- Vertical Slots:
  - `bundleDesignTemplate = "PDP_MODAL"`
  - preset/template ID = `"SIMPLIFIED"`
  - runtime slot orientation = `"vertical"`

Do not infer the active template from appearance alone.

## Mandatory Browser Tool

Use direct Chrome DevTools MCP functions for all browser evidence and browser interaction.

**Direct means direct:** invoke the `mcp__chrome_devtools__*` tools themselves for
every browser action. Do not load or use the `chrome:control-chrome` skill, the
`browser:control-in-app-browser` skill, or any plugin-provided browser abstraction.

**Tooling constraint:** Call the Chrome DevTools MCP tools directly. Do not use the
Chrome plugin, Browser plugin, browser-control skill, browser extension bridge,
`browser-client`, Node REPL browser runtime, or any wrapper around Chrome DevTools
MCP. If direct Chrome DevTools MCP is unavailable, stop and report that exact
blocker; do not attempt to connect through another browser surface.

Required functions include:
- `list_pages`
- `select_page`
- `take_snapshot`
- `take_screenshot`
- `evaluate_script`
- `click`
- `fill` / `fill_form`
- `emulate`
- `navigate_page`
- `wait_for`
- network and console inspection functions where needed

Do not use Playwright, Chrome/Browser plugin wrappers, browser extensions, shell
HTTP requests, screenshots supplied by old docs, or code inspection as substitutes
for live browser proof.

Screenshots may be saved under `/private/tmp` for investigation but must never be committed.

## Repository References

Read these before implementation:
1. `internal docs/EB Implementation Reference.md`
2. `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
3. `product-card-parity-agentic-loop-plan.md`
4. `docs/competitor-analysis/ppb-product-list-agentic-parity/SPEC.md`
5. Relevant historical template parity files under `docs/issues-prod/`
6. Relevant existing test specs under `test-spec/`

Historical files are not proof of current parity. Revalidate behavior against the live EB storefront.

Before implementing any EB feature, open every relevant “How to setup?”, “Learn More”, and help link visible in EB Admin. Record newly discovered durable behavior in the EB implementation reference.

## Required Execution Order

Complete templates in this order:

1. Horizontal Slots
2. Product Grid
3. Vertical Slots

For each template:

1. Establish the EB fixture.
2. Capture EB desktop and mobile behavior.
3. Establish an equivalent WPB fixture.
4. Capture WPB behavior.
5. Write the exact delta before editing code.
6. Implement the smallest source-level correction.
7. Build and validate generated assets.
8. Repeat the identical EB/WPB interaction matrix.
9. Smoke previously completed templates if shared code changed.
10. Commit the completed slice.
11. Update the template status ledger.
12. Only then continue to the next template.

Do not mix fixes for multiple templates into one exploratory implementation commit.

## Fixture Matrix

This fixture list is the original visual/interaction baseline. It does not
replace the canonical feature-to-storefront matrix. When the two differ, the
feature matrix defines the remaining parity work.

Configure equivalent realistic fixtures in EB and WPB. Do this through the authenticated Admin UI using Chrome DevTools MCP.

The fixture set must include:

- Single step and multiple steps
- Single category and multiple categories
- Long step/category labels
- Manual products
- Collection-backed products
- Normal in-stock product
- Sold-out or unavailable product
- Product with one variant
- Product with multiple variants
- Product with only one sellable surviving variant
- Long product title
- Sale price plus compare-at price
- Square, tall, and wide product images
- Missing-image fallback where available
- Percentage discount progression
- No-discount state
- Under-target, exact-target, and over-target selection states
- Empty selection
- One selected item
- Multiple selected items
- Enough selected products to trigger wrapping, scrolling, or maximum-height behavior

Inventory differences between stores must be documented. Do not “fix” UI based on mismatched product availability.

Prefer dedicated fixtures per template. If the same fixture must be reused, record its original configuration and restore it after every template lane.

## Viewports And Placement Matrix

At minimum, capture:

- Desktop: 1280 x 800
- Large desktop: 1440 x 900
- Tablet: 768 x 1024
- Mobile: 390 x 844
- Narrow mobile: 360 x 800

Test these placement widths where applicable:

- Default theme product-information column
- 300px constrained placement
- 360px placement
- Approximately 520px wider placement
- Full-width or section placement where the theme permits it

Use actual placement changes through the theme/editor when required. In-browser host-width probes may supplement placement evidence but must not replace proof of the real mounted location.

Confirm:
- no horizontal overflow;
- no incoherent clipping;
- no text/action overlap;
- no unexpected layout shift;
- controls remain reachable;
- title/content columns absorb available width correctly;
- slot/grid/card dimensions respond to the host rather than one store’s captured pixels.

## Shared Storefront Scope

For every template, audit:

- Loading state location
- Widget placement relative to the native product form
- Initial empty state
- Step labels and step navigation
- Category labels and category switching
- Product image rendering
- Product title wrapping
- Price and compare-at-price rendering
- Variant identity and selection
- Available and unavailable product behavior
- Add/select controls
- Selected state
- Quantity or removal behavior where supported
- Discount progression and success messaging
- Final Add Bundle to Cart state
- Dynamic checkout control where present
- Validation toasts and blocked states
- State persistence across step/category changes
- Cart line behavior and bundle metadata
- Reload and first-load behavior
- Desktop and mobile scrolling
- Keyboard/focus behavior for modal and interactive controls
- Theme typography leakage or selector conflicts
- Runtime template attributes and active stylesheet
- Console errors and failed app-owned requests

Do not invent Product List behavior in slot or grid templates when EB uses a different interaction model.

## Horizontal Slots Scope

Audit all of the following:

- Horizontal orientation contract
- Empty slot count
- Slot width, height, gap, border, radius, and placeholder
- Slot label and remaining-count text
- Slot wrapping versus horizontal scrolling
- Empty, partially filled, and fully filled states
- Clicking an empty slot
- Product picker opening animation and placement
- Product picker header, step tabs, category controls, close action, and footer
- Product cards inside the picker
- Product selection
- Variant selection inside the picker
- Returning the selected product to the correct slot
- Slot order
- Replacing a selected product
- Removing a selected product
- Advancing between steps
- Selection persistence when the modal closes/reopens
- Backdrop, body-scroll locking, focus handling, and Escape/close behavior
- CTA disabled/enabled state
- Discount and total display
- Responsive slot behavior on desktop and mobile
- Modal overflow and internal scrolling
- No leakage from Vertical Slots, Product Grid, or Product List CSS

## Product Grid Scope

Audit all of the following:

- `PDP_INPAGE + COGNIVE` runtime contract
- Responsive column count and card width
- Grid gap and outer padding
- Square image behavior and media fallback
- Product title height and wrapping
- Price and compare-at-price hierarchy
- Variant selector placement and responsive width
- Add button geometry
- Selected quantity state
- Increment/decrement and removal behavior
- Disabled or unavailable state
- Category switching
- Multi-step rendering and navigation
- Selected-items drawer/footer if EB exposes it
- Empty, one-item, multi-item, and overflow selected states
- Discount progression and CTA content
- Loading shell position
- Grid wrapping without horizontal overflow
- Narrow and wide product-information placements
- No leakage from Product List Cascade row styles
- No leakage from modal slot templates

Pay particular attention to whether EB keeps three columns, changes column count, or changes card width at each measured container width. Measure rather than assume.

## Vertical Slots Scope

Audit all of the following:

- Vertical orientation contract
- Empty vertical row count
- Row height, width, border, radius, spacing, and alignment
- Placeholder/media placement
- Text block placement
- Remaining-count text
- Empty, partially filled, and fully filled states
- Product picker opening from a vertical slot
- Product picker structure and internal product cards
- Product and variant selection
- Correct return to the clicked row
- Slot/row order
- Replace and remove behavior
- Multi-step progression and persistence
- Modal close, backdrop, focus, Escape, and body-scroll behavior
- CTA disabled/enabled state
- Discount and total display
- Desktop/mobile row wrapping and overflow
- No leakage from Horizontal Slots, Product Grid, or Product List CSS

Do not assume Vertical Slots is merely Horizontal Slots with `flex-direction: column`. Compare every structural and behavioral state against EB.

## Evidence Requirements

For every tested state:

1. Inspect EB first.
2. Hard reload with cache bypass.
3. Clear Cache Storage where appropriate.
4. Capture an accessibility snapshot.
5. Capture computed styles and bounding boxes.
6. Record runtime template attributes.
7. Record interaction behavior.
8. Capture network or console evidence when behavior depends on data loading.
9. Repeat on WPB.
10. Write the exact delta before implementation.
11. Re-run the same state after implementation.

Evidence root:

- `/private/tmp/ppb-remaining-template-parity/horizontal-slots/<case-id>/`
- `/private/tmp/ppb-remaining-template-parity/product-grid/<case-id>/`
- `/private/tmp/ppb-remaining-template-parity/vertical-slots/<case-id>/`

Committed documentation root:

- `docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/`
- `docs/competitor-analysis/ppb-product-grid-agentic-parity/`
- `docs/competitor-analysis/ppb-vertical-slots-agentic-parity/`

Each template must have:
- `SPEC.md`
- fixture evidence
- per-state delta/evidence notes
- a current row-status table
- `COMPLETION-AUDIT.md`

Do not commit browser screenshots, snapshots, network dumps, or temporary JSON.

## Suggested Case Matrix

Use template-specific prefixes:

- Horizontal Slots: `HS00`, `HS01`, ...
- Product Grid: `PG00`, `PG01`, ...
- Vertical Slots: `VS00`, `VS01`, ...

Pairwise rows:

- `00-baseline`: basic in-stock products, no discount
- `01-step-category`: multi-step and multi-category behavior
- `02-product-cards`: title, image, price, compare-at price
- `03-variants`: grouped variants, individual variants, unavailable variants
- `04-inventory`: available, unavailable, sole surviving variant
- `05-selection`: empty, one, multiple, max/overflow
- `06-discount-footer`: no discount, progress, qualified
- `07-loading-reload`: first load, transition load, hard reload
- `08-cart`: blocked/successful add, cart properties, bundle metadata
- `09-responsive-placement`: desktop/mobile and constrained/wide hosts
- `10-unsupported`: EB-absent or template-specific options

Slot-template rows:

- `11-empty-slots`
- `12-partial-slots`
- `13-full-slots`
- `14-picker-open-close`
- `15-picker-selection`
- `16-replace-remove`
- `17-modal-scroll-focus`

Product Grid rows:

- `11-grid-columns`
- `12-card-selected-quantity`
- `13-grid-overflow`
- `14-selected-drawer`
- `15-category-grid-reflow`

Stress rows:

- Combined multi-step + variants + mixed inventory + discount
- Long titles + sale prices + mixed image ratios
- Maximum slot/card count
- Add/remove while modal or selected drawer is open
- Narrow mobile
- Wide host placement
- Repeated open/close or category/step transitions

## Implementation Rules

- Fix the source owner, never generated assets directly.
- Identify the current controlling declaration/function before editing.
- Prefer existing template modules and shared component APIs.
- Keep template-specific CSS scoped by runtime template and preset attributes.
- Shared changes require smoke verification of every completed PPB template.
- Do not add late-cascade override piles.
- Consolidate conflicting ownership instead of adding another selector.
- Avoid `!important`.
- Do not inject styling through JavaScript.
- Storefront visual styling belongs in raw CSS source files.
- Use content-driven responsive CSS: `%`, `fr`, `minmax()`, `clamp()`, intrinsic sizing, container/viewport constraints.
- Exact fixed measurements are acceptable only for genuine primitives such as icons, borders, control hit targets, or documented Shopify limits.
- Do not copy captured store-specific widths into global layout rules.
- Do not add compatibility shims for old data.
- Do not add unnecessary fallback chains.
- Do not introduce competitor names or prefixes in runtime code.
- Do not modify FPB behavior unless a shared-source regression is proven and the change is required.
- Do not broaden into Admin UI parity. Admin is fixture setup only unless serialization is proven incorrect.
- Do not rewrite Cart Transform logic unless live cart evidence proves a template-specific payload defect.

## Testing Rules

Use TDD for new behavior:
1. Create/update `test-spec/<feature>.spec.md`.
2. Write the behavior test first.
3. Confirm the test fails for the correct reason.
4. Implement.
5. Confirm it passes.
6. Refactor only within scope.

Do not create tests that:
- read CSS files and assert properties;
- grep source for class names;
- assert element order from source text;
- snapshot visual appearance;
- enforce pixel values or placement.

Visual parity must be proven with Chrome DevTools MCP.

Required checks after relevant changes:
- `node --check` for modified raw widget JS
- Focused Jest with `--selectProjects unit --runTestsByPath`
- ESLint on modified JS/TS files with `--max-warnings 9999`
- `npm run build:widgets`
- `npm run minify:assets css` for CSS changes
- `npm run graphify:rebuild`
- `git diff --check`
- Syntax checks on generated widget bundles
- Hard-reloaded storefront proof of the served widget version and active stylesheet

## Widget Build Rules

When widget source changes:

1. Bump `WIDGET_VERSION` in `scripts/build-widget-bundles.js`.
   - PATCH for fixes
   - MINOR for backward-compatible features
   - MAJOR for breaking redesigns
2. Run `npm run build:widgets`.
3. Run `npm run minify:assets css` when CSS changes.
4. Include raw sources and generated extension assets in the same commit.
5. Verify `window.__BUNDLE_WIDGET_VERSION__` in the live storefront after refresh.

Do not edit minified or bundled extension assets manually.

## Deployment And Environment Guardrails

- Never run `npm run dev`.
- Never restart the user-provided dev environment.
- Never run `shopify app deploy`.
- Never run `npm run deploy:sit` or `npm run deploy:prod`.
- Do not switch to the production Shopify app configuration.
- Do not deploy or restart merely to expose ordinary JS/CSS changes; use the existing SIT environment and refresh.
- Only request deployment or migration action when current evidence proves it is required.
- If a migration is required, stop and explain why before proceeding.
- Do not execute dangerous cleanup, migration, backfill, or production scripts.
- Do not edit production data.
- Do not use direct database writes to configure fixtures.
- Use authenticated Admin UI workflows through Chrome DevTools MCP.
- Preserve unrelated worktree changes.
- Never reset, revert, or overwrite user changes.
- Never leave the shared fixture on the wrong template after a smoke sequence.

## Commit Discipline

Commit after each small, independently verified slice.

Before every commit:
- run relevant focused tests;
- run lint on modified files;
- run required widget build/minification;
- run graphify after code changes;
- inspect staged diff;
- verify generated files;
- confirm no temporary Chrome evidence is staged.

Commit body must include:
- Impact
- Affected files/surfaces
- Tests and Chrome evidence used

Suggested progression per template:
1. Fixture/evidence documentation
2. Baseline shell/layout fix
3. Product-card or slot-state fix
4. Modal/selection behavior fix
5. Responsive/placement fix
6. Cart/loading fix if needed
7. Final audit and evidence closeout

## Completion Criteria Per Template

A template is complete only when:

- Every applicable cell in `ppb-feature-to-storefront-matrix.md` is resolved.
- Every applicable pairwise and stress row is accepted.
- EB was inspected first for every implemented state.
- WPB matches EB across desktop and mobile.
- Narrow/default/wide placement behavior is proven.
- Loading appears where the final widget renders.
- Selection, variants, inventory, discounts, validation, and cart behavior are proven.
- Slot templates have complete modal, replace/remove, focus, scrolling, and persistence proof.
- Product Grid has complete card, quantity, selected drawer/footer, reflow, and overflow proof.
- No other PPB template regressed.
- All required tests/builds/checks pass.
- The fixture is restored to the intended template.
- All completed slices are committed.
- `COMPLETION-AUDIT.md` proves every explicit requirement with current evidence.

## Overall Completion Criteria

The overall goal is complete only when all three templates independently satisfy their completion criteria and a final cross-template audit proves:

- Horizontal Slots is accepted.
- Product Grid is accepted.
- Vertical Slots is accepted.
- Product List remains accepted.
- Shared product picker/card/footer behavior has no cross-template leakage.
- All four PPB runtime mappings remain correct.
- All final focused tests and builds pass.
- No unresolved delta remains undocumented.
- No temporary evidence or screenshots are committed.
- The WPB fixture is left in a known documented state.
- Every completed slice has a focused commit.

Do not mark the goal complete merely because the current UI looks close. Completion requires row-by-row current evidence, interaction proof, responsive proof, regression smoke, clean verification, and a requirement-by-requirement completion audit.
