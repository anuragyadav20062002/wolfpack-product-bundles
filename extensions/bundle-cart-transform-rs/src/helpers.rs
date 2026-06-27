use shopify_function::scalars::Decimal;
use crate::types::Operator;

/// Convert a shopify_function Decimal scalar to f64.
///
/// Decimal stores its value as a string representation (e.g. "29.99", "1.35").
/// We format it via Display and parse; returns 0.0 on any error or non-finite value.
pub fn decimal_to_f64(d: &Decimal) -> f64 {
    format!("{d}").parse::<f64>().ok().filter(|v| v.is_finite()).unwrap_or(0.0)
}

/// Parse a JSON string into `T`, returning `T::default()` on any error.
pub fn parse_json_or_default<T>(json: Option<&str>) -> T
where
    T: serde::de::DeserializeOwned + Default,
{
    json.and_then(|v| serde_json::from_str(v).ok())
        .unwrap_or_default()
}

/// Normalize a condition operator string to a typed Operator.
/// Handles both short aliases (gte/lte/gt/lt/eq) and long Shopify forms.
/// Unknown operators default to Gte — matches the TypeScript default case.
pub fn normalize_operator(operator: &str) -> Operator {
    match operator {
        "gte" | "greater_than_or_equal_to" => Operator::Gte,
        "gt"  | "greater_than"             => Operator::Gt,
        "lte" | "less_than_or_equal_to"    => Operator::Lte,
        "lt"  | "less_than"                => Operator::Lt,
        "eq"  | "equal_to"                 => Operator::Eq,
        _                                  => Operator::Gte,
    }
}

/// Returns true when the cart line's `_bundle_step_type` attribute is `free_gift`.
pub fn is_free_gift_line(step_type_value: Option<&str>) -> bool {
    step_type_value == Some("free_gift")
}

/// Returns true when the cart line's `_bundle_step_type` attribute is `addon`.
pub fn is_addon_line(step_type_value: Option<&str>) -> bool {
    step_type_value
        .map(|value| value == "addon" || value.starts_with("addon:"))
        .unwrap_or(false)
}

pub fn parse_addon_discount(step_type_value: Option<&str>) -> Option<(String, String)> {
    let value = step_type_value?;
    let mut parts = value.split(':');
    match (parts.next(), parts.next(), parts.next(), parts.next()) {
        (Some("addon"), Some(discount_type), Some(discount_value), None) => {
            Some((discount_type.to_string(), discount_value.to_string()))
        }
        _ => None,
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_operator_short_forms() {
        assert_eq!(normalize_operator("gte"), Operator::Gte);
        assert_eq!(normalize_operator("gt"),  Operator::Gt);
        assert_eq!(normalize_operator("lte"), Operator::Lte);
        assert_eq!(normalize_operator("lt"),  Operator::Lt);
        assert_eq!(normalize_operator("eq"),  Operator::Eq);
    }

    #[test]
    fn normalize_operator_long_forms() {
        assert_eq!(normalize_operator("greater_than_or_equal_to"), Operator::Gte);
        assert_eq!(normalize_operator("less_than_or_equal_to"),    Operator::Lte);
        assert_eq!(normalize_operator("equal_to"),                 Operator::Eq);
    }

    #[test]
    fn normalize_operator_unknown_defaults_to_gte() {
        assert_eq!(normalize_operator("unknown"), Operator::Gte);
    }

    #[test]
    fn is_free_gift_true()  { assert!(is_free_gift_line(Some("free_gift"))); }
    #[test]
    fn is_free_gift_false() { assert!(!is_free_gift_line(Some("default"))); }
    #[test]
    fn is_free_gift_none()  { assert!(!is_free_gift_line(None)); }
    #[test]
    fn is_addon_true()      { assert!(is_addon_line(Some("addon"))); }
    #[test]
    fn is_addon_with_discount_true() { assert!(is_addon_line(Some("addon:PERCENTAGE:10"))); }
    #[test]
    fn is_addon_false()     { assert!(!is_addon_line(Some("free_gift"))); }
    #[test]
    fn parses_addon_discount() {
        assert_eq!(
            parse_addon_discount(Some("addon:PERCENTAGE:10")),
            Some(("PERCENTAGE".to_string(), "10".to_string()))
        );
    }
    #[test]
    fn ignores_invalid_addon_discount() {
        assert_eq!(parse_addon_discount(Some("addon:PERCENTAGE")), None);
    }
}
