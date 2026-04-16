use std::collections::HashMap;
use shopify_function::scalars::Decimal;

use crate::helpers::{decimal_to_f64, is_free_gift_line, parse_json_or_default, truncate};
use crate::pricing::calculate_discount_percentage;
use crate::types::{ComponentParent};
use crate::schema;

/// Process all MERGE operations for one cart pass.
///
/// Groups cart lines by _bundle_id (O(n) pass), then for each group builds one
/// MERGE operation using the component_parents metafield for parent variant ID
/// and pricing config.
///
/// # Returns
/// Vec of CartOperation (merge variant), with processed line IDs added to
/// the `processed_line_ids` set for the EXPAND pass to skip.
pub fn process_merge_operations(
    input: &schema::run::Input,
    presentment_currency_rate: f64,
    processed_line_ids: &mut std::collections::HashSet<String>,
) -> Vec<schema::CartOperation> {
    let mut operations: Vec<schema::CartOperation> = Vec::new();

    // Tracks how many times each bundle name appears — duplicate instances get " (2)", " (3)"
    // suffixes to prevent Shopify from consolidating separate bundle instances.
    let mut bundle_name_counts: HashMap<String, u32> = HashMap::new();

    // -------------------------------------------------------------------------
    // Step 1: Group cart lines by _bundle_id in a single O(n) pass.
    // Using indices to avoid borrow conflicts with `lines` slice.
    // -------------------------------------------------------------------------
    let lines = input.cart().lines();
    let mut bundle_groups: HashMap<String, Vec<usize>> = HashMap::new();

    for (idx, line) in lines.iter().enumerate() {
        // bundle_id attribute value is nullable (value: String in schema)
        let bundle_id = match line.bundle_id().and_then(|a| a.value()) {
            Some(v) => v.as_str().to_string(),
            None => continue,
        };
        if bundle_id.is_empty() {
            continue;
        }
        bundle_groups.entry(bundle_id).or_default().push(idx);
    }

    // -------------------------------------------------------------------------
    // Step 2: Build one MERGE operation per bundle group.
    // -------------------------------------------------------------------------
    for (_, line_indices) in &bundle_groups {
        // Find first line with component_parents metafield value.
        let component_parents_json: Option<String> = line_indices.iter().find_map(|&idx| {
            match lines[idx].merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                    v.component_parents()
                        .map(|m| m.value().clone())
                }
                _ => None,
            }
        });

        let Some(cp_json) = component_parents_json else { continue };

        let component_parents: Vec<ComponentParent> =
            parse_json_or_default(Some(&cp_json));
        if component_parents.is_empty() {
            continue;
        }

        let parent = &component_parents[0];
        if parent.id.is_empty() {
            continue;
        }
        let parent_variant_id = parent.id.clone();

        // -------------------------------------------------------------------------
        // Step 3: Compute paid/free-gift totals.
        // -------------------------------------------------------------------------
        let mut paid_total: f64 = 0.0;
        let mut free_gift_total: f64 = 0.0;
        let mut paid_quantity: i64 = 0;
        let mut total_quantity: i64 = 0;

        for &idx in line_indices {
            let line = &lines[idx];
            let line_total = decimal_to_f64(line.cost().total_amount().amount());
            let qty = *line.quantity() as i64;
            total_quantity += qty;
            let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
            if is_free_gift_line(step_type) {
                free_gift_total += line_total;
            } else {
                paid_total += line_total;
                paid_quantity += qty;
            }
        }
        let original_total = paid_total + free_gift_total;

        // -------------------------------------------------------------------------
        // Step 4: Calculate effective discount percentage.
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
            let raw = (1.0 - paid_total / original_total) * 100.0;
            if raw.is_finite() { raw.clamp(0.0, 100.0) } else { 0.0 }
        } else {
            0.0
        };

        // -------------------------------------------------------------------------
        // Step 5: Build unique bundle title.
        // -------------------------------------------------------------------------
        let base_name = lines[line_indices[0]]
            .bundle_name()
            .and_then(|a| a.value())
            .map(|s| s.as_str().to_string())
            .unwrap_or_else(|| "Bundle".to_string());

        let count = bundle_name_counts
            .entry(base_name.clone())
            .and_modify(|c| *c += 1)
            .or_insert(1);
        let bundle_name = if *count > 1 {
            format!("{} ({})", base_name, count)
        } else {
            base_name
        };

        // -------------------------------------------------------------------------
        // Step 6: Build compact component details.
        // Format: [title, qty, retailCents, bundleCents, discountPct, savingsCents]
        // -------------------------------------------------------------------------
        let original_total_cents = (original_total * 100.0).round() as i64;
        let discounted_total_cents =
            (original_total * (1.0 - discount_percentage / 100.0) * 100.0).round() as i64;
        let savings_cents = original_total_cents - discounted_total_cents;

        let mut component_details: Vec<serde_json::Value> = Vec::new();
        for (i, &idx) in line_indices.iter().enumerate() {
            let line = &lines[idx];
            let retail_cents =
                (decimal_to_f64(line.cost().amount_per_quantity().amount()) * 100.0).round() as i64;
            let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
            let is_free_gift = is_free_gift_line(step_type);
            let bundle_cents = if is_free_gift {
                0
            } else {
                (retail_cents as f64 * (1.0 - discount_percentage / 100.0)).round() as i64
            };
            let line_pct = if is_free_gift { 100.0 } else { discount_percentage };
            let title = match lines[idx].merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                    truncate(v.product().title(), 25).to_string()
                }
                _ => format!("Component {}", i + 1),
            };
            component_details.push(serde_json::json!([
                title,
                *line.quantity(),
                retail_cents,
                bundle_cents,
                line_pct,
                retail_cents - bundle_cents
            ]));
        }

        let components_json =
            serde_json::to_string(&component_details).unwrap_or_default();

        // -------------------------------------------------------------------------
        // Step 7: Build MERGE operation using schema-generated types.
        // -------------------------------------------------------------------------
        let cart_lines: Vec<schema::CartLineInput> = line_indices
            .iter()
            .map(|&idx| {
                let line = &lines[idx];
                schema::CartLineInput {
                    cart_line_id: line.id().to_string(),
                    quantity: *line.quantity(),
                }
            })
            .collect();

        let attributes = vec![
            schema::AttributeOutput { key: "_is_bundle_parent".into(),          value: "true".into() },
            schema::AttributeOutput { key: "_bundle_name".into(),               value: bundle_name.clone() },
            schema::AttributeOutput { key: "_bundle_component_count".into(),    value: component_details.len().to_string() },
            schema::AttributeOutput { key: "_bundle_components".into(),         value: components_json },
            schema::AttributeOutput { key: "_bundle_total_retail_cents".into(), value: original_total_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_total_price_cents".into(),  value: discounted_total_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_total_savings_cents".into(),value: savings_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_discount_percent".into(),   value: format!("{:.2}", discount_percentage) },
        ];

        // price is ALWAYS included (even at 0%) so Shopify uses component sum, not parent variant price.
        let price = Some(schema::PriceAdjustment {
            percentage_decrease: Some(schema::PriceAdjustmentValue {
                value: Decimal::from(discount_percentage),
            }),
        });

        let merge_op = schema::MergeOperation {
            cart_lines,
            parent_variant_id,
            title: Some(bundle_name),
            price,
            attributes: Some(attributes),
            image: None,
        };

        operations.push(schema::CartOperation::Merge(merge_op));

        for &idx in line_indices {
            processed_line_ids.insert(lines[idx].id().to_string());
        }
    }

    operations
}
