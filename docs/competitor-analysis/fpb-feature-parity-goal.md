---
schema_version: 1
id: fpb-feature-parity-goal
title: Full Page Bundle Comprehensive Feature Parity Goal Prompt
type: goal-prompt
status: active
summary: Defines the execution goal, boundaries, tools, and fixture-efficient workflow for closing the FPB feature matrix.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
  - competitor-analysis
systems:
  - full-page-bundle-widget
source_paths:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/fpb-standard-agentic-parity/SPEC.md
  - docs/competitor-analysis/fpb-classic-agentic-parity/SPEC.md
  - docs/competitor-analysis/fpb-compact-horizontal-agentic-parity/SPEC.md
tags:
  - fpb
  - parity
  - goal
keywords:
  - FPB goal prompt
  - feature matrix completion
  - fixture-efficient parity
---

# Full Page Bundle Comprehensive Feature Parity Goal Prompt

Use the following prompt as the goal for the execution run.

---

Complete evidence-backed storefront feature parity for all four Full Page
Bundle designs—Standard, Classic, Compact, and Horizontal—using Easy Bundles
as the shopper-behavior and presentation source of truth and Wolfpack Product
Bundles as the implementation target.

The canonical ledger and execution order are defined in:

`docs/competitor-analysis/fpb-feature-to-storefront-matrix.md`

Do not replace that matrix with a new checklist. Work through its fixture groups
`F0` through `F8`, update its cells as evidence is completed, and stop only when
every applicable template cell is terminal: `P`, `E`, `X`, or `N/A`. No `S` or
`T` cells may remain at completion.

## Environments and Canonical Fixtures

- EB Admin/storefront: authenticated `yash-wolfpack` store.
- EB FPB storefront baseline:
  `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/1`
- WPB Admin: Wolfpack Bundles SIT embedded in the authenticated `agent` store.
- WPB FPB bundle: `cmr361mz50000v00yrdeyxpf7` on
  `agent-5sfidg3m.myshopify.com`.
- WPB storefront proof must use the active Shopify development-extension/dev
  preview supplied by the user.
- Starting WPB evidence version is `5.0.190`; always record the actually served
  `window.__BUNDLE_WIDGET_VERSION__` because later source changes may bump it.

Do not run `npm run dev`. Do not deploy. The user provides the dev environment,
and current source/asset changes must be checked there by clearing Cache Storage
and hard reloading with cache bypass.

## Primary Outcome

Produce a completed FPB matrix whose terminal cells are supported by direct,
current evidence for each design. A design is not complete because its baseline
looks correct. Every applicable business behavior, setting, interaction, edge
case, responsive state, and cart path in the matrix must be reconciled against
EB for Standard, Classic, Compact, and Horizontal.

When a gap is found, fix the smallest correct source owner, rebuild the required
assets, prove the change in the dev storefront, update every matrix cell closed
by that proof, and commit the completed fixture group as one bounded slice.

## Hard Scope Boundaries

In scope:

- FPB storefront runtime and shopper UI for `FBP_SIDE_FOOTER`.
- Standard (`DEFAULT_FBP` in EB, `STANDARD` in WPB), Classic, Compact, and
  Horizontal preset behavior.
- The feature rows and fixture groups in the canonical FPB matrix.
- Admin interaction only to create, persist, inspect, switch, and restore
  fixtures.
- Shared FPB behavior when direct evidence proves the defect is shared.
- Cart/checkout proof needed by matrix rows.

Out of scope unless direct evidence proves a shared regression caused by the
current FPB change:

- PPB redesign or PPB feature parity.
- Admin visual parity, navigation redesign, or unrelated configure-page work.
- Theme customization or merchant theme file edits.
- New APIs, data migrations, compatibility shims, or speculative abstractions.
- Refactoring unrelated code while touching a nearby file.
- Re-investigating EB contracts already confirmed in
  `internal docs/EB Implementation Reference.md`.

Never add backward-compatibility shims. Never change the FPB config-loading
priority or its required transient `503`/`504` retry. Never fabricate fallback
merchant copy. Never add competitor names to production code.

## Mandatory Browser Tool

Use direct Chrome DevTools MCP functions for every browser action and all live
evidence:

- page selection/navigation and cache-bypassed reload;
- accessibility snapshots and screenshots;
- clicks, typing, keyboard interaction, hover, and viewport emulation;
- runtime/config inspection with `evaluate_script`;
- computed styles and geometry;
- console and network inspection.

Do not use the Chrome plugin, Browser plugin, browser-control skill, extension
bridge, `browser-client`, Node browser wrappers, Playwright wrappers, or a
simulated DOM as parity evidence.

