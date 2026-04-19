# Issue: Codebase Audit Cleanup — Cart Transform Migration + Doc Hygiene + Graph Completion

**Issue ID:** codebase-audit-cleanup-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-16 12:00

## Overview

Follow-up actions from the internal docs audit (2026-04-16). Three priority tiers:
1. Migrate deprecated cart transform target in TOML
2. Fix/deprecate stale docs in `docs/`
3. Complete semantic extraction for graphify knowledge graph (chunks 05, 08–23)

## Progress Log

### 2026-04-16 00:00 - Starting all three priority tiers

**Priority 1 — Cart Transform TOML migration:**
- File: `extensions/bundle-cart-transform-ts/shopify.extension.toml`
- Change: `purchase.cart-transform.run` → `cart.transform.run`

**Priority 2 — Doc hygiene:**
- Delete `docs/CART_TRANSFORM_FUNCTION.md` (actively misleading — says Rust, wrong API version, wrong op names)
- Fix rate limit in `docs/API_ENDPOINTS.md` (40 req/sec → 1,000 points/sec leaky bucket)
- Update `docs/APPLICATION_ARCHITECTURE.md` (add missing models, fix Node version)

**Priority 3 — Semantic extraction:**
- Re-run chunks 05, 08–23 (16 chunks missing from graphify-out/)
- After completion: merge into graph, rebuild Obsidian vault

## Phases Checklist
- [x] Priority 1: Migrate cart transform target → `cart.transform.run`
- [x] Priority 2a: Deleted CART_TRANSFORM_FUNCTION.md (actively misleading)
- [x] Priority 2b: Fixed API_ENDPOINTS.md rate limit (40 req/s → 1000 pts/s leaky bucket)
- [x] Priority 2c: Updated APPLICATION_ARCHITECTURE.md (Node 20+, missing models, FullPageLayout enum, unlisted status)
- [x] Priority 3: All 23 semantic chunks extracted and validated
- [x] Priority 3: Graph rebuilt — 3012 nodes, 1998 edges, 4700 Obsidian notes
