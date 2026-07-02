use crate::helpers::normalize_operator;
use crate::types::{ConditionType, Operator, PriceAdjustmentConfig, PricingMethod};

/// Calculate the effective percentage decrease to pass to Shopify's MERGE/EXPAND operation.
///
/// Direct port of TypeScript `calculateDiscountPercentage()`.
///
/// # Parameters
/// - `price_adjustment` — discount config from metafield (method + value + optional condition)
/// - `paid_total` — sum of component line costs that are NOT free-gift lines (presentment currency, dollars)
/// - `original_total` — paid_total + free_gift_total (what Shopify applies percentageDecrease to)
/// - `total_quantity` — total number of items across all bundle lines
/// - `paid_quantity` — total quantity of NON-free-gift lines
/// - `presentment_currency_rate` — rate from shop base currency → customer's presentment currency
///   (1.0 for single-currency stores). Amount-based values are in base-currency cents and must be
///   multiplied by this rate before comparing against presentment-currency cart totals.
///
/// # Returns
/// A value in [0.0, 100.0] representing the percentage to discount.
/// Returns 0.0 on any invalid input (NaN guard) or unmet condition.
///
/// # Free-gift math
/// We compute `effectivePct = (1 − targetPrice / originalTotal) × 100` so that
/// Shopify's `percentageDecrease` applied to `originalTotal` yields exactly `targetPrice`.
/// When there are no free-gift lines, `paid_total == original_total` and all formulas
/// reduce to the plain discount — no behavioural change.
fn condition_is_met(
    price_adjustment: &PriceAdjustmentConfig,
    paid_total: f64,
    paid_quantity: i64,
    presentment_currency_rate: f64,
) -> bool {
    if let Some(condition) = &price_adjustment.conditions {
        let (actual_value, condition_value) = match condition.condition_type {
            ConditionType::Amount => {
                if !presentment_currency_rate.is_finite() || presentment_currency_rate <= 0.0 {
                    return false;
                }
                let threshold = (condition.value / 100.0) * presentment_currency_rate;
                (paid_total, threshold)
            }
            ConditionType::Quantity => (paid_quantity as f64, condition.value),
        };

        let operator = normalize_operator(&condition.operator);
        match operator {
            Operator::Gte => actual_value >= condition_value,
            Operator::Gt => actual_value > condition_value,
            Operator::Lte => actual_value <= condition_value,
            Operator::Lt => actual_value < condition_value,
            Operator::Eq => actual_value >= condition_value,
        }
    } else {
        true
    }
}

pub fn rounded_percentage(discount_amount: f64, original_total: f64) -> f64 {
    if original_total <= 0.0 {
        return 0.0;
    }

    let result = (discount_amount / original_total) * 100.0;

    if result.is_finite() {
        let rounded = (result * 10000.0).round() / 10000.0;
        rounded.clamp(0.0, 100.0)
    } else {
        0.0
    }
}

pub fn calculate_buy_x_get_y_discount_percentage(
    price_adjustment: &PriceAdjustmentConfig,
    paid_unit_prices: &[f64],
    paid_total: f64,
    original_total: f64,
    paid_quantity: i64,
    presentment_currency_rate: f64,
) -> f64 {
    if !condition_is_met(
        price_adjustment,
        paid_total,
        paid_quantity,
        presentment_currency_rate,
    ) {
        return 0.0;
    }

    if original_total <= 0.0 || paid_total <= 0.0 || paid_quantity <= 0 {
        return 0.0;
    }

    let customer_buys = price_adjustment.customer_buys.unwrap_or(0).max(0);
    let customer_gets = price_adjustment.customer_gets.unwrap_or(0).max(0);
    let offer_size = customer_buys + customer_gets;

    if offer_size <= 0 || customer_gets <= 0 {
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
        let average_price = paid_total / paid_quantity as f64;
        unit_prices = vec![average_price; paid_quantity as usize];
    }

    match price_adjustment.apply_discount_to.as_deref() {
        Some("latest_added") => unit_prices.reverse(),
        _ => unit_prices.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)),
    }

    let discounted_count = (discounted_units as usize).min(unit_prices.len());
    let discount_amount = match price_adjustment.discount_type.as_deref() {
        Some("fixed_amount") | Some("fixed") => {
            if !presentment_currency_rate.is_finite() || presentment_currency_rate <= 0.0 {
                return 0.0;
            }
            let amount_off = (price_adjustment.value / 100.0) * presentment_currency_rate;
            unit_prices
                .iter()
                .take(discounted_count)
                .map(|price| amount_off.min(*price))
                .sum::<f64>()
        }
        _ => {
            let pct = price_adjustment.value.clamp(0.0, 100.0);
            unit_prices
                .iter()
                .take(discounted_count)
                .map(|price| price * pct / 100.0)
                .sum::<f64>()
        }
    };

    rounded_percentage(discount_amount.min(original_total), original_total)
}

