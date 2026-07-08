use super::schema;
use crate::runtime_token::{token_components_match, verify_runtime_token};
use shopify_function::prelude::*;
use shopify_function::Result;
use std::collections::HashMap;

const ADDON_DISCOUNT_MESSAGE: &str = "Add On";
const BUNDLE_DISCOUNT_MESSAGE: &str = "Bundle Discount";
const CHECKOUT_INTEGRATION_CODE_PREFIX: &str = "WPB-";

fn parse_addon_percentage(step_type_value: Option<&str>) -> Option<f64> {
    let value = step_type_value?.trim();
    let mut parts = value.split(':');
    let marker = parts.next()?;
    let discount_type = parts.next()?;
    let discount_value = parts.next()?;
    if parts.next().is_some() {
        return None;
    }
    if marker != "addon" || discount_type.to_ascii_uppercase() != "PERCENTAGE" {
        return None;
    }

    let percentage = discount_value.parse::<f64>().ok()?;
    if !percentage.is_finite() || percentage <= 0.0 {
        return None;
    }

    Some(percentage.min(100.0))
}

fn decimal_to_f64(d: &Decimal) -> f64 {
    format!("{d}")
        .parse::<f64>()
        .ok()
        .filter(|value| value.is_finite())
        .unwrap_or(0.0)
}

fn rounded_percentage(discount_amount: f64, original_total: f64) -> f64 {
    if original_total <= 0.0 {
        return 0.0;
    }

    let result = (discount_amount / original_total) * 100.0;
    if result.is_finite() {
        ((result * 10000.0).round() / 10000.0).clamp(0.0, 100.0)
    } else {
        0.0
    }
}

fn wolfpack_product_bundle_offer_group_id(value: &str) -> Option<String> {
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

fn is_addon_line(step_type_value: Option<&str>) -> bool {
    step_type_value
        .map(|value| value == "addon" || value.starts_with("addon:"))
        .unwrap_or(false)
}

fn is_free_gift_line(step_type_value: Option<&str>) -> bool {
    step_type_value == Some("free_gift")
}

fn has_generated_checkout_code(input: &schema::cart_lines_discounts_generate_run::Input) -> bool {
    input
        .entered_discount_codes()
        .iter()
        .any(|code| code.code().starts_with(CHECKOUT_INTEGRATION_CODE_PREFIX))
}

fn is_checkout_integration_code_mode(
    input: &schema::cart_lines_discounts_generate_run::Input,
) -> bool {
    input
        .triggering_discount_code()
        .map(|code| code.starts_with(CHECKOUT_INTEGRATION_CODE_PREFIX))
        .unwrap_or(false)
}

fn extract_json_number(source: &str, key: &str) -> Option<f64> {
    let key_marker = format!("\"{key}\"");
    let key_pos = source.find(&key_marker)?;
    let after_key = &source[key_pos + key_marker.len()..];
    let colon_pos = after_key.find(':')?;
    let after_colon = after_key[colon_pos + 1..].trim_start();
    let value_end = after_colon
        .find(|ch: char| !ch.is_ascii_digit() && ch != '.' && ch != '-')
        .unwrap_or(after_colon.len());
    after_colon[..value_end].parse::<f64>().ok()
}

fn extract_json_string(source: &str, key: &str) -> Option<String> {
    let key_marker = format!("\"{key}\"");
    let key_pos = source.find(&key_marker)?;
    let after_key = &source[key_pos + key_marker.len()..];
    let colon_pos = after_key.find(':')?;
    let after_colon = after_key[colon_pos + 1..].trim_start();
    let value = after_colon.strip_prefix('"')?;
    let value_end = value.find('"')?;
    Some(value[..value_end].to_string())
}

fn extract_json_number_any(source: &str, keys: &[&str]) -> Option<f64> {
    keys.iter().find_map(|key| extract_json_number(source, key))
}

fn extract_json_string_any(source: &str, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| extract_json_string(source, key))
}

fn price_adjustment_slice(source: &str) -> &str {
    source
        .find("\"price_adjustment\"")
        .map(|position| &source[position..])
        .unwrap_or(source)
}

