use super::*;

#[test]
fn normalize_operator_short_forms() {
    assert_eq!(normalize_operator("gte"), Operator::Gte);
    assert_eq!(normalize_operator("gt"), Operator::Gt);
    assert_eq!(normalize_operator("lte"), Operator::Lte);
    assert_eq!(normalize_operator("lt"), Operator::Lt);
    assert_eq!(normalize_operator("eq"), Operator::Eq);
}

#[test]
fn normalize_operator_long_forms() {
    assert_eq!(
        normalize_operator("greater_than_or_equal_to"),
        Operator::Gte
    );
    assert_eq!(normalize_operator("less_than_or_equal_to"), Operator::Lte);
    assert_eq!(normalize_operator("equal_to"), Operator::Eq);
}

#[test]
fn normalize_operator_unknown_defaults_to_gte() {
    assert_eq!(normalize_operator("unknown"), Operator::Gte);
}

#[test]
fn is_free_gift_true() {
    assert!(is_free_gift_line(Some("free_gift")));
}

#[test]
fn is_free_gift_false() {
    assert!(!is_free_gift_line(Some("default")));
}

#[test]
fn is_free_gift_none() {
    assert!(!is_free_gift_line(None));
}

#[test]
fn is_addon_true() {
    assert!(is_addon_line(Some("addon")));
}

#[test]
fn is_addon_with_discount_true() {
    assert!(is_addon_line(Some("addon:PERCENTAGE:10")));
}

#[test]
fn is_addon_false() {
    assert!(!is_addon_line(Some("free_gift")));
}
