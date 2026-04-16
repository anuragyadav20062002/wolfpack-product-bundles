use std::collections::{HashMap, HashSet};
use shopify_function::prelude::*;

use crate::helpers::{parse_json_or_default, safe_parse_float};
use crate::pricing::calculate_discount_percentage;
use crate::types::{
    AttributeOutput, CartOperation, ComponentPricingItem, ExpandedCartItem,
    ExpandOperation, PriceAdjustmentConfig, PriceAdjustmentOutput,
    PercentageDecreaseValue,
};
use crate::schema;

/// Process all EXPAND operations for one cart pass.
///
/// Mirrors the EXPAND block in TypeScript cartTransformRun().
///
/// FLEX BUNDLES PATTERN — this is NOT a traditional EXPAND:
/// The EXPAND keeps the SAME bundle variant in the cart (merchandiseId = line.merchandise.id).
/// It does NOT split the bundle into individual component lines. Instead, component data
/// is stored in line attributes so the Checkout UI extension can display the breakdown.
///
/// When to fire an EXPAND:
/// - Line has NOT already been processed by the MERGE pass
/// - Line's merchandise variant has `component_reference` AND `component_quantities` metafields
///   (these mark it as a bundle parent for the Flex Bundles path)
///
/// # Parameters
/// - `processed_line_ids` — set of line IDs already handled by the MERGE pass (skip these)
/// - `presentment_currency_rate` — for amount-based discount conversion
pub fn process_expand_operations(
    input: &schema::run::Input,
    processed_line_ids: &HashSet<String>,
    presentment_currency_rate: f64,
) -> Vec<CartOperation> {
    let mut operations: Vec<CartOperation> = Vec::new();
    let lines = input.cart().lines();

    for line in lines.iter() {
        // Skip lines already consumed by the MERGE pass.
        if processed_line_ids.contains(line.id()) {
            continue;
        }

        // Get component_reference and component_quantities — both required.
        let (component_reference_json, component_quantities_json) = match line.merchandise() {
            schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                let cr = v.component_reference().and_then(|m| m.value());
                let cq = v.component_quantities().and_then(|m| m.value());
                (cr, cq)
            }
            _ => (None, None),
        };

        let (Some(cr_json), Some(cq_json)) = (component_reference_json, component_quantities_json)
        else {
            continue;
        };

        let component_references: Vec<String> = parse_json_or_default(Some(cr_json));
        let component_quantities: Vec<i64>  = parse_json_or_default(Some(cq_json));

        if component_references.is_empty()
            || component_quantities.is_empty()
            || component_references.len() != component_quantities.len()
        {
            continue;
        }

        // -------------------------------------------------------------------------
        // Parse component_pricing metafield → map variantId → ComponentPricingItem.
        // -------------------------------------------------------------------------
        let component_pricing_json: Option<&str> = match line.merchandise() {
            schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                v.component_pricing().and_then(|m| m.value())
            }
            _ => None,
        };

        let component_pricing: Vec<ComponentPricingItem> =
            parse_json_or_default(component_pricing_json);

        let pricing_map: HashMap<&str, &ComponentPricingItem> = component_pricing
            .iter()
            .map(|item| (item.variant_id.as_str(), item))
            .collect();

        // -------------------------------------------------------------------------
        // Compute totals for discount calculation.
        // -------------------------------------------------------------------------
        let total_quantity: i64 = component_quantities.iter().sum::<i64>() * line.quantity();
        let original_total = safe_parse_float(Some(line.cost().total_amount().amount()));

        // Get price_adjustment from the bundle parent variant metafield.
        let price_adjustment_json: Option<&str> = match line.merchandise() {
            schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                v.price_adjustment().and_then(|m| m.value())
            }
            _ => None,
        };

        let discount_percentage = if let Some(pa_json) = price_adjustment_json {
            let pa: PriceAdjustmentConfig = parse_json_or_default(Some(pa_json));
            calculate_discount_percentage(
                &pa,
                original_total,  // paid_total (EXPAND has no free-gift lines)
                original_total,  // original_total (same — no free gifts)
                total_quantity,
                total_quantity,  // paid_quantity == total_quantity
                presentment_currency_rate,
            )
        } else {
            0.0
        };

        // -------------------------------------------------------------------------
        // Build compact component details.
        //
        // Rule: if ANY component is missing pricing, clear the entire breakdown.
        // The Checkout UI extension falls back to "Bundle (N items)" view.
        // Showing partial data is worse than showing nothing.
        // -------------------------------------------------------------------------
        let mut total_retail_cents: i64 = 0;
        let mut total_bundle_cents: i64 = 0;
        let mut total_savings_cents: i64 = 0;
        let mut component_details: Vec<serde_json::Value> = Vec::new();
        let mut has_missing_pricing = false;

        for (i, variant_id) in component_references.iter().enumerate() {
            let qty = component_quantities[i] * line.quantity();
            if let Some(pricing) = pricing_map.get(variant_id.as_str()) {
                total_retail_cents  += pricing.retail_price  * qty;
                total_bundle_cents  += pricing.bundle_price  * qty;
                total_savings_cents += pricing.savings_amount * qty;

                let title = pricing
                    .title
                    .as_deref()
                    .unwrap_or(&format!("Component {}", i + 1));
                let title_truncated = if title.len() > 25 { &title[..25] } else { title };

                component_details.push(serde_json::json!([
                    title_truncated,
                    qty,
                    pricing.retail_price,
                    pricing.bundle_price,
                    pricing.discount_percent,
                    pricing.savings_amount
                ]));
            } else {
                has_missing_pricing = true;
            }
        }

        if has_missing_pricing {
            component_details.clear();
            total_retail_cents  = 0;
            total_bundle_cents  = 0;
            total_savings_cents = 0;
        }

        let components_json =
            serde_json::to_string(&component_details).unwrap_or_default();

        let bundle_name = line
            .bundle_name()
            .and_then(|a| a.value())
            .unwrap_or("Bundle");

        // -------------------------------------------------------------------------
        // Get bundle parent merchandise ID (same variant — Flex Bundle pattern).
        // -------------------------------------------------------------------------
        let merchandise_id = match line.merchandise() {
            schema::run::input::cart::lines::Merchandise::ProductVariant(v) => {
                v.id().to_string()
            }
            _ => continue,
        };

        // Price field: only include when discount > 0 (matches TS spread pattern).
        let price: Option<PriceAdjustmentOutput> = if discount_percentage > 0.0 {
            Some(PriceAdjustmentOutput {
                percentage_decrease: PercentageDecreaseValue {
                    value: format!("{:.2}", discount_percentage),
                },
            })
        } else {
            None
        };

        let expand_op = ExpandOperation {
            cart_line_id: line.id().to_string(),
            expanded_cart_items: vec![ExpandedCartItem {
                // Flex Bundle: keep the SAME bundle variant, not individual components.
                merchandise_id,
                quantity: line.quantity(),
                attributes: vec![
                    AttributeOutput { key: "_is_bundle_parent".into(),          value: "true".into() },
                    AttributeOutput { key: "_bundle_name".into(),               value: bundle_name.to_string() },
                    AttributeOutput { key: "_bundle_component_count".into(),    value: component_details.len().to_string() },
                    AttributeOutput { key: "_bundle_components".into(),         value: components_json },
                    AttributeOutput { key: "_bundle_total_retail_cents".into(), value: total_retail_cents.to_string() },
                    AttributeOutput { key: "_bundle_total_price_cents".into(),  value: total_bundle_cents.to_string() },
                    AttributeOutput { key: "_bundle_total_savings_cents".into(),value: total_savings_cents.to_string() },
                    AttributeOutput { key: "_bundle_discount_percent".into(),   value: format!("{:.2}", discount_percentage) },
                ],
            }],
            price,
        };

        operations.push(CartOperation::expand(expand_op));
    }

    operations
}
