use std::collections::HashSet;
use shopify_function::prelude::*;
use shopify_function::Result;

use crate::schema;
use crate::helpers::{decimal_to_f64, parse_json_or_default};
use crate::merge::process_merge_operations;
use crate::expand::process_expand_operations;
use crate::types::CartLineMessagingSettings;

/// Inner cart transform logic — called by the #[shopify_function] wrapper and
/// directly by integration tests via run_function_with_input(cart_transform_run, json).
pub fn cart_transform_run(input: schema::run::Input) -> Result<schema::FunctionRunResult> {
    if input.cart().lines().is_empty() {
        return Ok(schema::FunctionRunResult { operations: vec![] });
    }

    // presentmentCurrencyRate is Decimal! — convert to f64 once.
    // Returns 0.0 if non-finite or <= 0 so amount-based discount paths bail out cleanly.
    let rate = decimal_to_f64(input.presentment_currency_rate());
    let presentment_currency_rate = if rate.is_finite() && rate > 0.0 { rate } else { 0.0 };

    let mut processed_line_ids: HashSet<String> = HashSet::new();
    let cart_line_messaging: CartLineMessagingSettings = parse_json_or_default(
        input
            .cart_transform()
            .bundle_cart_line_messaging()
            .map(|metafield| metafield.value().as_str()),
    );

    // Pass 1: MERGE — component lines grouped by EB `_easyBundle:OfferId`
    let mut operations = process_merge_operations(
        &input,
        presentment_currency_rate,
        &mut processed_line_ids,
        &cart_line_messaging,
    );

    // Pass 2: EXPAND — Flex Bundle parent variants (skips MERGE-processed lines)
    operations.extend(process_expand_operations(
        &input,
        &processed_line_ids,
        presentment_currency_rate,
    ));

    Ok(schema::FunctionRunResult { operations })
}

/// WASM export — thin wrapper so #[shopify_function] can generate the export
/// while keeping cart_transform_run directly testable.
#[shopify_function]
fn run(input: schema::run::Input) -> Result<schema::FunctionRunResult> {
    cart_transform_run(input)
}
