---
type: community
cohesion: 0.33
members: 11
---

# App Logger

**Cohesion:** 0.33 - loosely connected
**Members:** 11 nodes

## Members
- [[.bundle()]] - code - app/lib/logger.ts
- [[.debug()]] - code - app/lib/logger.ts
- [[.error()]] - code - app/lib/logger.ts
- [[.formatPrefix()]] - code - app/lib/logger.ts
- [[.info()]] - code - app/lib/logger.ts
- [[.metafield()]] - code - app/lib/logger.ts
- [[.startTimer()]] - code - app/lib/logger.ts
- [[.summary()]] - code - app/lib/logger.ts
- [[.warn()]] - code - app/lib/logger.ts
- [[AppLogger]] - code - app/lib/logger.ts
- [[logger.ts]] - code - app/lib/logger.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/App_Logger
SORT file.name ASC
```
