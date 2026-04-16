/// Integration tests for the bundle cart transform Rust function.
///
/// These tests use the `run_function_with_input` helper from the `shopify_function`
/// crate, which exercises the full stack: JSON deserialization → run() → JSON output.
///
/// JSON fixtures are equivalent to the TypeScript vitest fixtures in
/// extensions/bundle-cart-transform-ts/. Lifting them here ensures behavioural parity.
///
/// Run: `cargo test` (native, no WASM target needed)
#[cfg(test)]
mod tests {
    use shopify_function::run_function_with_input;

    // =========================================================================
    // MERGE OPERATION TESTS
    // =========================================================================

    /// Empty cart → no operations
    #[test]
    fn test_empty_cart_no_operations() {
        let input = r#"{
            "presentmentCurrencyRate": 1.0,
            "cart": { "lines": [] }
        }"#;
        let output = run_function_with_input(input).expect("function should not error");
        assert!(output.operations.is_empty(), "expected no operations for empty cart");
    }

    /// Cart line with no _bundle_id → no operations
    #[test]
    fn test_non_bundle_line_ignored() {
        let input = r#"{
            "presentmentCurrencyRate": 1.0,
            "cart": {
                "lines": [{
                    "id": "line1",
                    "quantity": 1,
                    "bundleId": null,
                    "bundleName": null,
                    "stepType": null,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/111",
                        "component_parents": null,
                        "component_reference": null,
                        "component_quantities": null,
                        "price_adjustment": null,
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
        let output = run_function_with_input(input).expect("function should not error");
        assert!(output.operations.is_empty());
    }

    /// Basic MERGE: two component lines with _bundle_id, percentage_off discount
    #[test]
    fn test_merge_basic_percentage_off() {
        let component_parents_json = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": { "method": "percentage_off", "value": 20.0 }
        }]);

        let input = format!(r#"{{
            "presentmentCurrencyRate": 1.0,
            "cart": {{
                "lines": [
                    {{
                        "id": "line1",
                        "quantity": 1,
                        "bundleId": {{ "value": "bundle-abc" }},
                        "bundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant",
                            "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {component_parents} }},
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
                        "id": "line2",
                        "quantity": 1,
                        "bundleId": {{ "value": "bundle-abc" }},
                        "bundleName": {{ "value": "Test Bundle" }},
                        "stepType": null,
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
                    }}
                ]
            }}
        }}"#, component_parents = component_parents_json.to_string());

        let output = run_function_with_input(&input).expect("function should not error");
        assert_eq!(output.operations.len(), 1, "expected exactly 1 MERGE operation");

        let op = &output.operations[0];
        assert!(op.merge.is_some(), "expected a MERGE operation");
        assert!(op.expand.is_none());

        let merge = op.merge.as_ref().unwrap();
        assert_eq!(merge.parent_variant_id, "gid://shopify/ProductVariant/999");
        assert_eq!(merge.title, "Test Bundle");
        assert_eq!(merge.cart_lines.len(), 2);

        // 20% discount: percentageDecrease value should be "20.00"
        assert_eq!(merge.price.percentage_decrease.value, "20.00");

        // Verify _bundle_discount_percent attribute
        let discount_attr = merge.attributes.iter()
            .find(|a| a.key == "_bundle_discount_percent")
            .expect("_bundle_discount_percent attribute missing");
        assert_eq!(discount_attr.value, "20.00");
    }

    /// Two instances of the same bundle name → second gets " (2)" suffix
    #[test]
    fn test_merge_duplicate_name_unique_title() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": null
        }]);
        let cp_str = cp.to_string();

        let input = format!(r#"{{
            "presentmentCurrencyRate": 1.0,
            "cart": {{
                "lines": [
                    {{
                        "id": "line1", "quantity": 1,
                        "bundleId": {{ "value": "bundle-001" }},
                        "bundleName": {{ "value": "Summer Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant", "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp} }},
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
                            "component_parents": {{ "value": {cp} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "B" }}
                        }},
                        "cost": {{ "amountPerQuantity": {{ "amount": "10.00" }}, "totalAmount": {{ "amount": "10.00" }} }}
                    }}
                ]
            }}
        }}"#, cp = cp_str);

        let output = run_function_with_input(&input).expect("function should not error");
        assert_eq!(output.operations.len(), 2);
        let titles: Vec<_> = output.operations.iter()
            .filter_map(|op| op.merge.as_ref().map(|m| m.title.as_str()))
            .collect();
        assert!(titles.contains(&"Summer Bundle"),   "first instance should be 'Summer Bundle'");
        assert!(titles.contains(&"Summer Bundle (2)"), "second instance should be 'Summer Bundle (2)'");
    }

    /// Free-gift line: _bundle_step_type=free_gift should be absorbed (discount covers its cost)
    #[test]
    fn test_merge_free_gift_absorption() {
        let cp = serde_json::json!([{
            "id": "gid://shopify/ProductVariant/999",
            "component_reference": { "value": [] },
            "component_quantities": { "value": [] },
            "price_adjustment": null  // No explicit discount — free-gift absorption only
        }]);

        let input = format!(r#"{{
            "presentmentCurrencyRate": 1.0,
            "cart": {{
                "lines": [
                    {{
                        "id": "paid-line", "quantity": 1,
                        "bundleId": {{ "value": "bundle-fg" }},
                        "bundleName": {{ "value": "Gift Bundle" }},
                        "stepType": null,
                        "merchandise": {{
                            "__typename": "ProductVariant", "id": "gid://shopify/ProductVariant/101",
                            "component_parents": {{ "value": {cp} }},
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/1", "title": "Paid Item" }}
                        }},
                        "cost": {{ "amountPerQuantity": {{ "amount": "80.00" }}, "totalAmount": {{ "amount": "80.00" }} }}
                    }},
                    {{
                        "id": "gift-line", "quantity": 1,
                        "bundleId": {{ "value": "bundle-fg" }},
                        "bundleName": {{ "value": "Gift Bundle" }},
                        "stepType": {{ "value": "free_gift" }},
                        "merchandise": {{
                            "__typename": "ProductVariant", "id": "gid://shopify/ProductVariant/102",
                            "component_parents": null,
                            "component_reference": null, "component_quantities": null,
                            "price_adjustment": null, "component_pricing": null,
                            "product": {{ "id": "gid://shopify/Product/2", "title": "Free Gift" }}
                        }},
                        "cost": {{ "amountPerQuantity": {{ "amount": "20.00" }}, "totalAmount": {{ "amount": "20.00" }} }}
                    }}
                ]
            }}
        }}"#, cp = cp.to_string());

        let output = run_function_with_input(&input).expect("function should not error");
        assert_eq!(output.operations.len(), 1);

        let merge = output.operations[0].merge.as_ref().unwrap();
        // paid=$80, free_gift=$20, original=$100
        // effectivePct = (1 - 80/100)*100 = 20.0
        assert_eq!(merge.price.percentage_decrease.value, "20.00",
            "free-gift absorption should produce 20% effective discount");
    }

    // =========================================================================
    // EXPAND OPERATION TESTS
    // =========================================================================

    /// Basic EXPAND: bundle parent variant with component_reference + component_quantities
    #[test]
    fn test_expand_basic() {
        let cr  = serde_json::json!(["gid://shopify/ProductVariant/A", "gid://shopify/ProductVariant/B"]);
        let cq  = serde_json::json!([1, 2]);
        let cp  = serde_json::json!([
            { "variantId": "gid://shopify/ProductVariant/A", "title": "Comp A", "retailPrice": 5000, "bundlePrice": 4500, "discountPercent": 10.0, "savingsAmount": 500 },
            { "variantId": "gid://shopify/ProductVariant/B", "title": "Comp B", "retailPrice": 3000, "bundlePrice": 2700, "discountPercent": 10.0, "savingsAmount": 300 }
        ]);
        let pa  = serde_json::json!({ "method": "percentage_off", "value": 10.0 });

        let input = format!(r#"{{
            "presentmentCurrencyRate": 1.0,
            "cart": {{
                "lines": [{{
                    "id": "flex-line",
                    "quantity": 1,
                    "bundleId": null,
                    "bundleName": {{ "value": "Flex Bundle" }},
                    "stepType": null,
                    "merchandise": {{
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/PARENT",
                        "component_parents": null,
                        "component_reference": {{ "value": {cr} }},
                        "component_quantities": {{ "value": {cq} }},
                        "price_adjustment": {{ "value": {pa} }},
                        "component_pricing": {{ "value": {cp} }},
                        "product": {{ "id": "gid://shopify/Product/10", "title": "Flex Bundle" }}
                    }},
                    "cost": {{
                        "amountPerQuantity": {{ "amount": "110.00" }},
                        "totalAmount": {{ "amount": "110.00" }}
                    }}
                }}]
            }}
        }}"#,
            cr = cr.to_string(), cq = cq.to_string(),
            cp = cp.to_string(), pa = pa.to_string()
        );

        let output = run_function_with_input(&input).expect("function should not error");
        assert_eq!(output.operations.len(), 1);

        let op = &output.operations[0];
        assert!(op.expand.is_some(), "expected an EXPAND operation");
        assert!(op.merge.is_none());

        let expand = op.expand.as_ref().unwrap();
        assert_eq!(expand.cart_line_id, "flex-line");
        assert_eq!(expand.expanded_cart_items.len(), 1);

        // Flex Bundle: same merchandise ID as input
        assert_eq!(expand.expanded_cart_items[0].merchandise_id, "gid://shopify/ProductVariant/PARENT");

        // 10% discount → price field included
        assert!(expand.price.is_some());
        assert_eq!(expand.price.as_ref().unwrap().percentage_decrease.value, "10.00");
    }

    /// EXPAND with 0% discount → price field omitted (matches TS spread pattern)
    #[test]
    fn test_expand_no_discount_no_price_field() {
        let cr = serde_json::json!(["gid://shopify/ProductVariant/A"]);
        let cq = serde_json::json!([1]);

        let input = format!(r#"{{
            "presentmentCurrencyRate": 1.0,
            "cart": {{
                "lines": [{{
                    "id": "flex-line-2",
                    "quantity": 1,
                    "bundleId": null,
                    "bundleName": {{ "value": "No Discount Bundle" }},
                    "stepType": null,
                    "merchandise": {{
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/PARENT2",
                        "component_parents": null,
                        "component_reference": {{ "value": {cr} }},
                        "component_quantities": {{ "value": {cq} }},
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
        }}"#, cr = cr.to_string(), cq = cq.to_string());

        let output = run_function_with_input(&input).expect("function should not error");
        assert_eq!(output.operations.len(), 1);

        let expand = output.operations[0].expand.as_ref().expect("expected EXPAND");
        assert!(expand.price.is_none(), "price field should be absent when discount = 0%");
    }
}