fn calculate_parent_discount_percentage(
    component_parents_json: &str,
    paid_total: f64,
    original_total: f64,
    paid_quantity: i64,
    paid_unit_prices: &[f64],
    presentment_currency_rate: f64,
) -> f64 {
    if original_total <= 0.0 || paid_total <= 0.0 {
        return 0.0;
    }

    let price_adjustment_json = price_adjustment_slice(component_parents_json);
    let method = extract_json_string(price_adjustment_json, "method")
        .unwrap_or_else(|| "percentage_off".to_string());
    let value = extract_json_number(price_adjustment_json, "value").unwrap_or(0.0);

    let target_price = match method.as_str() {
        "buy_x_get_y" => {
            let customer_buys =
                extract_json_number_any(price_adjustment_json, &["customerBuys", "customer_buys"])
                    .unwrap_or(0.0)
                    .max(0.0) as i64;
            let customer_gets =
                extract_json_number_any(price_adjustment_json, &["customerGets", "customer_gets"])
                    .unwrap_or(0.0)
                    .max(0.0) as i64;
            let offer_size = customer_buys + customer_gets;
            if paid_quantity <= 0 || offer_size <= 0 || customer_gets <= 0 {
                return 0.0;
            }

            let discounted_units = (paid_quantity / offer_size) * customer_gets;
            if discounted_units <= 0 {
                return 0.0;
            }

            let mut unit_prices: Vec<f64> = paid_unit_prices
                .iter()
                .copied()
                .filter(|price| price.is_finite() && *price > 0.0)
                .collect();
            if unit_prices.is_empty() {
                unit_prices = vec![paid_total / paid_quantity as f64; paid_quantity as usize];
            }

            match extract_json_string_any(
                price_adjustment_json,
                &["applyDiscountTo", "apply_discount_to"],
            )
            .as_deref()
            {
                Some("latest_added") => unit_prices.reverse(),
                _ => unit_prices
                    .sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)),
            }

            let discounted_count = (discounted_units as usize).min(unit_prices.len());
            let discount_amount = match extract_json_string_any(
                price_adjustment_json,
                &["discountType", "discount_type"],
            )
            .as_deref()
            {
                Some("fixed_amount") | Some("fixed") => {
                    if presentment_currency_rate <= 0.0 {
                        return 0.0;
                    }
                    let amount_off = (value / 100.0) * presentment_currency_rate;
                    unit_prices
                        .iter()
                        .take(discounted_count)
                        .map(|price| amount_off.min(*price))
                        .sum::<f64>()
                }
                _ => {
                    let pct = value.clamp(0.0, 100.0);
                    unit_prices
                        .iter()
                        .take(discounted_count)
                        .map(|price| price * pct / 100.0)
                        .sum::<f64>()
                }
            };

            return rounded_percentage(discount_amount.min(original_total), original_total);
        }
        "fixed_amount_off" => {
            if presentment_currency_rate <= 0.0 {
                return 0.0;
            }
            let amount_off = (value / 100.0) * presentment_currency_rate;
            f64::max(0.0, paid_total - amount_off)
        }
        "fixed_bundle_price" => {
            if presentment_currency_rate <= 0.0 {
                return 0.0;
            }
            f64::min((value / 100.0) * presentment_currency_rate, paid_total)
        }
        _ => {
            let pct = value.clamp(0.0, 100.0);
            if (paid_total - original_total).abs() < 1e-8 {
                return pct;
            }
            paid_total * (1.0 - pct / 100.0)
        }
    };

    let discount_amount = (original_total - target_price).max(0.0).min(original_total);
    rounded_percentage(discount_amount, original_total)
}

fn build_addon_candidate(id: String, percentage: f64) -> schema::ProductDiscountCandidate {
    schema::ProductDiscountCandidate {
        associated_discount_code: None,
        message: Some(ADDON_DISCOUNT_MESSAGE.to_string()),
        prerequisites: None,
        targets: vec![schema::ProductDiscountCandidateTarget::CartLine(
            schema::CartLineTarget { id, quantity: None },
        )],
        value: schema::ProductDiscountCandidateValue::Percentage(schema::Percentage {
            value: Decimal(percentage),
        }),
    }
}