For Shopify Admin OOPIF controls, use the accessibility tree and direct UID
interaction first. Use direct Chrome DevTools MCP evaluation against the iframe
target only when normal UID/keyboard interaction cannot activate the control.

## Required Reading Order

Before implementation:

1. Read `docs/competitor-analysis/fpb-feature-to-storefront-matrix.md`.
2. Read the relevant sections of
   `internal docs/EB Implementation Reference.md`.
3. Read `internal docs/Architecture/Widget Architecture.md`.
4. Inspect relevant communities and god nodes in
   `graphify-out/GRAPH_REPORT.md`.
5. Read the appropriate existing design spec only for the fixture group being
   executed:
   - `docs/competitor-analysis/fpb-standard-agentic-parity/SPEC.md`
   - `docs/competitor-analysis/fpb-classic-agentic-parity/SPEC.md`
   - `docs/competitor-analysis/fpb-compact-horizontal-agentic-parity/SPEC.md`
6. Open raw source only after the docs and graph establish ownership.

Before implementing any EB feature, open every visible `How to setup`, `Learn
More`, `?`, or equivalent help link on the relevant EB Admin card. Read the full
popup or external page before writing code. Add only newly discovered durable
behavior to `internal docs/EB Implementation Reference.md`.

## Fixture-Efficiency Contract

The matrix deliberately groups features so the fixture changes as little as
possible. Follow this contract:

1. Build the rich `F0` fixture once in EB and once in WPB. Use the product and
   step shape defined in the matrix.
2. Capture complete starting persisted/runtime snapshots for both apps before
   the first mutation.
