use shopify_function::scalars::Decimal;
use crate::types::Operator;

/// Convert a shopify_function Decimal scalar to f64.
///
/// Decimal stores its value as a string representation (e.g. "29.99", "1.35").
/// We format it via Display and parse; returns 0.0 on any error or non-finite value.
pub fn decimal_to_f64(d: &Decimal) -> f64 {
    format!("{d}").parse::<f64>().ok().filter(|v| v.is_finite()).unwrap_or(0.0)
}

/// Parse a float string safely — returns 0.0 on parse error, NaN, or Infinity.
pub fn safe_parse_float(value: Option<&str>) -> f64 {
    value
        .and_then(|v| v.parse::<f64>().ok())
        .filter(|v| v.is_finite())
        .unwrap_or(0.0)
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

/// Truncate a string to at most `max_chars` characters (UTF-8-safe).
pub fn truncate(s: &str, max_chars: usize) -> &str {
    if s.len() <= max_chars {
        s
    } else {
        let mut end = max_chars;
        while !s.is_char_boundary(end) {
            end -= 1;
        }
        &s[..end]
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_parse_float_valid() { assert_eq!(safe_parse_float(Some("10.50")), 10.50); }

    #[test]
    fn safe_parse_float_none()  { assert_eq!(safe_parse_float(None), 0.0); }

    #[test]
    fn safe_parse_float_empty() { assert_eq!(safe_parse_float(Some("")), 0.0); }

    #[test]
    fn safe_parse_float_non_numeric() { assert_eq!(safe_parse_float(Some("abc")), 0.0); }

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
    fn truncate_short_unchanged() { assert_eq!(truncate("hello", 10), "hello"); }
    #[test]
    fn truncate_long()            { assert_eq!(truncate("hello world", 5), "hello"); }
}
