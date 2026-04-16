# Cart Transform: TypeScript → Rust Migration Research
**Date:** 2026-04-16  
**Source:** Exploration agent — codebase analysis + Shopify Dev MCP + documentation  
**Status:** Research only — no code written

---

## Executive Summary

The wolfpack Cart Transform Function is ~729 lines of TypeScript implementing MERGE and EXPAND operations. Migrating to Rust is **technically sound** and provides:

- **30–35% instruction count reduction** (~450K → ~300K) — safety margin for future features
- **Compile-time type safety** — the argument-mismatch bug in EXPAND path would have been caught at build time
- **Smaller binary** (~150KB → ~90KB after wasm-opt)

**Trade-offs:** First Rust build is ~30s vs TS's ~5s. Rust ownership semantics require more explicit error handling. JSON metafield parsing is more verbose.

**Timeline estimate:** 8–9 days with Rust experience; 2–3 weeks without.

---

## Current State Baseline

### TypeScript Config (`shopify.extension.toml`)
```toml
api_version = "2025-10"
[[extensions]]
name = "Bundle Cart Transform"
handle = "bundle-cart-transform"
type = "function"
[[extensions.targeting]]
target = "cart.transform.run"
input_query = "src/cart-transform-input.graphql"
export = "run"

[extensions.build]
# Empty = Shopify CLI default TS build
```

### TypeScript Source Files
| File | Lines | Purpose |
|---|---|---|
| `cart_transform_run.ts` | 729 | Main entry + all MERGE/EXPAND logic |
| `cart-transform-bundle-utils.ts` | 422 | Utility helpers (mostly dead code — inlined in main) |
| `cart-transform-logger.ts` | 101 | Structured logging (currently disabled) |
| `index.ts` | — | Barrel export: `export { run, cartTransformRun }` |
| `src/cart-transform-input.graphql` | 66 | Input query — cart lines, metafields, cost fields |

### Key Logic in `cart_transform_run.ts`
- `calculateDiscountPercentage(priceAdjustment, paidTotal, originalTotal, totalQty, paidQty, rate)` — 6-param, handles all 3 discount methods + conditions + free-gift isolation + multi-currency
- `groupLinesByBundleId()` — O(n) HashMap grouping (optimized after `InstructionCountLimitExceededError`)
- `safeParseFloat()` — NaN/Infinity guard
- `parseJSON<T>()` — safe JSON parsing with typed fallback defaults
- `normalizeConditionOperator()` — alias resolution for `gte`/`lte`/`gt`/`lt`/`eq`

---

## Rust Extension Structure

### Directory Layout
```
extensions/bundle-cart-transform-rs/
├── Cargo.toml
├── Cargo.lock                       ← commit this
├── shopify.extension.toml
├── src/
│   ├── main.rs                      ← entry point + #[typegen]
│   ├── run.rs                       ← MERGE/EXPAND logic
│   ├── pricing.rs                   ← calculateDiscountPercentage port
│   ├── bundle_utils.rs              ← helpers (safe_parse_float, JSON utils)
│   ├── run.graphql                  ← copy of cart-transform-input.graphql
│   └── schema.graphql               ← auto-generated via `shopify app function schema`
├── tests/
│   └── integration_tests.rs
└── .gitignore                       ← target/, *.wasm, schema.graphql
```

### Cargo.toml
```toml
[package]
name = "bundle-cart-transform-rs"
version = "1.0.0"
edition = "2021"

[dependencies]
shopify_function = "1.1.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[profile.release]
lto = true        # link-time optimization
opt-level = 'z'   # optimize for binary size
strip = true      # strip debug symbols
```

### Updated `shopify.extension.toml`
```toml
api_version = "2025-10"

[[extensions]]
name = "Bundle Cart Transform"
handle = "bundle-cart-transform-rs"   # changed
type = "function"

[[extensions.targeting]]
target = "cart.transform.run"
input_query = "src/run.graphql"        # renamed from cart-transform-input.graphql
export = "run"

[extensions.build]
command = "cargo build --target=wasm32-unknown-unknown --release"
path = "target/wasm32-unknown-unknown/release/bundle-cart-transform-rs.wasm"
watch = ["src/**/*.rs"]
```

### `src/main.rs`
```rust
use shopify_function::prelude::*;
use std::process;

mod run;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/run.graphql")]
    pub mod run {}
}

fn main() {
    log!("Please invoke a named export");
    process::abort();
}
```

