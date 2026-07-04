#[cfg(test)]
mod tests {
    use bundle_cart_transform_rs::{cart_transform_run, schema};
    use shopify_function::run_function_with_input;
    use std::collections::HashMap;

    // =========================================================================
    // MERGE OPERATION TESTS
    // =========================================================================

    fn merge_attributes(output: &schema::FunctionRunResult) -> HashMap<String, String> {
        let merge = match &output.operations[0] {
            schema::CartOperation::LinesMerge(m) => m,
            _ => panic!("expected Merge operation"),
        };

        merge
            .attributes
            .as_ref()
            .expect("merge attributes should be present")
            .iter()
            .map(|attr| (attr.key.clone(), attr.value.clone()))
            .collect()
    }

    fn messaging_merge_input(cart_transform_fragment: &str) -> String {
        let cart_transform_fragment = if cart_transform_fragment.trim().is_empty() {
            r#""cartTransform": { "bundleCartLineMessaging": null },"#.to_string()
        } else {
            cart_transform_fragment.to_string()
        };
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": {
                "value": [
                    "gid://shopify/ProductVariant/101",
                    "gid://shopify/ProductVariant/102"
                ]
            },
            "component_quantities": { "value": [1, 2] },
            "price_adjustment": { "method": "percentage_off", "value": 20.0 }
        }])
        .to_string();
        let display_properties = serde_json::json!({
            "box": "1",
            "items": "1 x 18k Bloom Earrings, 2 x 18k Pedal Ring - 6 (6)",
            "retailPrice": "₹50",
            "youSave": {
                "amount": "₹10",
                "percentage": "20%",
                "amountPercentage": "₹10 (20%)"
            }
        })
        .to_string();

        format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            {cart_transform_fragment}
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-attrs" }},
                        "wolfpackProductBundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "18k Bloom Earrings" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "30.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 2,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-attrs" }},
                        "wolfpackProductBundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "18k Pedal Ring - 6 (6)" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "10.00" }},
                            "totalAmount": {{ "amount": "20.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        )
    }

    #[test]
    fn test_empty_cart_no_operations() {
        let input = r#"{"presentmentCurrencyRate":"1.0","cartTransform":{"bundleCartLineMessaging":null},"cart":{"lines":[]}}"#;
        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, input).expect("should not error");
        assert!(output.operations.is_empty());
    }

    #[test]
    fn test_non_bundle_line_ignored() {
        let input = r#"{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": { "bundleCartLineMessaging": null },
            "cart": {
                "lines": [{
                    "id": "line1", "quantity": 1,
                    "wolfpackProductBundleOfferId": null, "wolfpackProductBundleName": null, "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/111",
                        "component_parents": null, "component_reference": null,
                        "component_quantities": null, "price_adjustment": null,
                        "component_pricing": null,
                        "product": { "id": "gid://shopify/Product/1", "title": "Standalone" }
                    },
                    "cost": {
                        "amountPerQuantity": { "amount": "10.00" },
                        "totalAmount": { "amount": "10.00" }
                    }
                }]
            }
        }"#;
        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, input).expect("should not error");
        assert!(output.operations.is_empty());
    }

    #[test]
    fn test_merge_basic_percentage_off() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": { "method": "percentage_off", "value": 20.0 }
        }])
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "MIX-894502_K1K_1" }},
                        "wolfpackProductBundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Widget A" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "30.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "MIX-894502_K1K_2" }},
                        "wolfpackProductBundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null, "component_reference": null,
                            "component_quantities": null, "price_adjustment": null,
                            "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Widget B" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "20.00" }},
                            "totalAmount": {{ "amount": "20.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let op = &output.operations[0];
        let merge = match op {
            schema::CartOperation::LinesMerge(ref m) => m,
            _ => panic!("expected Merge operation"),
        };
        assert_eq!(merge.parent_variant_id, "gid://shopify/ProductVariant/999");
        assert_eq!(merge.title.as_deref(), Some("Test Bundle"));
        assert_eq!(merge.cart_lines.len(), 2);

        let pct = merge
            .price
            .as_ref()
            .and_then(|p| p.percentage_decrease.as_ref())
            .map(|v| v.value.to_string());
        // Decimal::from(f64) uses Rust's f64 Display — "20.0" not "20.00"
        assert_eq!(pct.as_deref(), Some("20.0"));
    }

    #[test]
    fn test_merge_excludes_gift_message_auxiliary_line() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": {
                "value": [
                    "gid://shopify/ProductVariant/101",
                    "gid://shopify/ProductVariant/102"
                ]
            },
            "component_quantities": { "value": [1, 1] },
            "price_adjustment": {
                "method": "percentage_off",
                "value": 5.0,
                "conditions": { "type": "quantity", "operator": "gte", "value": 2 }
            }
        }])
        .to_string();

        let display = serde_json::json!({
            "box": "1",
            "items": "1 x Widget A, 1 x Widget B",
            "retailPrice": "$50.00",
            "youSave": {
                "amount": "$2.50",
                "percentage": "5%",
                "amountPercentage": "$2.50 (5%)"
            }
        })
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-message" }},
                        "wolfpackProductBundleName": {{ "value": "Message Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null,
                            "component_quantities": null,
                            "price_adjustment": null,
                            "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Widget A" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "30.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-message" }},
                        "wolfpackProductBundleName": {{ "value": "Message Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null,
                            "component_quantities": null,
                            "price_adjustment": null,
                            "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Widget B" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "20.00" }},
                            "totalAmount": {{ "amount": "20.00" }}
                        }}
                    }},
                    {{
                        "id": "message-line", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-message" }},
                        "wolfpackProductBundleName": {{ "value": "Message Bundle" }},
                        "stepType": {{ "value": "gift_message" }},
                        "bundleDisplayProperties": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/9999",
                            "component_parents": null,
                            "component_reference": null,
                            "component_quantities": null,
                            "price_adjustment": null,
                            "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/9", "title": "Message Product" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "6.93" }},
                            "totalAmount": {{ "amount": "6.93" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = match &output.operations[0] {
            schema::CartOperation::LinesMerge(m) => m,
            _ => panic!("expected Merge operation"),
        };
        assert_eq!(merge.cart_lines.len(), 2);
        assert!(merge
            .cart_lines
            .iter()
            .all(|line| line.cart_line_id != "message-line"));

        let retail_total = merge.attributes.as_ref().and_then(|attrs| {
            attrs
                .iter()
                .find(|attr| attr.key == "_bundle_total_retail_cents")
                .map(|attr| attr.value.as_str())
        });
        assert_eq!(retail_total, Some("5000"));
    }

    #[test]
    fn test_merge_buy_x_get_y_component_parent() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": {
                "value": [
                    "gid://shopify/ProductVariant/101",
                    "gid://shopify/ProductVariant/102",
                    "gid://shopify/ProductVariant/103"
                ]
            },
            "component_quantities": { "value": [1, 1, 1] },
            "price_adjustment": {
                "method": "buy_x_get_y",
                "value": 100.0,
                "customerBuys": 2,
                "customerGets": 1,
                "discountType": "percentage",
                "applyDiscountTo": "lowest_priced",
                "conditions": { "type": "quantity", "operator": "gte", "value": 3 }
            }
        }])
        .to_string();
        let display_properties = serde_json::json!({
            "box": "1",
            "items": "3 x Widget",
            "retailPrice": "$30.00",
            "youSave": {
                "amount": "$10.00",
                "percentage": "33.33%",
                "amountPercentage": "$10.00 (33.33%)"
            }
        })
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 3,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-bxy" }},
                        "wolfpackProductBundleName": {{ "value": "BXY Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Widget" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "10.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = match &output.operations[0] {
            schema::CartOperation::LinesMerge(m) => m,
            _ => panic!("expected Merge operation"),
        };
        assert_eq!(merge.parent_variant_id, "gid://shopify/ProductVariant/999");
        let pct = merge
            .price
            .as_ref()
            .and_then(|p| p.percentage_decrease.as_ref())
            .map(|v| v.value.to_string());
        assert_eq!(pct.as_deref(), Some("33.3333"));

        let attributes = merge_attributes(&output);
        assert_eq!(
            attributes.get("Items").map(String::as_str),
            Some("3 x Widget")
        );
        assert_eq!(
            attributes.get("Retail Price").map(String::as_str),
            Some("$30.00")
        );
        assert_eq!(
            attributes.get("You Save").map(String::as_str),
            Some("$10.00 (33.33%)")
        );
    }

    #[test]
    fn test_merge_emits_public_cart_line_messaging_by_default() {
        let input = messaging_merge_input("");
        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let attributes = merge_attributes(&output);
        assert_eq!(attributes.get("Box").map(String::as_str), Some("1"));
        assert_eq!(attributes.get("_Items").map(String::as_str), Some(""));
        assert_eq!(
            attributes.get("Items").map(String::as_str),
            Some("1 x 18k Bloom Earrings, 2 x 18k Pedal Ring - 6 (6)")
        );
        assert_eq!(
            attributes.get("Retail Price").map(String::as_str),
            Some("₹50")
        );
        assert_eq!(
            attributes.get("You Save").map(String::as_str),
            Some("₹10 (20%)")
        );
    }

    #[test]
    fn test_merge_keeps_display_only_fixed_price_at_component_total() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": {
                "value": [
                    "gid://shopify/ProductVariant/101",
                    "gid://shopify/ProductVariant/102"
                ]
            },
            "price_adjustment": { "method": "fixed_bundle_price", "value": 500.0 }
        }])
        .to_string();
        let display_properties = serde_json::json!({
            "box": "1",
            "items": "1 x First product, 1 x Second product"
        })
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-fixed_1" }},
                        "wolfpackProductBundleName": {{ "value": "Daily Essentials" }},
                        "stepType": {{ "value": "fixed_price_display_only" }},
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "First product" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "829.00" }},
                            "totalAmount": {{ "amount": "829.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-fixed_2" }},
                        "wolfpackProductBundleName": {{ "value": "Daily Essentials" }},
                        "stepType": {{ "value": "fixed_price_display_only" }},
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Second product" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "619.00" }},
                            "totalAmount": {{ "amount": "619.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = match &output.operations[0] {
            schema::CartOperation::LinesMerge(m) => m,
            _ => panic!("expected Merge operation"),
        };
        let pct = merge
            .price
            .as_ref()
            .and_then(|p| p.percentage_decrease.as_ref())
            .map(|v| v.value.to_string());
        assert_eq!(pct.as_deref(), Some("0.0"));

        let attributes = merge_attributes(&output);
        assert_eq!(
            attributes.get("_bundle_total_retail_cents").map(String::as_str),
            Some("144800")
        );
        assert_eq!(
            attributes.get("_bundle_total_price_cents").map(String::as_str),
            Some("144800")
        );
        assert_eq!(
            attributes.get("_bundle_total_savings_cents").map(String::as_str),
            Some("0")
        );
        assert_eq!(
            attributes.get("_bundle_discount_percent").map(String::as_str),
            Some("0.00")
        );
        assert_eq!(
            attributes.get("Items").map(String::as_str),
            Some("1 x First product, 1 x Second product")
        );
        assert!(!attributes.contains_key("Retail Price"));
        assert!(!attributes.contains_key("You Save"));
    }

    #[test]
    fn test_merge_uses_cart_line_messaging_settings_from_function_owner() {
        let settings = serde_json::json!({
            "isEnabled": true,
            "showBundleContains": false,
            "showOriginalPrice": false,
            "discountDisplay": {
                "isEnabled": false,
                "format": "amount_percentage"
            }
        })
        .to_string();
        let input = messaging_merge_input(&format!(
            r#""cartTransform": {{ "bundleCartLineMessaging": {{ "value": {settings:?} }} }},"#
        ));

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let attributes = merge_attributes(&output);
        assert_eq!(attributes.get("Box").map(String::as_str), Some("1"));
        assert_eq!(attributes.get("_Items").map(String::as_str), Some(""));
        assert!(!attributes.contains_key("Items"));
        assert!(!attributes.contains_key("Retail Price"));
        assert!(!attributes.contains_key("You Save"));
    }

    #[test]
    fn test_merge_duplicate_name_unique_title() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": null
        }])
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-001" }},
                        "wolfpackProductBundleName": {{ "value": "Summer Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant", "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "A" }}
                        }},
                        "cost": {{ "amountPerQuantity": {{ "amount": "10.00" }}, "totalAmount": {{ "amount": "10.00" }} }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-002" }},
                        "wolfpackProductBundleName": {{ "value": "Summer Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant", "id": "gid://shopify/ProductVariant/201",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "B" }}
                        }},
                        "cost": {{ "amountPerQuantity": {{ "amount": "10.00" }}, "totalAmount": {{ "amount": "10.00" }} }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 2);
        let titles: Vec<_> = output
            .operations
            .iter()
            .filter_map(|op| match op {
                schema::CartOperation::LinesMerge(m) => m.title.as_deref(),
                _ => None,
            })
            .collect();
        assert!(titles.contains(&"Summer Bundle"));
        assert!(titles.contains(&"Summer Bundle (2)"));
    }

    #[test]
    fn test_merge_selects_matching_parent_when_component_has_multiple_parents() {
        let cp = serde_json::json!([
            {
                "id": "gid://shopify/ProductVariant/OLD_PARENT",
                "component_reference": { "value": ["gid://shopify/ProductVariant/777"] },
                "component_quantities": { "value": [1] },
                "price_adjustment": { "method": "percentage_off", "value": 5.0 }
            },
            {
                "id": "gid://shopify/ProductVariant/SIDEBAR_PARENT",
                "component_reference": {
                    "value": [
                        "gid://shopify/ProductVariant/101",
                        "gid://shopify/ProductVariant/102"
                    ]
                },
                "component_quantities": { "value": [1, 1] },
                "price_adjustment": { "method": "percentage_off", "value": 20.0 }
            }
        ])
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "sidebar-instance-1" }},
                        "wolfpackProductBundleName": {{ "value": "Full Page Sidebar Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Widget A" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "30.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "sidebar-instance-1" }},
                        "wolfpackProductBundleName": {{ "value": "Full Page Sidebar Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Widget B" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "20.00" }},
                            "totalAmount": {{ "amount": "20.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = match &output.operations[0] {
            schema::CartOperation::LinesMerge(m) => m,
            _ => panic!("expected Merge operation"),
        };
        assert_eq!(
            merge.parent_variant_id,
            "gid://shopify/ProductVariant/SIDEBAR_PARENT"
        );

        let pct = merge
            .price
            .as_ref()
            .and_then(|p| p.percentage_decrease.as_ref())
            .map(|v| v.value.to_string());
        assert_eq!(pct.as_deref(), Some("20.0"));
    }

    #[test]
    fn test_merge_keeps_paid_addon_line_separate() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": {
                "value": [
                    "gid://shopify/ProductVariant/101",
                    "gid://shopify/ProductVariant/102"
                ]
            },
            "component_quantities": { "value": [1, 1] },
            "price_adjustment": { "method": "percentage_off", "value": 0.0 }
        }])
        .to_string();
        let display_properties = serde_json::json!({
            "box": "1",
            "items": "1 x Widget A, 1 x Widget B",
            "retailPrice": "$50.00"
        })
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-addon" }},
                        "wolfpackProductBundleName": {{ "value": "Add-on Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Widget A" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "30.00" }},
                            "totalAmount": {{ "amount": "30.00" }}
                        }}
                    }},
                    {{
                        "id": "line2", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-addon" }},
                        "wolfpackProductBundleName": {{ "value": "Add-on Bundle" }},
                        "stepType": null,
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Widget B" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "20.00" }},
                            "totalAmount": {{ "amount": "20.00" }}
                        }}
                    }},
                    {{
                        "id": "addon-line", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-addon" }},
                        "wolfpackProductBundleName": {{ "value": "Add-on Bundle" }},
                        "stepType": {{ "value": "addon:PERCENTAGE:10" }},
                        "bundleDisplayProperties": {{ "value": {display_properties:?} }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/103",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/3", "title": "Add-on" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "60.00" }},
                            "totalAmount": {{ "amount": "60.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = output
            .operations
            .iter()
            .find_map(|operation| match operation {
                schema::CartOperation::LinesMerge(m) => Some(m),
                _ => None,
            })
            .expect("expected paid bundle lines to merge");
        let merged_line_ids: Vec<&str> = merge
            .cart_lines
            .iter()
            .map(|line| line.cart_line_id.as_str())
            .collect();
        assert_eq!(merged_line_ids, vec!["line1", "line2"]);

        let attributes: HashMap<String, String> = merge
            .attributes
            .as_ref()
            .expect("merge attributes should be present")
            .iter()
            .map(|attr| (attr.key.clone(), attr.value.clone()))
            .collect();
        assert_eq!(
            attributes
                .get("_bundle_component_count")
                .map(String::as_str),
            Some("2")
        );
        assert_eq!(
            attributes
                .get("_bundle_total_retail_cents")
                .map(String::as_str),
            Some("5000")
        );

        let line_update = output
            .operations
            .iter()
            .find(|operation| matches!(operation, schema::CartOperation::LineUpdate(_)));
        assert!(
            line_update.is_none(),
            "paid add-on discounting is handled by the Discount Function"
        );
    }

    #[test]
    fn test_merge_applies_free_gift_component_attributes() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": { "method": "percentage_off", "value": 0.0 }
        }])
        .to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [
                    {{
                        "id": "paid-line", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-free-gift" }},
                        "wolfpackProductBundleName": {{ "value": "Free Gift Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp:?} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Paid Product" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "123.00" }},
                            "totalAmount": {{ "amount": "123.00" }}
                        }}
                    }},
                    {{
                        "id": "free-gift-line", "quantity": 1,
                        "wolfpackProductBundleOfferId": {{ "value": "bundle-with-free-gift" }},
                        "wolfpackProductBundleName": {{ "value": "Free Gift Bundle" }},
                        "stepType": {{ "value": "free_gift" }},
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Free Add-on" }}
                        }},
                        "cost": {{
                            "amountPerQuantity": {{ "amount": "123.00" }},
                            "totalAmount": {{ "amount": "123.00" }}
                        }}
                    }}
                ]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let attributes = merge_attributes(&output);
        assert_eq!(
            attributes
                .get("_bundle_total_retail_cents")
                .map(String::as_str),
            Some("24600")
        );
        assert_eq!(
            attributes
                .get("_bundle_total_price_cents")
                .map(String::as_str),
            Some("12300")
        );
        assert_eq!(
            attributes
                .get("_bundle_total_savings_cents")
                .map(String::as_str),
            Some("12300")
        );
        assert_eq!(
            attributes
                .get("_bundle_discount_percent")
                .map(String::as_str),
            Some("50.00")
        );
    }

    // =========================================================================
    // EXPAND OPERATION TESTS
    // =========================================================================

    #[test]
    fn test_expand_basic() {
        let cr = serde_json::json!(["gid://shopify/ProductVariant/A"]).to_string();
        let cq = serde_json::json!([1]).to_string();
        let cp_arr = serde_json::json!([{
            "variantId": "gid://shopify/ProductVariant/A",
            "title": "Comp A",
            "retailPrice": 5000, "bundlePrice": 4500,
            "discountPercent": 10.0, "savingsAmount": 500
        }])
        .to_string();
        let pa = serde_json::json!({ "method": "percentage_off", "value": 10.0 }).to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [{{
                    "id": "flex-line", "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "wolfpackProductBundleName": {{ "value": "Flex Bundle" }},
                    "stepType": null,
                    "merchandise": {{
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/PARENT",
                        "component_parents": null,
                        "component_reference": {{ "value": {cr:?} }},
                        "component_quantities": {{ "value": {cq:?} }},
                        "price_adjustment": {{ "value": {pa:?} }},
                        "component_pricing": {{ "value": {cp_arr:?} }},
                        "product": {{ "id": "gid://shopify/Product/10", "title": "Flex Bundle" }}
                    }},
                    "cost": {{
                        "amountPerQuantity": {{ "amount": "45.00" }},
                        "totalAmount": {{ "amount": "45.00" }}
                    }}
                }}]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let op = &output.operations[0];
        let expand = match op {
            schema::CartOperation::LineExpand(ref e) => e,
            _ => panic!("expected Expand operation"),
        };
        assert_eq!(expand.cart_line_id, "flex-line");
        assert_eq!(expand.expanded_cart_items.len(), 1);
        // Flex Bundle: same merchandise ID as input
        assert_eq!(
            expand.expanded_cart_items[0].merchandise_id,
            "gid://shopify/ProductVariant/PARENT"
        );
        // 10% discount → price field included
        assert!(expand.price.is_some());
    }

    #[test]
    fn test_expand_no_discount_no_price_field() {
        let cr = serde_json::json!(["gid://shopify/ProductVariant/A"]).to_string();
        let cq = serde_json::json!([1]).to_string();

        let input = format!(
            r#"{{
            "presentmentCurrencyRate": "1.0",
            "cartTransform": {{ "bundleCartLineMessaging": null }},
            "cart": {{
                "lines": [{{
                    "id": "flex-line-2", "quantity": 1,
                    "wolfpackProductBundleOfferId": null,
                    "wolfpackProductBundleName": {{ "value": "No Discount Bundle" }},
                    "stepType": null,
                    "merchandise": {{
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/PARENT2",
                        "component_parents": null,
                        "component_reference": {{ "value": {cr:?} }},
                        "component_quantities": {{ "value": {cq:?} }},
                        "price_adjustment": null,
                        "component_pricing": null,
                        "product": {{ "id": "gid://shopify/Product/20", "title": "No Discount Bundle" }}
                    }},
                    "cost": {{
                        "amountPerQuantity": {{ "amount": "50.00" }},
                        "totalAmount": {{ "amount": "50.00" }}
                    }}
                }}]
            }}
        }}"#
        );

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let expand = match &output.operations[0] {
            schema::CartOperation::LineExpand(e) => e,
            _ => panic!("expected EXPAND"),
        };
        assert!(expand.price.is_none(), "price should be absent at 0%");
    }
}
