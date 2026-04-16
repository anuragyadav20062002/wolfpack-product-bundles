---
type: community
cohesion: 0.25
members: 8
---

# Community 31

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[INTERNAL_WEBHOOK_SECRET Environment Variable (used for webhook auth)]] - document - docs/centralized-auth-layer/02-PO-requirements.md
- [[Rationale Rejected Single Remix Layout Route for api (heterogeneous auth tiers)]] - document - docs/centralized-auth-layer/00-BR.md
- [[Rationale Rejected Sub-namespace Layout Routes (URL path changes break external callers)]] - document - docs/centralized-auth-layer/00-BR.md
- [[applibauth-guards.server.ts — Centralized Auth Helper Functions]] - code - docs/centralized-auth-layer/03-architecture.md
- [[approutesapiapi.webhooks.pubsub.tsx (unprotected, needs requireInternalSecret)]] - code - docs/centralized-auth-layer/00-BR.md
- [[requireAdminSession (Auth Helper)]] - concept - app/
- [[requireAppProxy() — App Proxy Auth Guard]] - code - docs/centralized-auth-layer/03-architecture.md
- [[requireInternalSecret() — Internal Secret Auth Guard (timing-safe comparison)]] - code - docs/centralized-auth-layer/03-architecture.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Community_31
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Community 0]]

## Top bridge nodes
- [[requireAdminSession (Auth Helper)]] - degree 2, connects to 1 community