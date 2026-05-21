# Architecture: Unified Edit Configure Wizard

## Fast-Track Note
BR context comes from the user's create/edit wizard alignment direction in the current QA session.

## Impact Analysis
- **Communities touched:** Dashboard navigation and create configure wizard redirects.
- **God nodes affected:** `app/routes/app/app.dashboard/route.tsx` and `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` are large route modules.
- **Blast radius:** Route targets for PPB/FPB edit and clone flows. Cart-transform and legacy direct URLs stay unchanged.

## Decision
Create a small shared navigation helper for the revamped wizard path and replace local hard-coded FPB/PPB configure route construction at edit-entry points. This keeps the routing decision testable and avoids duplicating string literals.

## Data Model
No persisted data model changes.

## Files
| File | Action | What changes |
|---|---|---|
| `app/lib/bundle-navigation.ts` | create | Add `getBundleWizardConfigurePath(bundleId)`. |
| `tests/unit/lib/bundle-navigation.test.ts` | create | Cover wizard path generation. |
| `app/routes/app/app.dashboard/route.tsx` | modify | Use wizard configure path for Edit and Clone success. |
| `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` | modify | Use wizard configure path for saveAssets/saveTiers redirects and clean final navigation. |
| `docs/issues-prod/unified-edit-configure-wizard-1.md` | create | Track implementation progress. |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/lib/bundle-navigation.test.ts` | unit | Bundle ID maps to `/app/bundles/create/configure/:bundleId`. |
| `tests/unit/routes/create-bundle-configure-action.test.ts` | route action | Existing action behavior remains green. |

**Mock:** None for route helper.
**Do not mock:** Path generation helper.
**No tests needed:** CSS, visual layout, legacy direct routes.
