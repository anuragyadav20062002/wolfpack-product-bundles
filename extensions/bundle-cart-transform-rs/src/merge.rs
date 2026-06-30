use shopify_function::scalars::Decimal;
use std::collections::HashMap;

use crate::helpers::{
    decimal_to_f64, is_addon_line, is_free_gift_line, parse_json_or_default,
};
use crate::pricing::{
    calculate_buy_x_get_y_discount_percentage, calculate_discount_percentage,
    rounded_percentage,
};
use crate::schema;
use crate::types::{CartLineMessagingSettings, ComponentParent, PricingMethod};

fn parent_match_count(parent: &ComponentParent, group_variant_ids: &[String]) -> usize {
    let Some(component_reference) = &parent.component_reference else {
        return 0;
    };

    group_variant_ids
        .iter()
        .filter(|variant_id| {
            component_reference
                .value
                .iter()
                .any(|ref_id| ref_id == *variant_id)
        })
        .count()
}

fn select_component_parent<'a>(
    component_parents: &'a [ComponentParent],
    group_variant_ids: &[String],
) -> Option<&'a ComponentParent> {
    component_parents
        .iter()
        .filter(|parent| !parent.id.is_empty())
        .max_by_key(|parent| parent_match_count(parent, group_variant_ids))
        .or_else(|| {
            component_parents
                .iter()
                .find(|parent| !parent.id.is_empty())
        })
}

fn non_empty(value: &Option<String>) -> Option<String> {
    value
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string())
}

/// Process all MERGE operations for one cart pass.
///
fn easy_bundle_offer_group_id(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    let Some((base, item_index)) = trimmed.rsplit_once('_') else {
        return Some(trimmed.to_string());
    };

    if base.is_empty() || item_index.is_empty() {
        return None;
    }

    Some(base.to_string())
}