3. Execute groups in this order: `F0`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`,
   `F7`, `F8`.
4. Within one group, change only the named mutation owner. Do not rebuild
   products, steps, or categories when a toggle/rule/discount change is enough.
5. Capture EB once for the group, then cycle ST → CL → CO → HO using the same
   feature fixture.
6. Restore the EB `F0` state and prove restoration.
7. Mirror the group once in WPB, cycle the same design order, then restore and
   prove WPB `F0`.
8. Update all matrix rows closed by the group together. Do not mutate Admin
   separately for every row.
9. Do not repeat an existing `P` cell unless the current group touches its
   source/runtime owner or the evidence is stale/contradictory.
10. If one feature conflicts with another, snapshot the common fixture, make
    the smallest single-owner toggle, capture all affected rows, and restore
    before proceeding.

Do not use backend or database shortcuts for EB. For WPB, use the Admin UI and
normal save/sync path. If the UI is genuinely blocked, report the exact blocker
and request user approval before any direct persisted-data mutation.

## Evidence and Promotion Rules

Raw evidence belongs under:

`/private/tmp/fpb-feature-parity/<group-id>/<eb-or-wpb>/<template-key>/`

For each template and group:

1. Confirm the saved Admin preset and group-specific setting values.
2. Clear Cache Storage and hard reload with `ignoreCache: true`.
3. Record runtime config and `window.__BUNDLE_WIDGET_VERSION__` for WPB.
4. Record the exact active base and preset CSS asset URLs.
5. Fetch or inspect the active preset CSS when the change is CSS-heavy; JS
   version alone does not prove current CSS.
6. Capture desktop `1280x800` or wider and mobile `390x844` with touch/mobile
   emulation.
7. Run `1440x900`, `768x1024`, and `360x800` for `F8` and for any layout change
   that can affect responsive behavior.
8. Exercise the actual shopper interaction, including invalid, threshold,
   qualified, removal, Back/Next, summary, reload, and cart states applicable
   to the group.
9. Capture accessibility, computed geometry, console, and app-owned network
   evidence.
10. Write an EB/WPB `delta.md`; include cart proof or a written not-applicable
    reason.

Promote a cell to `P` only when the current EB persisted/runtime value, EB
rendered behavior, equivalent WPB value, WPB behavior, and required desktop/
mobile evidence all exist. Source code or unit tests alone cannot promote a
cell. Use `E` only with direct EB absence evidence. Use `X` only with direct
evidence plus a documented safety/product reason. Use `N/A` only for structural
inapplicability.

Do not commit screenshots, HAR files, raw JSON captures, or `/private/tmp`
artifacts. Commit only durable source, tests, matrix updates, and concise
evidence notes.

## Audit Before Editing

For every non-terminal group:

1. Inspect the relevant matrix rows and existing evidence links.
2. Capture current EB desktop/mobile truth before editing WPB.
3. Measure placement, size, spacing, visual hierarchy, state, and interaction
   with computed styles and DOM/runtime inspection. Do not estimate spacing.
4. Capture edge states, including empty, partial, complete, invalid, hover,
   keyboard, reload, and cart where relevant.
5. Decide whether the gap is fixture/config, stale asset, shared runtime, or
   preset-owned presentation.
6. Perform graph impact analysis before a source change.

Do not implement based only on screenshots, historical notes, source reading,
or proof from another preset.

## Implementation Guardrails

- Fix the source owner, not generated assets.
- Storefront presentation changes belong in raw source CSS, not JavaScript
  style injection or runtime HTML composition.
- Keep preset-specific presentation in its preset stylesheet/config.
- Preserve shared selection, rules, discount, summary, add-on, and cart
  controllers unless direct evidence proves a shared defect.
- Responsive CSS must be content-driven. Use `%`, `fr`, `minmax()`, intrinsic
  sizing, container/viewport units, and existing named tokens. Do not introduce
  `clamp()` rules for this parity work. Captured pixel values are evidence only,
  never store-, fixture-, or screenshot-specific layout constants.
- Avoid `!important`; repair ownership or specificity.
- Keep Standard/Classic/Compact/Horizontal isolated. Smoke PPB only when a
  shared cross-widget source changes.
- Preserve shopper accessibility and safety even if EB is weaker. Record an
  intentional divergence as `X` rather than removing a safety behavior.
- Never alter Shopify theme files to obtain parity.

## TDD and Verification Rules

If behavior/data code changes:

1. Create or update `test-spec/<module-name>.spec.md`.
2. Write behavior tests first and confirm the focused failure.
3. Implement the smallest change.
4. Run focused Jest by path.

Do not write unit tests that inspect CSS properties, class names, selectors,
source ordering, or visual placement. CSS-only changes do not require a TDD
test; browser evidence is the verification method.

After touching raw widget JS:

- run `node --check <touched-file>`;
- bump `WIDGET_VERSION` using the correct semantic increment;
- run `npm run build:widgets`.

After touching raw FPB CSS:

- run `npm run minify:assets css`;
- verify every generated extension CSS asset remains below Shopify's 100,000 B
  limit.

After both JS and CSS changes, run both build commands. Run ESLint on modified
source files with `npx eslint --max-warnings 9999 <files>`. Zero errors are
required. Run `npm run graphify:rebuild` after code changes. Use
`git diff --check` for Markdown-only changes.

Do not run `shopify app deploy`, any deployment script, deployment backfill,
Cart Transform repair apply mode, or `npm run dev`.

## Commit Discipline

Before every commit:

- verify the complete fixture group in the dev storefront;
- update all matrix cells and evidence links closed by that group;
- restore EB and WPB to the recorded baseline when the group requires it;
- run the relevant build, focused tests, syntax checks, ESLint, Graphify, and
  `git diff --check`;
- inspect `git status --short` and preserve unrelated user changes.

Commit each completed group immediately with a narrow message body containing:

```text
Impact: touches <community>, depends on <god node or none>
Affected: <source and matrix files>
Tested by: <tests and direct browser group evidence>
```

Audit hook-generated Graphify changes after the commit. Do not combine unrelated
cleanup with the parity slice.

## Required Progress Reporting

Keep updates short and evidence-led. At each group boundary report:

- group ID and rows targeted;
- fixture mutations made;
- templates captured;
- cells promoted and cells still blocked;
- source defect, if any;
- tests/build/browser proof completed;
- restoration state and commit SHA.

Do not claim percentage completion from row count alone. Report remaining `S`
and `T` cells by fixture group so the next action remains obvious.

## Completion Criteria

The goal is complete only when all of the following are true:

1. Every applicable cell in
   `docs/competitor-analysis/fpb-feature-to-storefront-matrix.md` is `P`, `E`,
   `X`, or `N/A`; no `S` or `T` remains.
2. Every terminal cell links current, direct, design-specific evidence.
3. EB and WPB are restored to their documented `F0` baseline and each restored
   storefront has been cache-cleared and hard-reload verified.
4. Standard, Classic, Compact, and Horizontal each pass desktop, tablet,
   mobile, keyboard, overflow, CSS isolation, console/network, selection,
   validation, navigation, summary, reload, and cart smoke.
5. Every source change has the required behavior tests or browser proof, built
   generated assets, lint/syntax checks, CSS size checks, Graphify rebuild, and
   clean diff validation.
6. The worktree contains no unintended files and no raw browser artifacts.
7. Each completed fixture group has a narrow commit with impact analysis.

Do not stop after producing another plan or visual baseline. Execute the matrix
efficiently by fixture group until the terminal completion boundary is met, or
report a concrete blocker that cannot be resolved without new user authority.

---
