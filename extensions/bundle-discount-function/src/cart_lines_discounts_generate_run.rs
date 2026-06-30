use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

const ADDON_DISCOUNT_MESSAGE: &str = "Add On";

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

    let candidates: Vec<schema::ProductDiscountCandidate> = input
        .cart()
        .lines()
        .iter()
        .filter_map(|line| {
            let percentage = parse_addon_percentage(
                line.step_type()
                    .and_then(|attribute| attribute.value())
                    .map(|value| value.as_str()),
            )?;

            Some(schema::ProductDiscountCandidate {
                associated_discount_code: None,
                message: Some(ADDON_DISCOUNT_MESSAGE.to_string()),
                prerequisites: None,
                targets: vec![schema::ProductDiscountCandidateTarget::CartLine(
                    schema::CartLineTarget {
                        id: line.id().clone(),
                        quantity: None,
                    },
                )],
                value: schema::ProductDiscountCandidateValue::Percentage(schema::Percentage {
                    value: Decimal(percentage),
                }),
            })
        })
        .collect();

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
mod tests {
    use super::*;
    use shopify_function::run_function_with_input;

    #[test]
    fn parses_partial_percentage_addon_token() {
        assert_eq!(
            parse_addon_percentage(Some("addon:PERCENTAGE:10")),
            Some(10.0)
        );
    }

    #[test]
    fn caps_full_discount_at_one_hundred_percent() {
        assert_eq!(
            parse_addon_percentage(Some("addon:PERCENTAGE:125")),
            Some(100.0)
        );
    }

    #[test]
    fn ignores_invalid_addon_tokens() {
        assert_eq!(parse_addon_percentage(Some("addon:PERCENTAGE")), None);
        assert_eq!(parse_addon_percentage(Some("addon:FIXED:10")), None);
        assert_eq!(parse_addon_percentage(Some("free_gift")), None);
        assert_eq!(parse_addon_percentage(Some("addon:PERCENTAGE:0")), None);
        assert_eq!(parse_addon_percentage(None), None);
    }

    #[test]
    fn emits_partial_and_full_addon_discount_candidates() {
        let input = r#"{
            "cart": {
                "lines": [
                    { "id": "gid://shopify/CartLine/paid", "stepType": null },
                    {
                        "id": "gid://shopify/CartLine/addon-partial",
                        "stepType": { "value": "addon:PERCENTAGE:10" }
                    },
                    {
                        "id": "gid://shopify/CartLine/addon-free",
                        "stepType": { "value": "addon:PERCENTAGE:100" }
                    },
                    {
                        "id": "gid://shopify/CartLine/malformed-addon",
                        "stepType": { "value": "addon:PERCENTAGE" }
                    }
                ]
            },
            "discount": { "discountClasses": ["PRODUCT"] }
        }"#;

        let output: schema::CartLinesDiscountsGenerateRunResult =
            run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

        assert_eq!(output.operations.len(), 1);
        let add_operation = match &output.operations[0] {
            schema::CartOperation::ProductDiscountsAdd(operation) => operation,
            unexpected => panic!("expected product discounts add operation, got {unexpected:?}"),
        };
        assert_eq!(
            add_operation.selection_strategy,
            schema::ProductDiscountSelectionStrategy::All
        );
        assert_eq!(add_operation.candidates.len(), 2);
        assert_eq!(
            add_operation.candidates[0].message.as_deref(),
            Some(ADDON_DISCOUNT_MESSAGE)
        );
        assert_eq!(
            add_operation.candidates[1].message.as_deref(),
            Some(ADDON_DISCOUNT_MESSAGE)
        );

        let first_percentage = match &add_operation.candidates[0].value {
            schema::ProductDiscountCandidateValue::Percentage(percentage) => {
                percentage.value.to_string()
            }
            unexpected => panic!("expected percentage discount value, got {unexpected:?}"),
        };
        let second_percentage = match &add_operation.candidates[1].value {
            schema::ProductDiscountCandidateValue::Percentage(percentage) => {
                percentage.value.to_string()
            }
            unexpected => panic!("expected percentage discount value, got {unexpected:?}"),
        };
        assert_eq!(first_percentage, "10.0");
        assert_eq!(second_percentage, "100.0");
    }

    #[test]
    fn ignores_addon_lines_when_product_discount_class_is_unavailable() {
        let input = r#"{
            "cart": {
                "lines": [
                    {
                        "id": "gid://shopify/CartLine/addon-partial",
                        "stepType": { "value": "addon:PERCENTAGE:10" }
                    }
                ]
            },
            "discount": { "discountClasses": ["ORDER"] }
        }"#;

        let output: schema::CartLinesDiscountsGenerateRunResult =
            run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

        assert!(output.operations.is_empty());
    }
}
