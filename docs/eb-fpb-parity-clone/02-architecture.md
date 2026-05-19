# Architecture: EB FPB Configure Parity Clone

## Fast-Track Note

> Stage 1 (BR/PO) skipped — full exploration context from:
> `docs/eb-fpb-exploration/EB_FPB_CONFIGURE_EXPLORATION.md`
>
> **Excluded from scope per exploration doc line 6:** Subscriptions, Select Template,
> all email-related features, Pre-order & Subscription toggles, Messages email toggle,
> Preview Bundle 2-step wizard.

---

## Status Correction — Stale Comparison Table

The WPB vs EB comparison table in `EB_FPB_CONFIGURE_EXPLORATION.md` (lines 738–766)
was written before a series of implementation sessions. It lists ~20 features as ❌
in WPB's FPB route, but the actual route code (`route.tsx`, 3802 lines) shows most
of those features are already implemented.

**Verified true gaps (5 total)** — everything else is already implemented:

| # | Gap | Evidence |
|---|-----|---------|
| 1 | Bundle Widget sub-section + nav item | `bundleSetupItems` array (line 214) has no `bundle_widget` entry; PPB has full implementation |
| 2 | Bundle Banner inline upload | Schema has fields; route (line 3451) shows redirect button, not FilePicker |
| 3 | Bundle Level CSS inline editor | Schema has field; route (line 3459) shows "Design panel" badge, not textarea |
| 4 | "Quick Setup Guide" buttons open wrong target | Line 2922 calls `handlePlaceWidget` (opens modal); should open external docs URL |
| 5 | Cart line item discount display radio (Phase 1 only) | Line 3431 shows only "Edit Defaults" button; no radio group |

---

## Impact Analysis

- **Communities touched:** FPB Configure Route community (primary); Bundle Widget
  community (Gap 1 adds widget section to FPB)
- **God nodes affected:** `BundleWidgetFullPage` (126 edges) — Gap 1 adds
  upsell widget state and save path to FPB, which is the main entry point for
  full-page widget configuration. Changes must not alter existing save paths.
- **Blast radius:** FPB configure route only. No shared components modified.
  PPB route untouched. No widget JS source changes → no widget rebuild needed.

---

## Decision

Implement all 5 gaps in a single PR against the FPB configure route. Gap 1 (Bundle Widget)
copies the PPB route's existing implementation verbatim — same state shape, same formData
keys, same UI components. Gaps 2–4 are UI-only changes within Bundle Settings and Bundle
Visibility sections. Gap 5 (cart line item radio) adds the "Use app defaults" radio option
only; the "Customize for this bundle" panel is Phase 2.

No new Prisma columns needed — all required fields already exist in the schema.

---

## Data Model

No migrations required. All fields already exist:

```typescript
// Already in prisma/schema.prisma — Bundle model
bundleBannerDesktopUrl  String?                        // Gap 2
bundleBannerMobileUrl   String?                        // Gap 2
bundleLevelCss          String?                        // Gap 3
upsellWidgetEnabled     Boolean  @default(false)       // Gap 1
upsellWidgetDisplayMode String?                        // Gap 1
upsellWidgetDisplayOn   String?                        // Gap 1
autoSelectBrowsedProduct Boolean @default(false)       // Gap 1
```

Gap 5 (cart line item radio) uses "Use app defaults" as the only selectable state in
Phase 1 — no persistence needed; it is always in this state.

---

## Files

| File | Action | What changes |
|---|---|---|
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | All 5 gaps: nav item, state vars, formData handlers, UI sections |
| `app/styles/routes/full-page-bundle-configure.module.css` | modify | Bundle Widget section styles (copied from PPB CSS) |

### Detailed changes per gap

#### Gap 1 — Bundle Widget sub-section

**State** (copy from PPB `route.tsx` lines 414–417):
```tsx
const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>(
  (bundle as any).upsellWidgetEnabled ?? false
);
const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] = useState<string>(
  (bundle as any).upsellWidgetDisplayMode ?? "block"
);
const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>(
  (bundle as any).upsellWidgetDisplayOn ?? "all"
);
const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] = useState<boolean>(
  (bundle as any).autoSelectBrowsedProduct ?? false
);
```

**Nav** — add to `bundleSetupItems` array after `bundle_settings`:
```tsx
{ key: "bundle_widget", label: "Bundle Widget" }
```

