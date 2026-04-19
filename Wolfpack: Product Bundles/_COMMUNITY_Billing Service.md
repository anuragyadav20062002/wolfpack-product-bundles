---
type: community
cohesion: 0.23
members: 12
---

# Billing Service

**Cohesion:** 0.23 - loosely connected
**Members:** 12 nodes

## Members
- [[.canCreateBundle()_1]] - code - app/services/billing.server.ts
- [[.cancelSubscription()]] - code - app/services/billing.server.ts
- [[.confirmSubscription()]] - code - app/services/billing.server.ts
- [[.createSubscription()]] - code - app/services/billing.server.ts
- [[.ensureShop()]] - code - app/services/billing.server.ts
- [[.getBundleLimit()]] - code - app/services/billing.server.ts
- [[.getSubscriptionInfo()]] - code - app/services/billing.server.ts
- [[.grantGrowPlan()]] - code - app/services/billing.server.ts
- [[.handleDowngradeProtection()]] - code - app/services/billing.server.ts
- [[.isFeatureAvailable()]] - code - app/services/billing.server.ts
- [[BillingService]] - code - app/services/billing.server.ts
- [[billing.server.ts]] - code - app/services/billing.server.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Billing_Service
SORT file.name ASC
```
