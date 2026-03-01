# Architecture Decision Record: Legacy Code Removal

## Context

Five distinct pieces of dead code were identified across the widget installation service layer, the metafield sync service, and the product page widget JS. All have zero callers confirmed by grep. This ADR documents the deletion approach and the order of operations.

## Constraints

- Must not touch any active backwards-compatibility code (Category B from BR)
- TypeScript must compile after each removal step
- Widget JS change requires a rebuild of the bundled file

## Options Considered

### Option A: Delete everything in one commit
Remove all five items in a single atomic commit.

- **Pros:** Single clean diff, easier to revert if something is missed
- **Cons:** Harder to isolate if one deletion introduces an unexpected TS error

### Option B: Delete by layer (service → utility → widget)
Remove items grouped by their layer: service layer first, then metafield utils, then widget.

- **Pros:** Easier to debug TS errors per layer; cleaner git history
- **Cons:** Slightly more commits

**Verdict: ✅ Option A — all in one commit.** The deletions are independent of each other (no cross-references between the five items), and grep has confirmed zero callers. A single atomic commit is cleaner and fully reversible.

## Decision: Option A — single atomic deletion commit

## Files to Modify / Delete

| Action | File | Change |
|--------|------|--------|
| **DELETE** | `app/services/widget-installation/widget-installation-legacy.server.ts` | Entire file |
| **EDIT** | `app/services/widget-installation/widget-installation-core.server.ts` | Remove import of legacy functions + remove static method re-exports |
| **EDIT** | `app/services/widget-installation/index.ts` | Remove `// Legacy methods` export block |
| **EDIT** | `app/services/bundles/metafield-sync/operations/definitions.server.ts` | Remove `ensureBundleMetafieldDefinitions` function |
| **EDIT** | `app/services/bundles/metafield-sync/operations/index.ts` | Remove `ensureBundleMetafieldDefinitions` from re-exports |
| **EDIT** | `app/services/bundles/metafield-sync/index.ts` | Remove `ensureBundleMetafieldDefinitions` from re-exports |
| **EDIT** | `app/services/bundles/metafield-sync.server.ts` | Remove `ensureBundleMetafieldDefinitions` from re-exports |
| **EDIT** | `app/assets/bundle-widget-product-page.js` | Remove `getStepSelectionText` method + comment block |
| **REBUILD** | `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | `npm run build:widgets` |

## Backward Compatibility

None required — these are dead paths with no callers.

## Testing Approach

- TypeScript diagnostics via `mcp__ide__getDiagnostics` after edits
- Existing test suite continues to pass (no test files are changed)
- Manual: confirm widget loads correctly in dev after rebuild
