---
type: community
cohesion: 0.31
members: 10
---

# Metafield Cleanup Service

**Cohesion:** 0.31 - loosely connected
**Members:** 10 nodes

## Members
- [[.batchDeleteMetafields()]] - code - app/services/metafield-cleanup.server.ts
- [[.chunkArray()]] - code - app/services/metafield-cleanup.server.ts
- [[.cleanupBundleMetafields()]] - code - app/services/metafield-cleanup.server.ts
- [[.cleanupBundleProductMetafields()]] - code - app/services/metafield-cleanup.server.ts
- [[.cleanupComponentProductMetafields()]] - code - app/services/metafield-cleanup.server.ts
- [[.emergencyCleanupAllBundleMetafields()]] - code - app/services/metafield-cleanup.server.ts
- [[.updateShopMetafieldsAfterDeletion()]] - code - app/services/metafield-cleanup.server.ts
- [[.verifyCleanup()]] - code - app/services/metafield-cleanup.server.ts
- [[MetafieldCleanupService]] - code - app/services/metafield-cleanup.server.ts
- [[metafield-cleanup.server.ts]] - code - app/services/metafield-cleanup.server.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Metafield_Cleanup_Service
SORT file.name ASC
```
