use std::collections::HashMap;
use shopify_function::prelude::*;

use crate::helpers::{is_free_gift_line, parse_json_or_default, safe_parse_float, truncate};
use crate::pricing::calculate_discount_percentage;
use crate::types::{
    AttributeOutput, CartLineInput, CartOperation, MergeOperation,
    ComponentParent, PercentageDecreaseValue, PriceAdjustmentOutput,
};
use crate::schema;

/// Process all MERGE operations for one cart pass.
///
/// Mirrors the MERGE block in TypeScript cartTransformRun():
/// 1. Group cart lines by _bundle_id in one O(n) pass
/// 2. For each group, find component_parents metafield to get parent variant ID + pricing
/// 3. Calculate discount via calculate_discount_percentage (free-gift lines separated)
/// 4. Append a "(N)" suffix to bundle name when the same name appears multiple times
///    — prevents Shopify from consolidating two separate bundle instances
/// 5. Build compact component details tuple and attribute set for checkout UI
///
/// # Returns
/// - Vec<CartOperation> — one MERGE per bundle group found
/// - HashSet<String> populated with the IDs of all processed cart lines
pub fn process_merge_operations(
    input: &schema::run::Input,
    presentment_currency_rate: f64,
    processed_line_ids: &mut std::collections::HashSet<String>,
) -> Vec<CartOperation> {
    let mut operations: Vec<CartOperation> = Vec::new();

    // Track how many times each bundle name is used for unique MERGE titles.
    // Shopify consolidates MERGE results with same parentVariantId + title —
    // unique titles keep separate bundle instances apart.
    let mut bundle_name_counts: HashMap<String, u32> = HashMap::new();

    // -------------------------------------------------------------------------
    // Step 1: Group all cart lines by _bundle_id in a single O(n) pass.
    // Pre-grouping avoids repeated full-cart scans that caused
    // InstructionCountLimitExceededError in the original implementation.
    // -------------------------------------------------------------------------
    let mut bundle_groups: HashMap<String, Vec<usize>> = HashMap::new();
    let lines = input.cart().lines();

    for (idx, line) in lines.iter().enumerate() {
        let bundle_id = line
            .bundle_id()
            .and_then(|a| a.value())
            .unwrap_or_default();
        if bundle_id.is_empty() {
            continue;
        }
        bundle_groups
            .entry(bundle_id.to_string())
            .or_default()
            .push(idx);
    }

    // -------------------------------------------------------------------------
    // Step 2: For each bundle group, build one MERGE operation.
    // -------------------------------------------------------------------------
    for (bundle_id, line_indices) in &bundle_groups {
        // Find first line in this group that has a component_parents metafield value.
        let component_parents_json: Option<&str> = line_indices.iter().find_map(|&idx| {
            let line = &lines[idx];
            match line.merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                    v.component_parents().and_then(|m| m.value())
                }
                _ => None,
            }
        });

        let Some(component_parents_json) = component_parents_json else {
            // No component_parents metafield in this group — skip (not a bundle group).
            continue;
        };

        let component_parents: Vec<ComponentParent> =
            parse_json_or_default(Some(component_parents_json));
        if component_parents.is_empty() {
            continue;
        }

        let parent = &component_parents[0];
        let parent_variant_id = parent.id.clone();
        if parent_variant_id.is_empty() {
            continue;
        }

        // -------------------------------------------------------------------------
        // Step 3: Calculate bundle totals, separating free-gift lines from paid lines.
        // -------------------------------------------------------------------------
        let mut paid_total: f64 = 0.0;
        let mut free_gift_total: f64 = 0.0;
        let mut paid_quantity: i64 = 0;
        let mut total_quantity: i64 = 0;

        for &idx in line_indices {
            let line = &lines[idx];
            let line_total = safe_parse_float(
                Some(line.cost().total_amount().amount()),
            );
            total_quantity += line.quantity();
            let step_type = line.step_type().and_then(|a| a.value());
            if is_free_gift_line(step_type) {
                free_gift_total += line_total;
            } else {
                paid_total += line_total;
                paid_quantity += line.quantity();
            }
        }
        let original_total = paid_total + free_gift_total;

        // -------------------------------------------------------------------------
        // Step 4: Compute effective discount percentage.
        // -------------------------------------------------------------------------
        let discount_percentage = if let Some(ref pa) = parent.price_adjustment {
            calculate_discount_percentage(
                pa,
                paid_total,
                original_total,
                total_quantity,
                paid_quantity,
                presentment_currency_rate,
            )
        } else if free_gift_total > 0.0 && original_total > 0.0 {
            // No pricing rule, but free-gift lines exist.
            // Absorb their cost so customers pay only for paid items.
            let raw = (1.0 - paid_total / original_total) * 100.0;
            if raw.is_finite() { raw.clamp(0.0, 100.0) } else { 0.0 }
        } else {
            0.0
        };

        // -------------------------------------------------------------------------
        // Step 5: Build unique bundle title.
        // -------------------------------------------------------------------------
        let first_line = &lines[line_indices[0]];
        let base_name = first_line
            .bundle_name()
            .and_then(|a| a.value())
            .unwrap_or("Bundle");

        let count = bundle_name_counts
            .entry(base_name.to_string())
            .and_modify(|c| *c += 1)
            .or_insert(1);
        let bundle_name = if *count > 1 {
            format!("{} ({})", base_name, count)
        } else {
            base_name.to_string()
        };

        // -------------------------------------------------------------------------
        // Step 6: Build compact component details tuple array.
        //
        // Format: [title, qty, retailCents, bundleCents, discountPct, savingsCents]
        // Compact because the JSON must fit within Shopify's ~255-char attribute limit.
        // -------------------------------------------------------------------------
        let original_total_cents = (original_total * 100.0).round() as i64;
        let discounted_total_cents =
            (original_total * (1.0 - discount_percentage / 100.0) * 100.0).round() as i64;
        let savings_cents = original_total_cents - discounted_total_cents;

        let mut component_details: Vec<serde_json::Value> = Vec::new();
        for (i, &idx) in line_indices.iter().enumerate() {
            let line = &lines[idx];
            let retail_cents =
                (safe_parse_float(Some(line.cost().amount_per_quantity().amount())) * 100.0)
                    .round() as i64;
            let step_type = line.step_type().and_then(|a| a.value());
            let is_free_gift = is_free_gift_line(step_type);
            let bundle_cents = if is_free_gift {
                0
            } else {
                (retail_cents as f64 * (1.0 - discount_percentage / 100.0)).round() as i64
            };
            let line_pct = if is_free_gift { 100.0 } else { discount_percentage };
            let title = match line.merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                    v.product()
                        .and_then(|p| Some(truncate(p.title(), 25).to_string()))
                        .unwrap_or_else(|| format!("Component {}", i + 1))
                }
                _ => format!("Component {}", i + 1),
            };
            component_details.push(serde_json::json!([
                title,
                line.quantity(),
                retail_cents,
                bundle_cents,
                line_pct,
                retail_cents - bundle_cents
            ]));
        }

        let components_json =
            serde_json::to_string(&component_details).unwrap_or_default();

        // -------------------------------------------------------------------------
        // Step 7: Build MERGE operation.
        //
        // The price field is ALWAYS included (even when discount = 0%).
        // Without it, Shopify would use the parent variant's own price ($0 for
        // container products), not the sum of component prices.
        // -------------------------------------------------------------------------
        let cart_lines: Vec<CartLineInput> = line_indices
            .iter()
            .map(|&idx| {
                let line = &lines[idx];
                CartLineInput {
                    cart_line_id: line.id().to_string(),
                    quantity: line.quantity(),
                }
            })
            .collect();

        let merge_op = MergeOperation {
            cart_lines,
            parent_variant_id,
            title: bundle_name.clone(),
            price: PriceAdjustmentOutput {
                percentage_decrease: PercentageDecreaseValue {
                    value: format!("{:.2}", discount_percentage),
                },
            },
            attributes: vec![
                AttributeOutput { key: "_is_bundle_parent".into(),         value: "true".into() },
                AttributeOutput { key: "_bundle_name".into(),              value: bundle_name },
                AttributeOutput { key: "_bundle_component_count".into(),   value: component_details.len().to_string() },
                AttributeOutput { key: "_bundle_components".into(),        value: components_json },
                AttributeOutput { key: "_bundle_total_retail_cents".into(),value: original_total_cents.to_string() },
                AttributeOutput { key: "_bundle_total_price_cents".into(), value: discounted_total_cents.to_string() },
                AttributeOutput { key: "_bundle_total_savings_cents".into(),value: savings_cents.to_string() },
                AttributeOutput { key: "_bundle_discount_percent".into(),  value: format!("{:.2}", discount_percentage) },
            ],
        };

        operations.push(CartOperation::merge(merge_op));

        // Mark all lines in this group as processed (skip in EXPAND pass).
        for &idx in line_indices {
            processed_line_ids.insert(lines[idx].id().to_string());
        }
    }

    operations
}