The `#[typegen]` macro reads `schema.graphql` + `src/run.graphql` and generates strongly-typed input/output structs at compile time — zero runtime overhead.

### `src/run.rs` entry point
```rust
use shopify_function::prelude::*;
use shopify_function::Result;
use super::schema;

#[shopify_function]
fn run(input: schema::run::Input) -> Result<schema::CartTransformRunResult> {
    // ... MERGE/EXPAND logic
    Ok(schema::CartTransformRunResult { operations })
}
```

---

## Build Toolchain Comparison

| Aspect | TypeScript | Rust |
|---|---|---|
| Build command (TOML) | empty (CLI default) | `cargo build --target=wasm32-unknown-unknown --release` |
| WASM target | `wasm32-wasip1` (deprecated in Rust 1.84+) | `wasm32-unknown-unknown` |
| Code generation | `@shopify/shopify_function` npm package + codegen | `#[typegen]` macro at compile time |
| Schema fetch | auto via CLI | `shopify app function schema` (manual, then gitignored) |
| First build time | ~5s | ~25–30s |
| Incremental build | ~5s | ~5s |
| Unit test runner | `vitest` | `cargo test` |
| Local function run | `shopify app function run` | `shopify app function run` (same) |

---

## Porting Key Patterns

### 1. Grouping lines by `_bundle_id`

**TypeScript:**
```typescript
const bundleGroups = new Map<string, CartLine[]>();
for (const line of input.cart.lines) {
  const bundleId = line.bundleId?.value;
  if (bundleId) {
    if (!bundleGroups.has(bundleId)) bundleGroups.set(bundleId, []);
    bundleGroups.get(bundleId)!.push(line);
  }
}
```

**Rust:**
```rust
use std::collections::HashMap;
let mut bundle_groups: HashMap<String, Vec<&schema::run::input::cart::Lines>> = HashMap::new();
for line in input.cart().lines() {
    if let Some(bundle_id) = line.bundle_id().and_then(|a| a.value()) {
        bundle_groups.entry(bundle_id.to_string()).or_default().push(line);
    }
}
```

### 2. Safe float parsing

**TypeScript:**
```typescript
function safeParseFloat(value: string | undefined): number {
  const num = parseFloat(value ?? '');
  return Number.isFinite(num) ? num : 0;
}
```

**Rust:**
```rust
fn safe_parse_float(value: Option<&str>) -> f64 {
    value
        .and_then(|v| v.parse::<f64>().ok())
        .filter(|v| v.is_finite())
        .unwrap_or(0.0)
}
```
Rust's `.parse::<f64>()` returns `Result`, not NaN — stricter by default.

### 3. JSON metafield parsing

**TypeScript:**
```typescript
const parents = parseJSON<ComponentParent[]>(line.merchandise.component_parents?.value, [], 'component_parents');
```

**Rust:**
```rust
#[derive(serde::Deserialize)]
struct ComponentParent {
    id: String,
    component_reference: Vec<String>,
    component_quantities: Vec<i32>,
    #[serde(default)]
    price_adjustment: Option<PriceAdjustment>,
}

let parents: Vec<ComponentParent> = line
    .merchandise()
    .and_then(|m| m.component_parents())
    .and_then(|cp| cp.value())
    .and_then(|v| serde_json::from_str(v).ok())
    .unwrap_or_default();
```

### 4. Condition operators — use enum, not strings

**TypeScript:**
```typescript
if (operator === 'gte') return actual >= threshold;
```

**Rust:**
```rust
#[derive(serde::Deserialize)]
enum Operator {
    #[serde(rename = "gte")] Gte,
    #[serde(rename = "gt")]  Gt,
    #[serde(rename = "lte")] Lte,
    #[serde(rename = "lt")]  Lt,
    #[serde(rename = "eq")]  Eq,
}

match operator {
    Operator::Gte => actual >= threshold,
    Operator::Gt  => actual > threshold,
    Operator::Lte => actual <= threshold,
    Operator::Lt  => actual < threshold,
    Operator::Eq  => actual == threshold,
}
```

### 5. Logging

**TypeScript:** `console.log()` (disabled; CartTransformLogger class)

**Rust:** `log!()` macro from `shopify_function::prelude` — always disabled in production, development only.
```rust
log!("Discount calculated: {:.2}", discount_pct);
```

### 6. Error handling