fn build_automatic_addon_candidates(
    input: &schema::cart_lines_discounts_generate_run::Input,
) -> Vec<schema::ProductDiscountCandidate> {
    let Some(runtime_secret) = input
        .discount()
        .runtime_token_secret()
        .map(|metafield| metafield.value().as_str())
        .filter(|value| !value.trim().is_empty())
    else {
        return vec![];
    };

    input
        .cart()
        .lines()
        .iter()
        .filter_map(|line| {
            let percentage = parse_addon_percentage(
                line.step_type()
                    .and_then(|attribute| attribute.value())
                    .map(|value| value.as_str()),
            )?;
            let token = line
                .runtime_token()
                .and_then(|attribute| attribute.value())
                .map(|value| value.as_str())?;
            let payload = verify_runtime_token(token, runtime_secret)?;
            let variant_id = match line.merchandise() {
                schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise::ProductVariant(variant) => {
                    variant.id().to_string()
                }
                _ => return None,
            };
            let authorized = payload.addons.iter().any(|addon| {
                addon.variant_id == variant_id
                    && addon.quantity == *line.quantity() as i64
                    && addon.discount.as_ref().map(|discount| {
                        discount.discount_type.eq_ignore_ascii_case("PERCENTAGE")
                            && (discount.value - percentage).abs() < 0.0001
                    }).unwrap_or(false)
            });
            if !authorized {
                return None;
            }

            Some(build_addon_candidate(line.id().clone(), percentage))
        })
        .collect()
}

