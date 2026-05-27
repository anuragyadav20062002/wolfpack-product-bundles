# Architecture: Select Template — FPB + PPB

## Fast-Track Note
BR context from: `docs/select-template/01-requirements.md` (fast-tracked from `internal docs/EB Implementation Reference.md` + Chrome DevTools MCP capture 2026-05-23)

**v2 update (2026-05-24):** extends original architecture with field rename, full-screen overlay, dedicated save action, and dismiss-bug fix.

---

## Impact Analysis

- **Communities touched:** FPB Configure Route community, PPB Configure Route community, Prisma Bundle model
- **God nodes affected:** `handleSaveBundle()` (both handlers) — template fields removed from save path; `db.bundle` model — two column renames
- **Blast radius:**
  - `prisma/schema.prisma` — rename `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId`; migration required
  - FPB `handlers.server.ts` — remove template parsing from `handleSaveBundle`; add `handleUpdateBundleDesignTemplate`
  - PPB `handlers/parsers.ts` — rename fields + function (`parseWpbTemplate` → `parseBundleDesignTemplate`)
  - PPB `handlers/handlers.server.ts` — remove `...parseWpbTemplate` spread; add `handleUpdateBundleDesignTemplate`
  - FPB + PPB `route.tsx` — replace s-modal with full-screen overlay; add `templateFetcher`; remove template hidden inputs from main form; add `updateBundleDesignTemplate` case to action switch

---

## Decision

Rename the two DB fields to match EB's field names (`bundleDesignTemplate`, `bundleDesignPresetId`) — no backwards-compat shims, no dual-field support. Template selection is saved **immediately on Next click** via a dedicated `useFetcher` POST (`intent: "updateBundleDesignTemplate"`), independent of the main form save/discard cycle. The `s-modal` is replaced by a `position: fixed; inset: 0` full-screen overlay (z-index 2147482000 — below `LocalAppModal`'s 2147483000 so `DiscardChangesModal` always renders above it), eliminating the s-modal dismiss-event bug entirely.

---

## Data Model

```typescript
// Renamed fields on Bundle (prisma/schema.prisma)
bundleDesignTemplate  String?  // "FBP_SIDE_FOOTER" | "PDP_INPAGE" | "PDP_MODAL"
bundleDesignPresetId  String?  // "STANDARD" | "CLASSIC" | "COMPACT" | "HORIZONTAL" | "CASCADE" | "COGNIVE" | "MODAL" | "SIMPLIFIED"

// parseBundleDesignTemplate return type (PPB parsers.ts)
interface BundleDesignTemplateFields {
  bundleDesignTemplate: string | null;
  bundleDesignPresetId: string | null;
}

// Overlay working state (per route component)
// pendingDesignTemplate / pendingDesignPresetId — initialized from main state on open,
// committed to main state + DB only when "Next" is clicked
```

---

## Files

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Rename `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId` |
| `prisma/migrations/…` | create | Migration for column rename |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts` | modify | Rename `parseWpbTemplate` → `parseBundleDesignTemplate`; rename return keys |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | modify | Remove `...parseWpbTemplate` spread; update import; add `handleUpdateBundleDesignTemplate` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | modify | Remove template fields from `handleSaveBundle`; add `handleUpdateBundleDesignTemplate` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Rename state vars; add `templateFetcher`; add overlay; remove hidden inputs + formData.append for template; add `updateBundleDesignTemplate` case |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | Same as PPB route |
| `tests/unit/routes/select-template.test.ts` | modify | Rename field keys + function name |
| `test-spec/select-template.spec.md` | modify | Update field names |

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/routes/select-template.test.ts` | unit | `parseBundleDesignTemplate` — null when empty; parses all 8 valid presets; null for whitespace-only; presetId independent of template field |

**Mock:** none (pure FormData parsing)
**No tests needed:** `handleUpdateBundleDesignTemplate` (thin Prisma wrapper), UI rendering, migration
