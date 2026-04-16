use std::collections::HashSet;
use shopify_function::prelude::*;
use shopify_function::Result;

use crate::schema;
use crate::types::FunctionRunResult;
use crate::merge::process_merge_operations;
use crate::expand::process_expand_operations;

/// Cart transform entry point.
///
/// Orchestrates MERGE and EXPAND operations in two passes over the cart:
///
/// Pass 1 — MERGE: Groups component lines by `_bundle_id` and merges them
/// into a single parent line. Processes classic "add-to-cart" bundles where
/// the widget adds individual component products with a shared `_bundle_id`
/// attribute. All processed line IDs are recorded to skip in Pass 2.
///
/// Pass 2 — EXPAND: Handles "Flex Bundle" parent variants that have
/// `component_reference` + `component_quantities` metafields. The expand
/// keeps the SAME bundle variant in the cart (not a real component expansion)
/// and stores component pricing data in attributes for the Checkout UI.
///
/// # Error handling
/// Rust panics in WASM are stripped by wasm-snip. We use `.unwrap_or_default()`
/// for non-fatal parse failures. The only Result<> we propagate is from
/// #[shopify_function] itself which handles I/O.
#[shopify_function]
fn run(input: schema::run::Input) -> Result<FunctionRunResult> {
    // Guard: empty cart — return immediately with no operations.
    if input.cart().lines().is_empty() {
        return Ok(FunctionRunResult { operations: vec![] });
    }

    // Extract presentment currency rate once — used by all discount calculations.
    // Falls back to 0 if absent or non-finite; amount-based discounts will return 0
    // rather than silently applying a wrong rate.
    let presentment_currency_rate = input
        .presentment_currency_rate()
        .filter(|r| r.is_finite() && *r > 0.0)
        .unwrap_or(0.0);

    let mut processed_line_ids: HashSet<String> = HashSet::new();

    // Pass 1: MERGE operations
    let mut operations = process_merge_operations(
        &input,
        presentment_currency_rate,
        &mut processed_line_ids,
    );

    // Pass 2: EXPAND operations (skip lines already handled by MERGE)
    operations.extend(process_expand_operations(
        &input,
        &processed_line_ids,
        presentment_currency_rate,
    ));

    log!("cart transform complete: {} operations", operations.len());

    Ok(FunctionRunResult { operations })
}
