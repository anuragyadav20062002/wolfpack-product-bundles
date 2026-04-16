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
pub fn calculate_discount_percentage(
    price_adjustment: &PriceAdjustmentConfig,
    paid_total: f64,
    original_total: f64,
    _total_quantity: i64,
    paid_quantity: i64,
    presentment_currency_rate: f64,
) -> f64 {
    // -------------------------------------------------------------------------
    // Condition check (optional)
    // -------------------------------------------------------------------------
    if let Some(condition) = &price_adjustment.conditions {
        let (actual_value, condition_value) = match condition.condition_type {
            ConditionType::Amount => {
                // Threshold is stored in base-currency cents. Convert to presentment currency.
                // Bail out if rate is invalid — wrong threshold silently breaks pricing.
                if !presentment_currency_rate.is_finite() || presentment_currency_rate <= 0.0 {
                    return 0.0;
                }
                let threshold = (condition.value / 100.0) * presentment_currency_rate;
                (paid_total, threshold)
            }
            ConditionType::Quantity => {
                (paid_quantity as f64, condition.value)
            }
        };

        let operator = normalize_operator(&condition.operator);
        let meets_condition = match operator {
            Operator::Gte => actual_value >= condition_value,
            Operator::Gt  => actual_value > condition_value,
            Operator::Lte => actual_value <= condition_value,
            Operator::Lt  => actual_value < condition_value,
            // equal_to acts as a threshold-once-reached (matches storefront semantics)
            Operator::Eq  => actual_value >= condition_value,
        };

        if !meets_condition {
            return 0.0;
        }
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
            // Percentage is currency-agnostic — no rate conversion needed.
            paid_total * (1.0 - price_adjustment.value / 100.0)
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
    };

    // effectivePct = (1 − targetPrice / originalTotal) × 100
    let result = (1.0 - target_price / original_total) * 100.0;

    // Clamp to [0, 100]. NaN cannot be caught by min/max alone — guard explicitly.
    if result.is_finite() {
        result.clamp(0.0, 100.0)
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
        PriceAdjustmentConfig { method, value, conditions: None }
    }

    fn adj_with_condition(method: PricingMethod, value: f64, condition: Condition) -> PriceAdjustmentConfig {
        PriceAdjustmentConfig { method, value, conditions: Some(condition) }
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
