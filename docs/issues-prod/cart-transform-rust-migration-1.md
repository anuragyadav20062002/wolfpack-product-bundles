# Issue: Migrate Cart Transform Function from TypeScript to Rust

**Issue ID:** cart-transform-rust-migration-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-16

## Overview

Migrate the Shopify Cart Transform Function from TypeScript (WASM via `@shopify/shopify_function`) to Rust (WASM via `shopify_function` crate). The TS extension is ~729 lines implementing MERGE and EXPAND operations, plus a 422-line utils file that is dead code (not imported by the main entry).

**Motivation:**
- 30–35% instruction count reduction (~450K → ~300K) — headroom for future features
- Compile-time type safety: the 6-arg `calculateDiscountPercentage` call-site bug would be caught at build time
- Smaller binary (~150KB → ~90KB after wasm-opt)

**The TS extension remains active during migration. Both extensions coexist in the repo. The Rust extension gets a new handle (`bundle-cart-transform-rs`) and is tested on dev store before cutting over.**

## Source Files — What to Port

| File | Lines | Action |
|---|---|---|
| `cart_transform_run.ts` | 729 | Port: main logic — MERGE + EXPAND + all helpers |
| `cart-transform-bundle-utils.ts` | 422 | **SKIP** — dead code, not imported by entry |
| `cart-transform-logger.ts` | 101 | Port: logging pattern only (use `log!()` macro) |
| `cart-transform-input.graphql` | 66 | Copy as `src/run.graphql` |
| `schema.graphql` | 4432 | Copy from TS extension root |

## Key Architectural Findings

- EXPAND operation is "Flex Bundles" pattern — keeps same `merchandiseId` (bundle variant), adds component data in attributes. Does NOT expand to components.
- `calculateDiscountPercentage` takes 6 params including `presentmentCurrencyRate` for multi-currency
- Free-gift lines are isolated from paidTotal; `effectivePct` makes them $0 at checkout
- `bundleNameCounts` Map prevents Shopify MERGE consolidation of duplicate bundle instances
- UID `06d00551-8da0-9b28-79e8-63af90adb1019dc2f112` must be preserved in the Rust extension TOML
- `schema.graphql` already exists in TS extension root — no need to run `shopify app function schema`

## Migration Plan

| Commit | Work |
|---|---|
| 1 | Scaffold: Cargo.toml, shopify.extension.toml, main.rs stub, run.graphql, schema.graphql, .gitignore |
| 2 | Types + helpers: types.rs, helpers.rs (safe_parse_float, parse_json, Operator enum, normalize) |
| 3 | Pricing engine: pricing.rs — calculate_discount_percentage (6-param port) |
| 4 | MERGE operation: merge.rs — grouping, discount calc, output construction |
| 5 | EXPAND operation: expand.rs — Flex Bundle pattern |
| 6 | Wire up run.rs entry point — dispatch to merge/expand |
| 7 | Integration tests: tests/integration_test.rs |

## Progress Log

### 2026-04-16 — Starting implementation
- Research complete: RUST_MIGRATION_RESEARCH.md + full source analysis
- Branch: `migrate/cart-transform-rust` (from `refactor/26.04`)
- Rust not installed on dev machine — code written ready-to-compile
- Beginning Commit 1: Scaffold

## Phases Checklist
- [ ] Commit 1: Scaffold
- [ ] Commit 2: Types + helpers
- [ ] Commit 3: Pricing engine
- [ ] Commit 4: MERGE operation
- [ ] Commit 5: EXPAND operation
- [ ] Commit 6: Wire up run.rs
- [ ] Commit 7: Integration tests
- [ ] Deploy to dev store and verify
- [ ] Cut over production (swap handle, redeploy)
- [ ] Remove TS extension after 1–2 weeks stable
