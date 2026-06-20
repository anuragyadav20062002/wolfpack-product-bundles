# Test Spec: Admin Route Refactor
**Spec ID:** admin-route-refactor  **Created:** 2026-06-21

## Purpose
Keep embedded Admin route refactors behavior-preserving while reducing route and route-owned component files below the maintainability hard cap.

## Test Cases
### AdminRouteFileBoundaries
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Scan Admin route and component TypeScript files | `app/routes/app`, `app/components` | Files over 600 lines are rejected unless explicitly listed in the active refactor backlog | Excludes CSS, generated, bundled, and build outputs |
| 2 | Refactor backlog remains visible | Known oversized files from the starting inventory | Backlog entries must still exist and remain over the cap until their loop removes them | Prevents silent stale allow-list entries |

### AdminConfigureActionDispatch
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB configure action receives save intent | `intent=saveBundle` | Dispatches to FPB save handler with admin, session, bundle ID, and form data | Behavior-focused dispatch test |
| 2 | FPB configure action receives sync/template/preview/placement/status intents | Matching `intent` values | Dispatches to the matching FPB handler | Covers handler split safety |
| 3 | FPB configure action receives unknown intent | Unknown `intent` | Returns 400 JSON error | Preserve response shape |
| 4 | PPB configure action receives save/sync/status/template/placement intents | Matching `intent` values | Dispatches to the matching PPB handler | Keep PPB divergences route-local |
| 5 | PPB configure action receives unknown intent | Unknown `intent` | Returns 400 JSON error | Preserve response shape |

## Acceptance Criteria
- [ ] `npm run test:integration` runs real tests instead of only `.gitkeep`.
- [ ] Admin route/component file-size guard is active.
- [ ] Configure action dispatch tests pass before and after handler/module extraction.
- [ ] Refactor backlog entries are removed from the guard as their files drop under 600 lines.
