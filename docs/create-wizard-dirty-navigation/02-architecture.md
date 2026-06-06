# Architecture: Create Wizard Dirty Navigation

## Fast-Track Note
BR context comes from the current Create Bundle QA session and `docs/issues-prod/create-bundle-flow-defects-1.md`.

## Impact Analysis
- **Communities touched:** Create bundle wizard route and its existing route action tests.
- **God nodes affected:** `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` is a large route module already touched by the create workflow defects work.
- **Blast radius:** Create Bundle wizard navigation only. No widget, Prisma schema, or edit configure route changes.

## Decision
Use client-side page payload baselines. Each wizard page builds the exact persisted payload it would submit, compares that payload with the last saved baseline, and skips the fetcher submission when unchanged. The baseline is refreshed after successful fetcher responses and after server-generated step IDs are merged.

## Data Model
No persisted data model changes.

## Files
| File | Action | What changes |
|---|---|---|
| `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` | modify | Add page payload builders, baseline refs, dirty checks in `handleNext`, and baseline refresh after successful saves. |
| `tests/unit/routes/create-bundle-configure-action.test.ts` | modify | Add helper-level coverage for clean-vs-dirty submit decisions. |
| `docs/issues-prod/create-bundle-flow-defects-1.md` | modify | Log the optimization work. |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/routes/create-bundle-configure-action.test.ts` | route action | Existing saveConfig step ID and collection persistence coverage remains green. |
| `tests/unit/routes/create-bundle-configure-action.test.ts` | route/helper unit | Clean configuration payload skips submit after DB step IDs exist; unchanged unsaved steps still submit; dirty payload submits. |

**Mock:** Remix loader/fetchers, Prisma, Shopify globals, child picker/tour components.
**Do not mock:** payload comparison helpers once extracted/exported.
**No tests needed:** CSS changes and live Shopify resource picker modals.
