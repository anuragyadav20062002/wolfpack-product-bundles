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
fn ignores_partial_and_full_addon_discount_candidates_without_runtime_token() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/paid",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/paid",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                },
                {
                    "id": "gid://shopify/CartLine/addon-partial",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "stepType": { "value": "addon:PERCENTAGE:10" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/addon-partial",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                },
                {
                    "id": "gid://shopify/CartLine/addon-free",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "stepType": { "value": "addon:PERCENTAGE:100" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/addon-free",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                },
                {
                    "id": "gid://shopify/CartLine/malformed-addon",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "stepType": { "value": "addon:PERCENTAGE" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/malformed-addon",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                }
            ]
        },
        "discount": {
            "discountClasses": ["PRODUCT"],
            "checkoutIntegrationConfig": null
        },
        "enteredDiscountCodes": [],
        "triggeringDiscountCode": null,
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    assert!(output.operations.is_empty());
}

#[test]
fn emits_addon_discount_only_when_runtime_token_authorizes_line() {
    let runtime_secret = "26338c77e8f7a7762a2c91a18de15691f0722578ea7e5f067af01a623f403f6c";
    let runtime_token = "eyJ2ZXJzaW9uIjoxLCJzaG9wIjoidGVzdC1zaG9wLm15c2hvcGlmeS5jb20iLCJidW5kbGVJZCI6ImJ1bmRsZS0xIiwiYnVuZGxlVHlwZSI6ImZ1bGxfcGFnZSIsIm9mZmVyR3JvdXBJZCI6IkZCUC1idW5kbGUtMV9BQkMiLCJwYXJlbnRWYXJpYW50SWQiOiJnaWQ6Ly9zaG9waWZ5L1Byb2R1Y3RWYXJpYW50Lzk5OSIsImJ1bmRsZU5hbWUiOiJSdW50aW1lIEJ1bmRsZSIsImNvbXBvbmVudHMiOlt7InZhcmlhbnRJZCI6ImdpZDovL3Nob3BpZnkvUHJvZHVjdFZhcmlhbnQvMTAxIiwicXVhbnRpdHkiOjF9XSwiYWRkb25zIjpbeyJ2YXJpYW50SWQiOiJnaWQ6Ly9zaG9waWZ5L1Byb2R1Y3RWYXJpYW50LzIwMSIsInF1YW50aXR5IjoxLCJkaXNjb3VudCI6eyJ0eXBlIjoiUEVSQ0VOVEFHRSIsInZhbHVlIjoxMH19XSwicHJpY2VBZGp1c3RtZW50Ijp7Im1ldGhvZCI6InBlcmNlbnRhZ2Vfb2ZmIiwidmFsdWUiOjIwfX0.taZELlnRV1Rlh-RZ2YBVJD1Z8dUE9i3EO28hKYAf7JY";
    let input = format!(
        r#"{{
        "cart": {{
            "lines": [
                {{
                    "id": "gid://shopify/CartLine/addon",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": {{ "value": "FBP-bundle-1_ABC_2" }},
                    "runtimeToken": {{ "value": "{runtime_token}" }},
                    "stepType": {{ "value": "addon:PERCENTAGE:10" }},
                    "merchandise": {{
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/201",
                        "component_parents": null
                    }},
                    "cost": {{ "amountPerQuantity": {{ "amount": "10.00" }} }}
                }}
            ]
        }},
        "discount": {{
            "discountClasses": ["PRODUCT"],
            "runtimeTokenSecret": {{ "value": "{runtime_secret}" }},
            "checkoutIntegrationConfig": null
        }},
        "enteredDiscountCodes": [],
        "triggeringDiscountCode": null,
        "presentmentCurrencyRate": "1.0"
    }}"#
    );

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input.as_str())
            .expect("should run");

    assert_eq!(output.operations.len(), 1);
    let add_operation = match &output.operations[0] {
        schema::CartOperation::ProductDiscountsAdd(operation) => operation,
        unexpected => panic!("expected product discounts add operation, got {unexpected:?}"),
    };
    assert_eq!(add_operation.candidates.len(), 1);
    assert_eq!(
        add_operation.candidates[0].message.as_deref(),
        Some(ADDON_DISCOUNT_MESSAGE)
    );
}

#[test]
fn ignores_unsigned_addon_discount_markers() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/addon",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": { "value": "FBP-bundle-1_ABC_2" },
                    "runtimeToken": null,
                    "stepType": { "value": "addon:PERCENTAGE:10" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/201",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                }
            ]
        },
        "discount": {
            "discountClasses": ["PRODUCT"],
            "runtimeTokenSecret": { "value": "26338c77e8f7a7762a2c91a18de15691f0722578ea7e5f067af01a623f403f6c" },
            "checkoutIntegrationConfig": null
        },
        "enteredDiscountCodes": [],
        "triggeringDiscountCode": null,
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    assert!(output.operations.is_empty());
}

