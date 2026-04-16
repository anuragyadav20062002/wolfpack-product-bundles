#[cfg(test)]
mod tests {
    use shopify_function::run_function_with_input;
    use bundle_cart_transform_rs::{cart_transform_run, schema};

    // =========================================================================
    // MERGE OPERATION TESTS
    // =========================================================================

    #[test]
    fn test_empty_cart_no_operations() {
        let input = r#"{"presentmentCurrencyRate":"1.0","cart":{"lines":[]}}"#;
        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, input).expect("should not error");
        assert!(output.operations.is_empty());
    }

    #[test]
    fn test_non_bundle_line_ignored() {
        let input = r#"{
            "presentmentCurrencyRate": "1.0",
            "cart": {
                "lines": [{
                    "id": "line1", "quantity": 1,
                    "bundleId": null, "bundleName": null, "stepType": null,
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
        }]).to_string();

        let input = format!(r#"{{
            "presentmentCurrencyRate": "1.0",
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "bundleId": {{ "value": "bundle-abc" }},
                        "bundleName": {{ "value": "Test Bundle" }},
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
                        "bundleId": {{ "value": "bundle-abc" }},
                        "bundleName": {{ "value": "Test Bundle" }},
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
        }}"#);

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let op = &output.operations[0];
        let merge = match op {
            schema::CartOperation::Merge(ref m) => m,
            _ => panic!("expected Merge operation"),
        };
        assert_eq!(merge.parent_variant_id, "gid://shopify/ProductVariant/999");
        assert_eq!(merge.title.as_deref(), Some("Test Bundle"));
        assert_eq!(merge.cart_lines.len(), 2);

        let pct = merge.price.as_ref()
            .and_then(|p| p.percentage_decrease.as_ref())
            .map(|v| v.value.to_string());
        // Decimal::from(f64) uses Rust's f64 Display — "20.0" not "20.00"
        assert_eq!(pct.as_deref(), Some("20.0"));
    }

    #[test]
    fn test_merge_duplicate_name_unique_title() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": null
        }]).to_string();

        let input = format!(r#"{{
            "presentmentCurrencyRate": "1.0",
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "bundleId": {{ "value": "bundle-001" }},
                        "bundleName": {{ "value": "Summer Bundle" }},
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
                        "bundleId": {{ "value": "bundle-002" }},
                        "bundleName": {{ "value": "Summer Bundle" }},
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
        }}"#);

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 2);
        let titles: Vec<_> = output.operations.iter()
            .filter_map(|op| match op {
                schema::CartOperation::Merge(m) => m.title.as_deref(),
                _ => None,
            })
            .collect();
        assert!(titles.contains(&"Summer Bundle"));
        assert!(titles.contains(&"Summer Bundle (2)"));
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
        }]).to_string();
        let pa = serde_json::json!({ "method": "percentage_off", "value": 10.0 }).to_string();

        let input = format!(r#"{{
            "presentmentCurrencyRate": "1.0",
            "cart": {{
                "lines": [{{
                    "id": "flex-line", "quantity": 1,
                    "bundleId": null,
                    "bundleName": {{ "value": "Flex Bundle" }},
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
        }}"#);

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let op = &output.operations[0];
        let expand = match op {
            schema::CartOperation::Expand(ref e) => e,
            _ => panic!("expected Expand operation"),
        };
        assert_eq!(expand.cart_line_id, "flex-line");
        assert_eq!(expand.expanded_cart_items.len(), 1);
        // Flex Bundle: same merchandise ID as input
        assert_eq!(expand.expanded_cart_items[0].merchandise_id, "gid://shopify/ProductVariant/PARENT");
        // 10% discount → price field included
        assert!(expand.price.is_some());
    }

    #[test]
    fn test_expand_no_discount_no_price_field() {
        let cr = serde_json::json!(["gid://shopify/ProductVariant/A"]).to_string();
        let cq = serde_json::json!([1]).to_string();

        let input = format!(r#"{{
            "presentmentCurrencyRate": "1.0",
            "cart": {{
                "lines": [{{
                    "id": "flex-line-2", "quantity": 1,
                    "bundleId": null,
                    "bundleName": {{ "value": "No Discount Bundle" }},
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
        }}"#);

        let output: schema::FunctionRunResult =
            run_function_with_input(cart_transform_run, &input).expect("should not error");
        assert_eq!(output.operations.len(), 1);

        let expand = match &output.operations[0] {
            schema::CartOperation::Expand(e) => e,
            _ => panic!("expected EXPAND"),
        };
        assert!(expand.price.is_none(), "price should be absent at 0%");
    }
}