**formData** — add fields to the existing save action submission:
```
upsellWidgetEnabled, upsellWidgetDisplayMode, upsellWidgetDisplayOn,
autoSelectBrowsedProduct
```

**action handler** — add bundle widget fields to the update `data` object (same pattern
as discount, visibility, settings saves).

**UI** — new `bundle_widget` case in the `renderRightPanel` switch. Copy the PPB
Bundle Widget section UI exactly:
- Enable Upsell Widget toggle (`s-switch`)
- Display Mode select (`s-select`: Block / Inline)
- Display On select (`s-select`: All Pages / Product Pages / Collection Pages / Home Page)
- Auto-Select Browsed Product checkbox (`s-checkbox`)

#### Gap 2 — Bundle Banner inline upload

**Location:** Bundle Settings → `bundleBanner` sub-section (currently line 3451).

Replace the redirect button with two `s-drop-zone` / file input controls:
- Desktop banner: `bundleBannerDesktopUrl` — recommended 1900×230 px
- Mobile banner: `bundleBannerMobileUrl` — recommended 1100×500 px

File upload uses the existing pattern from other upload sections in the route (image
upload via fetcher POST to the file upload action, then stores URL in state).

Show current image preview (`s-thumbnail` or `<img>`) when URL exists.
Show recommended size hint as `s-text` below each drop zone.

**State additions:**
```tsx
const [bundleBannerDesktopUrl, setBundleBannerDesktopUrl] = useState<string>(
  bundle.bundleBannerDesktopUrl ?? ""
);
const [bundleBannerMobileUrl, setBundleBannerMobileUrl] = useState<string>(
  bundle.bundleBannerMobileUrl ?? ""
);
```

#### Gap 3 — Bundle Level CSS inline editor

**Location:** Bundle Settings → `bundleLevelCss` sub-section (currently line 3459).

Replace the "Design panel" badge with a `<textarea>` (no Polaris text-area component
supports code/monospace — use native `<textarea>` styled with the existing CSS class).

Show a label "Bundle-level CSS" with placeholder "/* Add custom CSS for this bundle */".

**State addition:**
```tsx
const [bundleLevelCss, setBundleLevelCss] = useState<string>(
  bundle.bundleLevelCss ?? ""
);
```

#### Gap 4 — "Quick Setup Guide" buttons

**Location:** Bundle Visibility section (currently line 2922).

The two "Quick Setup Guide" and "Documentation" buttons currently call `handlePlaceWidget`.
Change them to `s-button` elements with `onClick` opening external doc URLs via
`window.open(url, "_blank")`. Use the appropriate Shopify/WPB documentation URL
(confirm with user if unknown — use placeholder `#` until confirmed).

The "Set up Bundle Widget" button in the same section (line 2994) should call
`handleSectionChange("bundle_widget")` to navigate to the new Bundle Widget sub-section.

#### Gap 5 — Cart line item discount display radio (Phase 1)

**Location:** Bundle Settings → cart line item block (currently line 3431–3439).

Add a radio group with two options:
- ◉ Use app defaults
- ○ Customize for this bundle (disabled in Phase 1, shown grayed with "Coming soon" badge)

The "Edit Defaults" button remains under "Use app defaults" selection.

No new state or persistence needed for Phase 1 — the radio always renders in "Use app
defaults" selected state.

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| No new unit test files | — | Pure UI additions; no new utility functions |
| ESLint | modified files | Zero errors on both modified files |
| Manual E2E | Chrome DevTools | All 5 gaps visible and interactive; save round-trip for Gap 1 (bundle widget fields persisted) |

**No unit tests required for this feature** per CLAUDE.md TDD guidance:
- No new `app/lib/` exports
- No new route action/loader logic beyond adding formData field reads
- All new code is UI rendering (Polaris components, event handlers)

**Manual E2E checklist:**
- [ ] "Bundle Widget" nav item appears under Bundle Settings
- [ ] Bundle Widget section renders all 4 controls
- [ ] Save → reload confirms bundle widget fields persisted
- [ ] Bundle Banner section shows two file upload zones
- [ ] Bundle Level CSS textarea accepts input and saves
- [ ] "Quick Setup Guide" buttons open in new tab (not modal)
- [ ] Cart line item section shows radio group with "Customize" grayed out