#[test]
fn ignores_addon_lines_when_product_discount_class_is_unavailable() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/addon-partial",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "stepType": { "value": "addon:PERCENTAGE:10" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/addon-partial",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "10.00" } }
                }
            ]
        },
        "discount": {
            "discountClasses": ["ORDER"],
            "checkoutIntegrationConfig": null
        },
        "enteredDiscountCodes": [],
        "triggeringDiscountCode": null,
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    assert!(output.operations.is_empty());
}

#[test]
fn automatic_addon_branch_skips_when_generated_checkout_code_is_entered() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/addon-partial",
                    "stepType": { "value": "addon:PERCENTAGE:10" },
                    "wolfpackProductBundleOfferId": { "value": "FBP-1_ABC_1" },
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/1",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "100.00" } },
                    "quantity": 1
                }
            ]
        },
        "discount": {
            "discountClasses": ["PRODUCT"],
            "checkoutIntegrationConfig": null
        },
        "enteredDiscountCodes": [{ "code": "WPB-GOKWIK-12345678" }],
        "triggeringDiscountCode": null,
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    assert!(output.operations.is_empty());
}

#[test]
fn code_mode_emits_bundle_discount_candidate_from_component_parent_pricing() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/paid-1",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": { "value": "FBP-1_ABC_1" },
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/1",
                        "component_parents": {
                            "value": "[{\"id\":\"gid://shopify/ProductVariant/999\",\"component_reference\":{\"value\":[\"gid://shopify/ProductVariant/1\",\"gid://shopify/ProductVariant/2\"]},\"price_adjustment\":{\"method\":\"percentage_off\",\"value\":20}}]"
                        }
                    },
                    "cost": { "amountPerQuantity": { "amount": "50.00" } }
                },
                {
                    "id": "gid://shopify/CartLine/paid-2",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": { "value": "FBP-1_ABC_2" },
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/2",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "50.00" } }
                }
            ]
        },
        "discount": {
            "discountClasses": ["PRODUCT"],
            "checkoutIntegrationConfig": {
                "jsonValue": {
                    "mode": "checkout_integration",
                    "providerId": "gokwik"
                }
            }
        },
        "enteredDiscountCodes": [{ "code": "WPB-GOKWIK-12345678" }],
        "triggeringDiscountCode": "WPB-GOKWIK-12345678",
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    assert_eq!(output.operations.len(), 1);
    let add_operation = match &output.operations[0] {
        schema::CartOperation::ProductDiscountsAdd(operation) => operation,
        unexpected => panic!("expected product discounts add operation, got {unexpected:?}"),
    };
    assert_eq!(add_operation.candidates.len(), 1);
    assert_eq!(
        add_operation.candidates[0].message.as_deref(),
        Some("Bundle Discount")
    );
    assert_eq!(add_operation.candidates[0].targets.len(), 2);
    let percentage = match &add_operation.candidates[0].value {
        schema::ProductDiscountCandidateValue::Percentage(percentage) => {
            percentage.value.to_string()
        }
        unexpected => panic!("expected percentage discount value, got {unexpected:?}"),
    };
    assert_eq!(percentage, "20.0");
}

#[test]
fn code_mode_emits_buy_x_get_y_bundle_discount_candidate() {
    let input = r#"{
        "cart": {
            "lines": [
                {
                    "id": "gid://shopify/CartLine/paid-1",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": { "value": "FBP-1_BXY_1" },
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/1",
                        "component_parents": {
                            "value": "[{\"id\":\"gid://shopify/ProductVariant/999\",\"price_adjustment\":{\"method\":\"buy_x_get_y\",\"value\":100,\"customerBuys\":1,\"customerGets\":1,\"discountType\":\"percentage\"}}]"
                        }
                    },
                    "cost": { "amountPerQuantity": { "amount": "50.00" } }
                },
                {
                    "id": "gid://shopify/CartLine/paid-2",
                    "quantity": 1,
                    "wolfpackProductBundleOfferId": { "value": "FBP-1_BXY_2" },
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/2",
                        "component_parents": null
                    },
                    "cost": { "amountPerQuantity": { "amount": "50.00" } }
                }
            ]
        },
        "discount": {
            "discountClasses": ["PRODUCT"],
            "checkoutIntegrationConfig": null
        },
        "enteredDiscountCodes": [{ "code": "WPB-GOKWIK-12345678" }],
        "triggeringDiscountCode": "WPB-GOKWIK-12345678",
        "presentmentCurrencyRate": "1.0"
    }"#;

    let output: schema::CartLinesDiscountsGenerateRunResult =
        run_function_with_input(cart_lines_discounts_generate_run, input).expect("should run");

    let add_operation = match &output.operations[0] {
        schema::CartOperation::ProductDiscountsAdd(operation) => operation,
        unexpected => panic!("expected product discounts add operation, got {unexpected:?}"),
    };
    let percentage = match &add_operation.candidates[0].value {
        schema::ProductDiscountCandidateValue::Percentage(percentage) => {
            percentage.value.to_string()
        }
        unexpected => panic!("expected percentage discount value, got {unexpected:?}"),
    };
    assert_eq!(percentage, "50.0");
}
