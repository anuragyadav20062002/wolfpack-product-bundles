use super::*;
use crate::types::{Condition, ConditionType, PriceAdjustmentConfig, PricingMethod};

fn adj(method: PricingMethod, value: f64) -> PriceAdjustmentConfig {
    PriceAdjustmentConfig {
        method,
        value,
        conditions: None,
        ..Default::default()
    }
}

fn adj_with_condition(
    method: PricingMethod,
    value: f64,
    condition: Condition,
) -> PriceAdjustmentConfig {
    PriceAdjustmentConfig {
        method,
        value,
        conditions: Some(condition),
        ..Default::default()
    }
}

/// percentage_off: 20% off paid total of $100
#[test]
fn percentage_off_basic() {
    let cfg = adj(PricingMethod::PercentageOff, 20.0);
    let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 1, 1, 1.0);
    // targetPrice = 100 * 0.80 = 80.0, effectivePct = (1 - 80/100)*100 = 20.0
    assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
}

/// percentage_off: 100% off - clamped to 100
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
    assert!(
        (pct - 33.3333).abs() < 0.001,
        "expected one of three items free, got {pct}"
    );
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
    // paid_total = $50.00, after $10 off -> $40.00
    // effectivePct = (1 - 40/50)*100 = 20.0
    let pct = calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, 1.0);
    assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
}

/// fixed_amount_off exceeds paid_total - clamped to 100%
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
    // effectivePct = (1 - 29.99/80)*100 ~= 62.51
    let pct = calculate_discount_percentage(&cfg, 80.0, 80.0, 2, 2, 1.0);
    let expected = (1.0 - 29.99 / 80.0) * 100.0;
    assert!(
        (pct - expected).abs() < 0.01,
        "expected {expected} got {pct}"
    );
}

/// condition not met - returns 0
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
    // paid_quantity = 2, threshold = 5 - condition not met
    let pct = calculate_discount_percentage(&cfg, 100.0, 100.0, 2, 2, 1.0);
    assert_eq!(pct, 0.0);
}

/// condition met - discount applied
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
/// No price_adjustment - caller sets effectivePct from free-gift math.
/// Here we test via percentage_off with explicit free-gift separation.
#[test]
fn free_gift_absorption() {
    // 0% explicit discount but paid=$80, original=$100 (20% are free gifts)
    let cfg = adj(PricingMethod::PercentageOff, 0.0);
    // targetPrice = 80 * 1.0 = 80, effectivePct = (1-80/100)*100 = 20
    let pct = calculate_discount_percentage(&cfg, 80.0, 100.0, 3, 2, 1.0);
    assert!((pct - 20.0).abs() < 0.001, "expected 20.0 got {pct}");
}

/// Invalid rate for amount-based method - returns 0
#[test]
fn invalid_rate_returns_zero() {
    let cfg = adj(PricingMethod::FixedAmountOff, 1000.0);
    assert_eq!(
        calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, 0.0),
        0.0
    );
    assert_eq!(
        calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, -1.0),
        0.0
    );
    assert_eq!(
        calculate_discount_percentage(&cfg, 50.0, 50.0, 1, 1, f64::NAN),
        0.0
    );
}

/// Zero original_total - returns 0 (division guard)
#[test]
fn zero_total_returns_zero() {
    let cfg = adj(PricingMethod::PercentageOff, 20.0);
    assert_eq!(
        calculate_discount_percentage(&cfg, 0.0, 0.0, 0, 0, 1.0),
        0.0
    );
}
