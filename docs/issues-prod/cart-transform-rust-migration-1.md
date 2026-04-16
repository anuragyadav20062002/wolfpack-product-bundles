# Issue: Migrate Cart Transform Function from TypeScript to Rust

**Issue ID:** cart-transform-rust-migration-1
**Status:** In Progress — 24/24 tests pass, WASM built, 8 fixtures verified locally, pending SIT deploy
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-17 02:30

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

### 2026-04-17 02:30 — f64 precision fix + 8 test fixtures verified

- `pricing.rs`: Round effectivePct to 4dp before returning — eliminates `19.999999999999996` noise for `fixed_amount_off` and `fixed_bundle_price` methods
- `merge.rs`: Same 4dp rounding applied to free-gift absorption inline path
- All 24 cargo tests still pass (18 unit + 6 integration)
- 8 test fixture JSON files run through function-runner locally — all produce correct output:
  - `rstestinput.json` → 1 MERGE, 20% ✅
  - `test-merge-free-gift.json` → 1 MERGE, 20% ✅
  - `test-merge-fixed-amount.json` → 1 MERGE, 20% ✅
  - `test-merge-fixed-price.json` → 1 MERGE, 40% ✅
  - `test-merge-condition.json` → 1 MERGE, 15% (qty ≥ 3 met) ✅
  - `test-expand-flex-bundle.json` → 1 EXPAND, 10% ✅
  - `test-mixed-cart.json` → 1 MERGE + 1 EXPAND (standalone ignored) ✅
  - `test-multicurrency.json` → 1 MERGE, 20% (AUD rate=1.5) ✅

### 2026-04-17 01:30 — Handle cutover: TS → RS, forceReactivate added

- `cart-transform-service.server.ts`: handle changed to `bundle-cart-transform-rs`; added `deleteCartTransform` + `forceReactivate` methods
- `api.activate-cart-transform.tsx`: `?force=true` param triggers delete-and-recreate for handle cutover
- To cut over on SIT: deploy → visit `/api/activate-cart-transform?force=true` in the app

### 2026-04-17 00:46 — All compile errors fixed, 28/28 tests pass, WASM built

**Fixes applied in this session:**
- `Cargo.toml`: added `"rlib"` to `crate-type` so integration tests can link against the lib
- `expand.rs`: `Decimal::from(discount_percentage)` (f64, not formatted String); `attributes: Some(attributes)`; `CartOperation::Expand(expand_op)` enum variant; temporary `format!()` lifetime fix via `let fallback`
- `pricing.rs`: PercentageOff short-circuits when `paid_total == original_total` to avoid f64 roundtrip error (19.999... → exact 20.0)
- `tests/integration_test.rs`: enum pattern matching for CartOperation (`match op { Merge(m) => … }`); Decimal assertion corrected to `"20.0"` (Rust f64 Display format)
- WASM binary: 204 KB at `target/wasm32-unknown-unknown/release/bundle_cart_transform_rs.wasm`

### 2026-04-16 — All 7 commits landed (code complete)

**Commits on branch `migrate/cart-transform-rust`:**
- `d23e61e` — Commit 1: Scaffold (Cargo.toml, shopify.extension.toml, main.rs stub, schema.graphql, run.graphql)
- `d9a7880` — Commit 2: types.rs (all output + metafield JSON types) + helpers.rs (safe_parse_float, parse_json_or_default, normalize_operator, is_free_gift_line, truncate) + unit tests
- `33f97e3` — Commit 3: pricing.rs — calculate_discount_percentage (6-param, all methods, free-gift math, condition check, rate guard) + 10 unit tests
- `69c255c` — Commit 4: merge.rs — O(n) grouping, unique title suffix, compact component tuples, always-include price field
- `c38e53b` — Commit 5: expand.rs — Flex Bundle pattern, component_pricing map, missing-pricing zero-tolerance rule
- `e8ad910` — Commit 6: run.rs + main.rs wired — full MERGE+EXPAND dispatch, empty-cart guard, presentment_rate guard
- `3bb09f8` — Commit 7: tests/integration_test.rs — 6 full-stack JSON fixture tests

**Next steps (human required):**
1. From project root: test with `shopify app function run` → select bundle-cart-transform-rs → send test fixture
2. `npm run deploy:sit` → test on SIT store
3. `npm run deploy:prod` → swap active handle to `bundle-cart-transform-rs`

## Phases Checklist
- [x] Commit 1: Scaffold
- [x] Commit 2: Types + helpers
- [x] Commit 3: Pricing engine
- [x] Commit 4: MERGE operation
- [x] Commit 5: EXPAND operation
- [x] Commit 6: Wire up run.rs
- [x] Commit 7: Integration tests
- [x] cargo test — 24/24 pass (18 unit + 6 integration)
- [x] cargo build --target=wasm32-unknown-unknown --release — WASM built + trampolined
- [x] 8 test fixtures verified via function-runner — all correct
- [ ] Deploy to SIT + verify on dev store
- [ ] Deploy to PROD + cut over (swap handle)
- [ ] Remove TS extension after 1–2 weeks stable