pub fn calculate_discount_percentage(
    price_adjustment: &PriceAdjustmentConfig,
    paid_total: f64,
    original_total: f64,
    _total_quantity: i64,
    paid_quantity: i64,
    presentment_currency_rate: f64,
) -> f64 {
    if !condition_is_met(
        price_adjustment,
        paid_total,
        paid_quantity,
        presentment_currency_rate,
    ) {
        return 0.0;
    }

    if original_total <= 0.0 {
        return 0.0;
    }

    // -------------------------------------------------------------------------
    // Compute targetPrice — what the customer should pay for paid items only.
    // Free-gift lines are excluded from paid_total, so their cost is absorbed
    // into the effectivePct automatically.
    // -------------------------------------------------------------------------
    let target_price = match price_adjustment.method {
        PricingMethod::PercentageOff => {
            let pct = price_adjustment.value.clamp(0.0, 100.0);
            // When there are no free gifts (paid == original), return the exact
            // configured percentage to avoid f64 roundtrip error.
            if (paid_total - original_total).abs() < 1e-8 {
                return pct;
            }
            // Free-gift bundles: compute target price so the formula absorbs
            // both the explicit discount and the free-gift subsidy.
            paid_total * (1.0 - pct / 100.0)
        }

        PricingMethod::FixedAmountOff => {
            // Value is stored in base-currency cents. Convert to presentment currency.
            if !presentment_currency_rate.is_finite() || presentment_currency_rate <= 0.0 {
                return 0.0;
            }
            let amount_off = (price_adjustment.value / 100.0) * presentment_currency_rate;
            f64::max(0.0, paid_total - amount_off)
        }

        PricingMethod::FixedBundlePrice => {
            // Value is stored in base-currency cents. Convert to presentment currency.
            if !presentment_currency_rate.is_finite() || presentment_currency_rate <= 0.0 {
                return 0.0;
            }
            let fixed_price = (price_adjustment.value / 100.0) * presentment_currency_rate;
            // Cap at paid_total: if fixed_price > paid_total the merchant inadvertently
            // set a price that would charge for the free gift. Clamp to paid_total.
            f64::min(fixed_price, paid_total)
        }

        PricingMethod::BuyXGetY => {
            let average_price = if paid_quantity > 0 {
                paid_total / paid_quantity as f64
            } else {
                0.0
            };
            let paid_unit_prices = vec![average_price; paid_quantity.max(0) as usize];
            let discount_percentage = calculate_buy_x_get_y_discount_percentage(
                price_adjustment,
                &paid_unit_prices,
                paid_total,
                original_total,
                paid_quantity,
                presentment_currency_rate,
            );
            return discount_percentage;
        }
    };

    // effectivePct = (1 − targetPrice / originalTotal) × 100
    let result = (1.0 - target_price / original_total) * 100.0;

    // Clamp to [0, 100]. NaN cannot be caught by min/max alone — guard explicitly.
    // Round to 4 decimal places to eliminate f64 representation noise
    // (e.g. 19.999999999999996 → 20.0 for fixed_amount_off / fixed_bundle_price).
    if result.is_finite() {
        let rounded = (result * 10000.0).round() / 10000.0;
        rounded.clamp(0.0, 100.0)
    } else {
        0.0
    }
}

#[cfg(test)]
#[path = "pricing_tests.rs"]
mod tests;