/// Groups cart lines by EB `_easyBundle:OfferId` base (O(n) pass), then for each group builds one
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
    cart_line_messaging: &CartLineMessagingSettings,
) -> Vec<schema::CartOperation> {
    let mut operations: Vec<schema::CartOperation> = Vec::new();

    // Tracks how many times each bundle name appears — duplicate instances get " (2)", " (3)"
    // suffixes to prevent Shopify from consolidating separate bundle instances.
    let mut bundle_name_counts: HashMap<String, u32> = HashMap::new();

    // -------------------------------------------------------------------------
    // Step 1: Group cart lines by EB `_easyBundle:OfferId` base in a single O(n) pass.
    // Using indices to avoid borrow conflicts with `lines` slice.
    // -------------------------------------------------------------------------
    let lines = input.cart().lines();
    let mut bundle_groups: HashMap<String, Vec<usize>> = HashMap::new();

    for (idx, line) in lines.iter().enumerate() {
        let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
        if step_type == Some("gift_message") {
            continue;
        }

        let offer_group_id = match line
            .easy_bundle_offer_id()
            .and_then(|a| a.value())
            .and_then(|value| easy_bundle_offer_group_id(value.as_str()))
        {
            Some(v) => v,
            None => continue,
        };
        bundle_groups.entry(offer_group_id).or_default().push(idx);
    }

    // -------------------------------------------------------------------------
    // Step 2: Build one MERGE operation per bundle group.
    // -------------------------------------------------------------------------
    for (_, line_indices) in &bundle_groups {
        let mut bundle_addon_offer_id: Option<String> = None;
        let merge_line_indices: Vec<usize> = line_indices
            .iter()
            .copied()
            .filter(|&idx| {
                let step_type = lines[idx]
                    .step_type()
                    .and_then(|a| a.value())
                    .map(|s| s.as_str());
                !is_addon_line(step_type)
            })
            .collect();
        let addon_line_indices: Vec<usize> = line_indices
            .iter()
            .copied()
            .filter(|&idx| {
                let step_type = lines[idx]
                    .step_type()
                    .and_then(|a| a.value())
                    .map(|s| s.as_str());
                is_addon_line(step_type)
            })
            .collect();

        if merge_line_indices.is_empty() {
            continue;
        }

        // Find first line with component_parents metafield value.
        let component_parents_json: Option<String> =
            merge_line_indices
                .iter()
                .find_map(|&idx| match lines[idx].merchandise() {
                    schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                        v.component_parents().map(|m| m.value().clone())
                    }
                    _ => None,
                });

        let Some(cp_json) = component_parents_json else {
            continue;
        };

        let component_parents: Vec<ComponentParent> = parse_json_or_default(Some(&cp_json));
        if component_parents.is_empty() {
            continue;
        }

        let group_variant_ids: Vec<String> = merge_line_indices
            .iter()
            .filter_map(|&idx| match lines[idx].merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                    Some(v.id().to_string())
                }
                _ => None,
            })
            .collect();

        let Some(parent) = select_component_parent(&component_parents, &group_variant_ids) else {
            continue;
        };
        let parent_variant_id = parent.id.clone();

        // -------------------------------------------------------------------------
        // Step 3: Compute paid/free-gift totals.
        // -------------------------------------------------------------------------
        let mut paid_total: f64 = 0.0;
        let mut free_gift_total: f64 = 0.0;
        let mut paid_quantity: i64 = 0;
        let mut total_quantity: i64 = 0;
        let mut paid_unit_prices: Vec<f64> = Vec::new();

        for &idx in &merge_line_indices {
            let line = &lines[idx];
            let qty = *line.quantity() as i64;
            let unit_price = decimal_to_f64(line.cost().amount_per_quantity().amount());
            let line_total = unit_price * (qty as f64);
            total_quantity += qty;
            let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
            if bundle_addon_offer_id.is_none() {
                if let Some(value) = line.addon_offer_id().and_then(|a| a.value()) {
                    let normalized = value.trim();
                    if !normalized.is_empty() {
                        bundle_addon_offer_id = Some(normalized.to_string());
                    }
                }
            }
            if is_free_gift_line(step_type) {
                free_gift_total += line_total;
            } else {
                paid_total += line_total;
                paid_quantity += qty;
                for _ in 0..qty.max(0) {
                    paid_unit_prices.push(unit_price);
                }
            }
        }
        let original_total = paid_total + free_gift_total;

        // -------------------------------------------------------------------------
        // Step 4: Calculate effective discount percentage.
        // -------------------------------------------------------------------------
        let paid_discount_percentage = if let Some(ref pa) = parent.price_adjustment {
            if pa.method == PricingMethod::BuyXGetY {
                calculate_buy_x_get_y_discount_percentage(
                    pa,
                    &paid_unit_prices,
                    paid_total,
                    paid_total,
                    paid_quantity,
                    presentment_currency_rate,
                )
            } else {
                calculate_discount_percentage(
                    pa,
                    paid_total,
                    paid_total,
                    total_quantity,
                    paid_quantity,
                    presentment_currency_rate,
                )
            }
        } else {
            0.0
        };

        let paid_discount_amount = paid_total * paid_discount_percentage / 100.0;
        let total_discount_amount = (paid_discount_amount + free_gift_total).min(original_total);
        let discount_percentage = if total_discount_amount > 0.0 && original_total > 0.0 {
            rounded_percentage(total_discount_amount, original_total)
        } else {
            0.0
        };

        // -------------------------------------------------------------------------
        // Step 5: Build unique bundle title.
        // -------------------------------------------------------------------------
        let base_name = lines[line_indices[0]]
            .easy_bundle_name()
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
        let mut component_details: Vec<serde_json::Value> = Vec::new();
        let mut total_retail_cents: i64 = 0;
        let mut total_bundle_cents: i64 = 0;
        for (i, &idx) in merge_line_indices.iter().enumerate() {
            let line = &lines[idx];
            let qty = *line.quantity() as i64;
            let retail_cents =
                (decimal_to_f64(line.cost().amount_per_quantity().amount()) * 100.0).round() as i64;
            let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
            let is_free_gift = is_free_gift_line(step_type);
            let paid_bundle_cents =
                (retail_cents as f64 * (1.0 - paid_discount_percentage / 100.0)).round() as i64;
            let line_bundle_cents_total = if is_free_gift {
                0
            } else {
                (paid_bundle_cents * qty).max(0)
            };
            let bundle_cents = if qty > 0 {
                (line_bundle_cents_total as f64 / qty as f64).round() as i64
            } else {
                0
            };
            let line_pct = if is_free_gift {
                100.0
            } else if retail_cents > 0 {
                rounded_percentage((retail_cents - bundle_cents) as f64, retail_cents as f64)
            } else {
                0.0
            };
            total_retail_cents += retail_cents * qty;
            total_bundle_cents += line_bundle_cents_total;
            let title = match lines[idx].merchandise() {
                schema::run::input::cart::lines::Merchandise::ProductVariant(_) => {
                    format!("Component {}", i + 1)
                }
                _ => format!("Component {}", i + 1),
            };
            component_details.push(serde_json::json!([
                title,
                qty,
                retail_cents,
                bundle_cents,
                line_pct,
                retail_cents - bundle_cents,
                ""
            ]));
        }

        let original_total_cents = total_retail_cents;
        let discounted_total_cents = total_bundle_cents;
        let savings_cents = original_total_cents - discounted_total_cents;

        let components_json = serde_json::to_string(&component_details).unwrap_or_default();

        // -------------------------------------------------------------------------
        // Step 7: Build MERGE operation using schema-generated types.
        // -------------------------------------------------------------------------
        let cart_lines: Vec<schema::CartLineInput> = merge_line_indices
            .iter()
            .map(|&idx| {
                let line = &lines[idx];
                schema::CartLineInput {
                    cart_line_id: line.id().to_string(),
                    quantity: *line.quantity(),
                }
            })
            .collect();

        let mut attributes = vec![
            schema::AttributeOutput {
                key: "_is_bundle_parent".into(),
                value: "true".into(),
            },
            schema::AttributeOutput {
                key: "_bundle_name".into(),
                value: bundle_name.clone(),
            },
            schema::AttributeOutput {
                key: "_bundle_component_count".into(),
                value: component_details.len().to_string(),
            },
            schema::AttributeOutput {
                key: "_bundle_components".into(),
                value: components_json,
            },
            schema::AttributeOutput {
                key: "_bundle_total_retail_cents".into(),
                value: original_total_cents.to_string(),
            },
            schema::AttributeOutput {
                key: "_bundle_total_price_cents".into(),
                value: discounted_total_cents.to_string(),
            },
            schema::AttributeOutput {
                key: "_bundle_total_savings_cents".into(),
                value: savings_cents.to_string(),
            },
            schema::AttributeOutput {
                key: "_bundle_discount_percent".into(),
                value: format!("{:.2}", discount_percentage),
            },
        ];
        if let Some(addon_offer_id) = bundle_addon_offer_id {
            attributes.push(schema::AttributeOutput {
                key: "_addon_offer_id".into(),
                value: addon_offer_id,
            });
        }

        let source_display_properties: crate::types::CartLineDisplayProperties =
            parse_json_or_default(merge_line_indices.iter().find_map(|&idx| {
                lines[idx]
                    .bundle_display_properties()
                    .and_then(|attribute| attribute.value())
                    .map(|value| value.as_str())
            }));

        attributes.push(schema::AttributeOutput {
            key: "_Items".into(),
            value: "".into(),
        });
        attributes.push(schema::AttributeOutput {
            key: "Box".into(),
            value: non_empty(&source_display_properties.box_label)
                .unwrap_or_else(|| "1".to_string()),
        });

        if cart_line_messaging.is_enabled {
            let source_items = non_empty(&source_display_properties.items);
            let source_retail_price = non_empty(&source_display_properties.retail_price);
            let source_you_save = non_empty(&source_display_properties.you_save.amount_percentage);
            let source_you_save_amount = non_empty(&source_display_properties.you_save.amount);
            let source_you_save_percentage =
                non_empty(&source_display_properties.you_save.percentage);

            if cart_line_messaging.show_bundle_contains {
                if let Some(value) = source_items {
                    attributes.push(schema::AttributeOutput {
                        key: "Items".into(),
                        value,
                    });
                }
            }

            if cart_line_messaging.show_original_price {
                if let Some(value) = source_retail_price {
                    attributes.push(schema::AttributeOutput {
                        key: "Retail Price".into(),
                        value,
                    });
                }
            }

            if cart_line_messaging.discount_display.is_enabled {
                if let Some(value) = select_you_save_value(
                    &cart_line_messaging.discount_display.format,
                    source_you_save,
                    source_you_save_amount,
                    source_you_save_percentage,
                ) {
                    attributes.push(schema::AttributeOutput {
                        key: "You Save".into(),
                        value,
                    });
                }
            }
        }

        // price is ALWAYS included (even at 0%) so Shopify uses component sum, not parent variant price.
        let price = Some(schema::PriceAdjustment {
            percentage_decrease: Some(schema::PriceAdjustmentValue {
                value: Decimal::from(discount_percentage),
            }),
        });

        let merge_op = schema::LinesMergeOperation {
            cart_lines,
            parent_variant_id,
            title: Some(bundle_name),
            price,
            attributes: Some(attributes),
            image: None,
        };

        operations.push(schema::CartOperation::LinesMerge(merge_op));

        for &idx in &addon_line_indices {
            processed_line_ids.insert(lines[idx].id().to_string());
        }

        for &idx in &merge_line_indices {
            processed_line_ids.insert(lines[idx].id().to_string());
        }
    }

    operations
}

fn select_you_save_value(
    format: &str,
    combined: Option<String>,
    amount: Option<String>,
    percentage: Option<String>,
) -> Option<String> {
    match format {
        "amount" => amount.or(combined),
        "percentage" => percentage.or(combined),
        _ => combined.or_else(|| match (amount, percentage) {
            (Some(amount), Some(percentage)) => Some(format!("{amount} ({percentage})")),
            (Some(amount), None) => Some(amount),
            (None, Some(percentage)) => Some(percentage),
            (None, None) => None,
        }),
    }
}