fn build_checkout_integration_candidates(
    input: &schema::cart_lines_discounts_generate_run::Input,
    presentment_currency_rate: f64,
) -> Vec<schema::ProductDiscountCandidate> {
    let lines = input.cart().lines();
    let runtime_secret = input
        .discount()
        .runtime_token_secret()
        .map(|metafield| metafield.value().as_str())
        .filter(|value| !value.trim().is_empty());
    let mut groups: HashMap<String, Vec<usize>> = HashMap::new();
    let mut candidates = Vec::new();

    for (idx, line) in lines.iter().enumerate() {
        let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());
        if let Some(percentage) = parse_addon_percentage(step_type) {
            if let Some(secret) = runtime_secret {
                let token = line
                    .runtime_token()
                    .and_then(|attribute| attribute.value())
                    .map(|value| value.as_str());
                let variant_id = match line.merchandise() {
                    schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise::ProductVariant(variant) => {
                        variant.id().to_string()
                    }
                    _ => String::new(),
                };
                let authorized = token
                    .and_then(|runtime_token| verify_runtime_token(runtime_token, secret))
                    .map(|payload| {
                        payload.addons.iter().any(|addon| {
                            addon.variant_id == variant_id
                                && addon.quantity == *line.quantity() as i64
                                && addon
                                    .discount
                                    .as_ref()
                                    .map(|discount| {
                                        discount.discount_type.eq_ignore_ascii_case("PERCENTAGE")
                                            && (discount.value - percentage).abs() < 0.0001
                                    })
                                    .unwrap_or(false)
                        })
                    })
                    .unwrap_or(false);
                if authorized {
                    candidates.push(build_addon_candidate(line.id().clone(), percentage));
                }
            }
            continue;
        }

        if is_addon_line(step_type) {
            continue;
        }

        let Some(group_id) = line
            .wolfpack_product_bundle_offer_id()
            .and_then(|attribute| attribute.value())
            .and_then(|value| wolfpack_product_bundle_offer_group_id(value.as_str()))
        else {
            continue;
        };

        groups.entry(group_id).or_default().push(idx);
    }

    for (_, line_indices) in groups {
        let mut paid_total = 0.0;
        let mut free_gift_total = 0.0;
        let mut paid_quantity = 0;
        let mut paid_unit_prices = Vec::new();
        let mut targets = Vec::new();
        let mut actual_components = Vec::new();

        for &idx in &line_indices {
            let line = &lines[idx];
            let quantity = *line.quantity() as f64;
            let unit_price = decimal_to_f64(line.cost().amount_per_quantity().amount());
            let line_total = unit_price * quantity;
            let step_type = line.step_type().and_then(|a| a.value()).map(|s| s.as_str());

            if is_free_gift_line(step_type) {
                free_gift_total += line_total;
            } else {
                paid_total += line_total;
                paid_quantity += *line.quantity() as i64;
                for _ in 0..(*line.quantity() as i64).max(0) {
                    paid_unit_prices.push(unit_price);
                }
            }

            targets.push(schema::ProductDiscountCandidateTarget::CartLine(
                schema::CartLineTarget {
                    id: line.id().clone(),
                    quantity: None,
                },
            ));
            if !is_addon_line(step_type) {
                if let schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise::ProductVariant(variant) = line.merchandise() {
                    actual_components.push((variant.id().to_string(), *line.quantity() as i64));
                }
            }
        }

        let original_total = paid_total + free_gift_total;
        let component_parents_json = if let Some(secret) = runtime_secret {
            let token = line_indices.iter().find_map(|&idx| {
                lines[idx]
                    .runtime_token()
                    .and_then(|attribute| attribute.value())
                    .map(|value| value.as_str())
                    .filter(|value| !value.trim().is_empty())
            });
            let Some(payload) =
                token.and_then(|runtime_token| verify_runtime_token(runtime_token, secret))
            else {
                continue;
            };
            let Some(group_id) = line_indices.iter().find_map(|&idx| {
                lines[idx]
                    .wolfpack_product_bundle_offer_id()
                    .and_then(|attribute| attribute.value())
                    .and_then(|value| wolfpack_product_bundle_offer_group_id(value.as_str()))
            }) else {
                continue;
            };
            if !token_components_match(&payload, &group_id, &actual_components) {
                continue;
            }
            serde_json::to_string(&payload.price_adjustment).unwrap_or_default()
        } else {
            let component_parents_json = line_indices.iter().find_map(|&idx| {
                match lines[idx].merchandise() {
                    schema::cart_lines_discounts_generate_run::input::cart::lines::Merchandise::ProductVariant(variant) => {
                        variant.component_parents().map(|metafield| metafield.value().clone())
                    }
                    _ => None,
                }
            });
            let Some(component_parents_json) = component_parents_json else {
                continue;
            };
            component_parents_json
        };
        let percentage = calculate_parent_discount_percentage(
            &component_parents_json,
            paid_total,
            original_total,
            paid_quantity,
            &paid_unit_prices,
            presentment_currency_rate,
        );

        if percentage <= 0.0 || targets.is_empty() {
            continue;
        }

        candidates.push(schema::ProductDiscountCandidate {
            associated_discount_code: None,
            message: Some(BUNDLE_DISCOUNT_MESSAGE.to_string()),
            prerequisites: None,
            targets,
            value: schema::ProductDiscountCandidateValue::Percentage(schema::Percentage {
                value: Decimal(percentage),
            }),
        });
    }

    candidates
}

#[shopify_function]
fn cart_lines_discounts_generate_run(
    input: schema::cart_lines_discounts_generate_run::Input,
) -> Result<schema::CartLinesDiscountsGenerateRunResult> {
    let has_product_discount_class = input
        .discount()
        .discount_classes()
        .contains(&schema::DiscountClass::Product);

    if !has_product_discount_class {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    let candidates = if is_checkout_integration_code_mode(&input) {
        let rate = decimal_to_f64(input.presentment_currency_rate());
        let presentment_currency_rate = if rate.is_finite() && rate > 0.0 {
            rate
        } else {
            0.0
        };
        build_checkout_integration_candidates(&input, presentment_currency_rate)
    } else if has_generated_checkout_code(&input) {
        vec![]
    } else {
        build_automatic_addon_candidates(&input)
    };

    if candidates.is_empty() {
        return Ok(schema::CartLinesDiscountsGenerateRunResult { operations: vec![] });
    }

    Ok(schema::CartLinesDiscountsGenerateRunResult {
        operations: vec![schema::CartOperation::ProductDiscountsAdd(
            schema::ProductDiscountsAddOperation {
                selection_strategy: schema::ProductDiscountSelectionStrategy::All,
                candidates,
            },
        )],
    })
}

#[cfg(test)]
#[path = "cart_lines_discounts_generate_run_tests.rs"]
mod tests;