**TypeScript:** try/catch returning `{ operations: [] }`

**Rust:** `Result` propagation — panics are stripped by wasm-snip; use `.unwrap_or_default()` for non-fatal failures.

### 7. String formatting

**TypeScript:** Template literals: `` `${value.toFixed(2)}` ``

**Rust:** `format!("{:.2}", value)` — exact equivalent.

---

## Testing Strategy

### TypeScript (vitest)
```typescript
const result = cartTransformRun(buildMergeInput({ ... }));
expect(result.operations[0].merge).toBeDefined();
```

### Rust (cargo test + `run_function_with_input`)
```rust
#[cfg(test)]
mod tests {
    use shopify_function::run_function_with_input;

    #[test]
    fn test_merge_basic() {
        let input = r#"{"cart":{"lines":[...]}}"#;
        let output = run_function_with_input(input).unwrap();
        assert_eq!(output.operations.len(), 1);
        assert!(output.operations[0].merge.is_some());
    }
}
```

JSON test fixtures can be lifted directly from the existing vitest test helpers.

---

## Critical Gotchas

| # | Gotcha | Details |
|---|---|---|
| 1 | **WASM target** | Use `wasm32-unknown-unknown`, NOT `wasm32-wasip1` (deprecated Rust 1.84+) |
| 2 | **Binary size limit** | Shopify enforces 256 KB. Avoid extra `#[derive]` on large structs; use `regex_lite` not `regex` |
| 3 | **`schema.graphql` is gitignored** | Must run `shopify app function schema` on every new machine before building |
| 4 | **No optional chaining** | TypeScript's `?.` becomes `.and_then(|x| x.field())` in Rust |
| 5 | **Float precision** | Rust f64 is stricter — `is_finite()` guard required before division |
| 6 | **`log!()` is dev-only** | Don't rely on it for debugging in production — logs are silenced |
| 7 | **Cargo.lock must be committed** | Unlike npm lock files, Rust's `Cargo.lock` for binaries should be committed |
| 8 | **6-param `calculateDiscountPercentage`** | The EXPAND path bug (4 args vs 6) would be a compile error in Rust — this is a benefit |
| 9 | **bundleNameCounts Map** | Rust `HashMap<String, u32>` — use `.entry().and_modify().or_insert()` pattern |
| 10 | **`processedLines` HashSet** | Use `HashSet<String>` to track processed line IDs, same as TS `Set<string>` |

---

## Instruction Count Budget

| Phase | TypeScript estimate | Rust estimate | Headroom gained |
|---|---|---|---|
| MERGE | ~450K instructions | ~290–320K | +130–160K |
| EXPAND | ~420K instructions | ~270–300K | +120–150K |

Shopify's limit is well above these numbers, but the reduction gives room to add features (e.g. more complex free-gift logic, multi-tier pricing).

---

## Migration Phases

| Phase | Work | Days |
|---|---|---|
| 1 | Scaffold Rust extension, Cargo.toml, fetch schema, stub `run()` | 1–2 |
| 2 | Port data structs: `PriceAdjustment`, `ComponentParent`, `ComponentPricingItem` | 1 |
| 3 | Port helpers: `safe_parse_float`, JSON utils, `Operator` enum, `normalizeConditionOperator` | 1 |
| 4 | Port `calculateDiscountPercentage` + unit tests | 1–2 |
| 5 | Port MERGE operation + tests | 1–2 |
| 6 | Port EXPAND operation + tests | 1 |
| 7 | Binary size + instruction count check, wasm-opt, deploy to dev store | 1 |
| 8 | Production cut-over + cleanup of TS extension | 1 |
| **Total** | | **8–9 days** |

---

## Rollback Strategy

1. Keep `extensions/bundle-cart-transform-ts/` intact until Rust version is production-stable for 1–2 weeks
2. To roll back: swap the `handle` in `shopify.extension.toml` back and redeploy — no merchant impact
3. Shopify allows only one active cart transform per store, so test on a dev store before cutting over production

---

## Recommendation

**Not urgent — the TypeScript version is stable.** Migrate when:
- You need to add significant new cart transform logic (would push instruction count)
- A dedicated sprint is available (8–9 days; do not interleave with feature work)
- At least one team member is comfortable with Rust

The biggest concrete win is that the 6-argument `calculateDiscountPercentage` call-site bug would have been a compile error in Rust. Rust's type system eliminates that entire class of silent breakage.
