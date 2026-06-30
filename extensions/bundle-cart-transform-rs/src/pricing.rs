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
            Operator::Gt  => actual_value > condition_value,
            Operator::Lte => actual_value <= condition_value,
            Operator::Lt  => actual_value < condition_value,
            Operator::Eq  => actual_value >= condition_value,
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

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Condition, ConditionType, PriceAdjustmentConfig, PricingMethod};

    fn adj(method: PricingMethod, value: f64) -> PriceAdjustmentConfig {
        PriceAdjustmentConfig { method, value, conditions: None, ..Default::default() }
    }

    fn adj_with_condition(method: PricingMethod, value: f64, condition: Condition) -> PriceAdjustmentConfig {
        PriceAdjustmentConfig { method, value, conditions: Some(condition), ..Default::default() }
    }

    /// percentage_off: 20% off paid total of $100
    #[test]
    fn percentage_off_basic() {
        let cfg = adj(PricingMethod::PercentageOff, 20.0);
        let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 1, 1, 1.0);
        // targetPrice = 100 * 0.80 = 80.0, effectivePct = (1 - 80/100)*100 = 20.0
        assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
    }

    /// percentage_off: 100% off — clamped to 100
    #[test]
    fn percentage_off_clamped() {
        let cfg = adj(PricingMethod::PercentageOff, 100.0);
        let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 1, 1, 1.0);
        assert!((pct - 100.0).abs() < 0.001);
    }

    /// buy_x_get_y: buy 2, get 1 at 100% off across 3 equal-price items.
    #[test]
    fn buy_x_get_y_discounted_quantity() {
        let cfg = PriceAdjustmentConfig {
            method: PricingMethod::BuyXGetY,
            value: 100.0,
            conditions: Some(Condition {
                condition_type: ConditionType::Quantity,
                operator: "gte".to_string(),
                value: 3.0,
            }),
            customer_buys: Some(2),
            customer_gets: Some(1),
            discount_type: Some("percentage".to_string()),
            apply_discount_to: Some("lowest_priced".to_string()),
        };
        let pct = calculate_discount_percentage(&cfg, 30.0, 30.0, 3, 3, 1.0);
        assert!((pct - 33.3333).abs() < 0.001, "expected one of three items free, got {pct}");
    }

    #[test]
    fn buy_x_get_y_condition_not_met_returns_zero() {
        let cfg = PriceAdjustmentConfig {
            method: PricingMethod::BuyXGetY,
            value: 100.0,
            conditions: Some(Condition {
                condition_type: ConditionType::Quantity,
                operator: "gte".to_string(),
                value: 3.0,
            }),
            customer_buys: Some(2),
            customer_gets: Some(1),
            discount_type: Some("percentage".to_string()),
            apply_discount_to: Some("lowest_priced".to_string()),
        };
        let pct = calculate_discount_percentage(&cfg, 20.0, 20.0, 2, 2, 1.0);
        assert_eq!(pct, 0.0);
    }

    /// fixed_amount_off: $10 off (1000 cents) from $50 total, rate=1.0
    #[test]
    fn fixed_amount_off_basic() {
        let cfg = adj(PricingMethod::FixedAmountOff, 1000.0);
        // paid_total = $50.00, after $10 off → $40.00
        // effectivePct = (1 - 40/50)*100 = 20.0
        let pct = calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, 1.0);
        assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
    }

    /// fixed_amount_off exceeds paid_total — clamped to 100%
    #[test]
    fn fixed_amount_off_exceeds_total() {
        let cfg = adj(PricingMethod::FixedAmountOff, 10000.0); // $100 off, paid = $50
        let pct = calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, 1.0);
        assert!((pct - 100.0).abs() < 0.001);
    }

    /// fixed_bundle_price: set final price to $29.99 (2999 cents), paid_total = $80
    #[test]
    fn fixed_bundle_price_basic() {
        let cfg = adj(PricingMethod::FixedBundlePrice, 2999.0);
        // fixedPrice = 2999/100 * 1.0 = $29.99
        // effectivePct = (1 - 29.99/80)*100 ≈ 62.51
        let pct = calculate_discount_percentage(&cfg, 80.0, 80.0, 2, 2, 1.0);
        let expected = (1.0 - 29.99 / 80.0) * 100.0;
        assert!((pct - expected).abs() < 0.01, "expected {expected} got {pct}");
    }

    /// condition not met — returns 0
    #[test]
    fn condition_not_met_returns_zero() {
        let cfg = adj_with_condition(
            PricingMethod::PercentageOff,
            10.0,
            Condition {
                condition_type: ConditionType::Quantity,
                operator: "gte".to_string(),
                value: 5.0,
            },
        );
        // paid_quantity = 2, threshold = 5 — condition not met
        let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 2, 2, 1.0);
        assert_eq!(pct, 0.0);
    }

    /// condition met — discount applied
    #[test]
    fn condition_met_applies_discount() {
        let cfg = adj_with_condition(
            PricingMethod::PercentageOff,
            20.0,
            Condition {
                condition_type: ConditionType::Quantity,
                operator: "gte".to_string(),
                value: 3.0,
            },
        );
        let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 5, 5, 1.0);
        assert!((pct - 20.0).abs() < 0.001);
    }

    /// free-gift absorption: paid=$80, free_gift=$20 (original=$100)
    /// No price_adjustment — caller sets effectivePct from free-gift math.
    /// Here we test via percentage_off with explicit free-gift separation.
    #[test]
    fn free_gift_absorption() {
        // 0% explicit discount but paid=$80, original=$100 (20% are free gifts)
        let cfg = adj(PricingMethod::PercentageOff, 0.0);
        // targetPrice = 80 * 1.0 = 80, effectivePct = (1-80/100)*100 = 20
        let pct = calculate_discount_percentage(&cfg, 80.0, 100.0, 3, 2, 1.0);
        assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
    }

    /// Invalid rate for amount-based method — returns 0
    #[test]
    fn invalid_rate_returns_zero() {
        let cfg = adj(PricingMethod::FixedAmountOff, 1000.0);
        assert_eq!(calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, 0.0), 0.0);
        assert_eq!(calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, -1.0), 0.0);
        assert_eq!(calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, f64::NAN), 0.0);
    }

    /// Zero original_total — returns 0 (division guard)
    #[test]
    fn zero_total_returns_zero() {
        let cfg = adj(PricingMethod::PercentageOff, 20.0);
        assert_eq!(calculate_discount_percentage(&cfg, 0.0, 0.0, 0, 0, 1.0), 0.0);
    }
}
