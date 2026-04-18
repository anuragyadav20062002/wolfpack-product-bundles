use std::collections::{HashMap, HashSet};
use shopify_function::scalars::Decimal;

use crate::helpers::{decimal_to_f64, parse_json_or_default};
use crate::pricing::calculate_discount_percentage;
use crate::types::{ComponentPricingItem, PriceAdjustmentConfig};
use crate::schema;

/// Process all EXPAND operations for one cart pass.
///
/// FLEX BUNDLES PATTERN: keeps the SAME bundle variant (merchandiseId = input line's variant).
/// Does NOT expand to individual component products.
/// Component pricing data is stored in attributes for the Checkout UI extension.
///
/// Triggered when:
/// - Line NOT already processed by MERGE pass
/// - Line's variant has `component_reference` + `component_quantities` metafields
pub fn process_expand_operations(
    input: &schema::run::Input,
    processed_line_ids: &HashSet<String>,
    presentment_currency_rate: f64,
) -> Vec<schema::CartOperation> {
    let mut operations: Vec<schema::CartOperation> = Vec::new();
    let lines = input.cart().lines();

    for line in lines.iter() {
        if processed_line_ids.contains(line.id()) {
            continue;
        }

        // Both component_reference and component_quantities are required.
        let variant = match line.merchandise() {
            schema::run::input::cart::lines::Merchandise::ProductVariant(v) => v,
            _ => continue,
        };

        let cr_json = match variant.component_reference() {
            Some(m) => m.value().clone(),
            None => continue,
        };
        let cq_json = match variant.component_quantities() {
            Some(m) => m.value().clone(),
            None => continue,
        };

        let component_references: Vec<String> = parse_json_or_default(Some(&cr_json));
        let component_quantities: Vec<i64>    = parse_json_or_default(Some(&cq_json));

        if component_references.is_empty()
            || component_quantities.is_empty()
            || component_references.len() != component_quantities.len()
        {
            continue;
        }

        // -------------------------------------------------------------------------
        // Parse component_pricing → HashMap for O(1) lookup.
        // -------------------------------------------------------------------------
        let cp_json: Option<String> = variant
            .component_pricing()
            .map(|m| m.value().clone());

        let component_pricing: Vec<ComponentPricingItem> =
            parse_json_or_default(cp_json.as_deref());

        let pricing_map: HashMap<&str, &ComponentPricingItem> = component_pricing
            .iter()
            .map(|item| (item.variant_id.as_str(), item))
            .collect();

        // -------------------------------------------------------------------------
        // Compute discount percentage.
        // -------------------------------------------------------------------------
        let total_quantity: i64 =
            component_quantities.iter().sum::<i64>() * (*line.quantity() as i64);
        let original_total = decimal_to_f64(line.cost().total_amount().amount());

        let discount_percentage = variant
            .price_adjustment()
            .map(|m| m.value().clone())
            .and_then(|pa_json| serde_json::from_str::<PriceAdjustmentConfig>(&pa_json).ok())
            .map(|pa| {
                calculate_discount_percentage(
                    &pa,
                    original_total,
                    original_total,
                    total_quantity,
                    total_quantity,
                    presentment_currency_rate,
                )
            })
            .unwrap_or(0.0);

        // -------------------------------------------------------------------------
        // Build component details.
        // Zero-tolerance: if ANY component is missing pricing, clear entire breakdown.
        // -------------------------------------------------------------------------
        let mut total_retail_cents: i64 = 0;
        let mut total_bundle_cents: i64 = 0;
        let mut total_savings_cents: i64 = 0;
        let mut component_details: Vec<serde_json::Value> = Vec::new();
        let mut has_missing_pricing = false;

        for (i, variant_id) in component_references.iter().enumerate() {
            let qty = component_quantities[i] * (*line.quantity() as i64);
            if let Some(pricing) = pricing_map.get(variant_id.as_str()) {
                total_retail_cents  += pricing.retail_price  * qty;
                total_bundle_cents  += pricing.bundle_price  * qty;
                total_savings_cents += pricing.savings_amount * qty;

                let fallback = format!("Component {}", i + 1);
                let title = pricing.title.as_deref().unwrap_or(&fallback);
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
            .map(|s| s.as_str().to_string())
            .unwrap_or_else(|| "Bundle".to_string());

        let merchandise_id = variant.id().to_string();

        // Price on the EXPAND op only when discount > 0 (matches TS spread pattern).
        let price: Option<schema::PriceAdjustment> = if discount_percentage > 0.0 {
            Some(schema::PriceAdjustment {
                percentage_decrease: Some(schema::PriceAdjustmentValue {
                    value: Decimal::from(discount_percentage),
                }),
            })
        } else {
            None
        };

        let attributes = vec![
            schema::AttributeOutput { key: "_is_bundle_parent".into(),          value: "true".into() },
            schema::AttributeOutput { key: "_bundle_name".into(),               value: bundle_name },
            schema::AttributeOutput { key: "_bundle_component_count".into(),    value: component_details.len().to_string() },
            schema::AttributeOutput { key: "_bundle_components".into(),         value: components_json },
            schema::AttributeOutput { key: "_bundle_total_retail_cents".into(), value: total_retail_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_total_price_cents".into(),  value: total_bundle_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_total_savings_cents".into(),value: total_savings_cents.to_string() },
            schema::AttributeOutput { key: "_bundle_discount_percent".into(),   value: format!("{:.2}", discount_percentage) },
        ];

        let expand_op = schema::LineExpandOperation {
            cart_line_id: line.id().to_string(),
            expanded_cart_items: vec![schema::ExpandedItem {
                merchandise_id,
                quantity: *line.quantity(),
                attributes: Some(attributes),
                price: None,  // Flex Bundle: per-item price not set; discount on op level
            }],
            price,
            title: None,
            image: None,
        };

        operations.push(schema::CartOperation::LineExpand(expand_op));
    }

    operations
}
