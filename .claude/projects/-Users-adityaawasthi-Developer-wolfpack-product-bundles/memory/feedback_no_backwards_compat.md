---
name: no-backwards-compat
description: Never add backwards-compatibility shims or migration hacks — use the Sync Bundle feature instead
type: feedback
---

Never add backwards-compatibility code, fallback shims, or migration hacks when adding new features.

**Why:** The app has a "Sync Bundle" feature on configure pages. Merchants can re-sync to pick up new defaults. An info banner can prompt syncing when the widget version increments. Backwards-compat code accumulates silently, creates hidden bugs, and makes the codebase harder to reason about.

**How to apply:** When adding new settings: add direct Prisma columns, update CSS generator + mergeSettings + handlers to read the new field directly. Don't keep old JSON blob field mappings "just in case". Drop the old path and let the Prisma column default take over.
