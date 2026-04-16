---
type: community
cohesion: 0.17
members: 16
---

# Metafield Architecture

**Cohesion:** 0.17 - loosely connected
**Members:** 16 nodes

## Members
- [[64-Test Suite (metafields, cart transform, bundle config, product IDs)]] - document - docs/archive/TESTING_GUIDE.md
- [[Architecture 1 Per-Product Metafields (Recommended)]] - document - docs/archive/SCALABLE_ARCHITECTURE_PROPOSAL.md
- [[Architecture 2 Optimized Shop Metafield]] - document - docs/archive/SCALABLE_ARCHITECTURE_PROPOSAL.md
- [[Architecture 3 Hybrid Per-Product + Shop Index]] - document - docs/archive/SCALABLE_ARCHITECTURE_PROPOSAL.md
- [[Cart Transform Input 10KB Limit]] - document - docs/archive/SCALABLE_ARCHITECTURE_PROPOSAL.md
- [[Metafield Namespace Fix ($app → custom)]] - document - docs/archive/METAFIELD_NAMESPACE_FIX.md
- [[Metafield Namespace Mismatch Bug (write $app vs read custom)]] - document - docs/archive/METAFIELD_NAMESPACE_FIX.md
- [[Rationale Use 'custom' namespace for Liquid-accessible metafields]] - document - docs/archive/METAFIELD_NAMESPACE_FIX.md
- [[Scalable Metafield Architecture Proposal]] - document - docs/archive/SCALABLE_ARCHITECTURE_PROPOSAL.md
- [[Shopify GID Validation (Only GIDs allowed, UUIDs rejected)]] - document - docs/archive/STRICT_PRODUCT_ID_VALIDATION.md
- [[Strict Product ID Validation]] - document - docs/archive/STRICT_PRODUCT_ID_VALIDATION.md
- [[Testing Guide]] - document - docs/archive/TESTING_GUIDE.md
- [[UUID Prevention Solution]] - document - docs/archive/UUID_PREVENTION.md
- [[UUID Root Cause Fix (Database Primary Key vs productId)]] - document - docs/archive/UUID_ROOT_CAUSE_FIX.md
- [[UUID Root Cause React State Transform on Init (id → productId)]] - document - docs/archive/UUID_ROOT_CAUSE_FIX.md
- [[UUID from Corrupted Browser State (not database)]] - document - docs/archive/UUID_PREVENTION.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Metafield_Architecture
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Ad-Ready Bundles Feature Docs]]

## Top bridge nodes
- [[Metafield Namespace Fix ($app → custom)]] - degree 4, connects to 1 community