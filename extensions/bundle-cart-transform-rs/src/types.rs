/// Domain types for bundle cart transform.
///
/// These are JSON-deserialized from Shopify metafield values — NOT generated
/// by the #[typegen] macro. typegen handles the cart input schema; these types
/// handle the business-logic JSON payloads stored in metafields.

// ============================================================================
// OUTPUT STRUCTS — serialized to JSON by #[shopify_function]
// ============================================================================

#[derive(serde::Serialize, Debug)]
pub struct FunctionRunResult {
    pub operations: Vec<CartOperation>,
}

#[derive(serde::Serialize, Debug)]
pub struct CartOperation {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge: Option<MergeOperation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand: Option<ExpandOperation>,
}

impl CartOperation {
    pub fn merge(op: MergeOperation) -> Self {
        CartOperation { merge: Some(op), expand: None }
    }

    pub fn expand(op: ExpandOperation) -> Self {
        CartOperation { merge: None, expand: Some(op) }
    }
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeOperation {
    pub cart_lines: Vec<CartLineInput>,
    pub parent_variant_id: String,
    pub title: String,
    pub price: PriceAdjustmentOutput,
    pub attributes: Vec<AttributeOutput>,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CartLineInput {
    pub cart_line_id: String,
    pub quantity: i64,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PriceAdjustmentOutput {
    pub percentage_decrease: PercentageDecreaseValue,
}

#[derive(serde::Serialize, Debug)]
pub struct PercentageDecreaseValue {
    pub value: String,
}

#[derive(serde::Serialize, Debug)]
pub struct AttributeOutput {
    pub key: String,
    pub value: String,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExpandOperation {
    pub cart_line_id: String,
    pub expanded_cart_items: Vec<ExpandedCartItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price: Option<PriceAdjustmentOutput>,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExpandedCartItem {
    pub merchandise_id: String,
    pub quantity: i64,
    pub attributes: Vec<AttributeOutput>,
}

// ============================================================================
// METAFIELD JSON TYPES — deserialized from metafield values
// ============================================================================

/// Deserialized from `$app:component_parents` metafield (JSON array).
///
/// One entry per bundle parent. In practice, the current implementation writes
/// exactly one parent config per component variant. We always use index [0].
#[derive(serde::Deserialize, Debug)]
pub struct ComponentParent {
    /// Parent variant GID, e.g. "gid://shopify/ProductVariant/123"
    pub id: String,
    pub component_reference: ComponentReference,
    pub component_quantities: ComponentQuantities,
    #[serde(default)]
    pub price_adjustment: Option<PriceAdjustmentConfig>,
}

#[derive(serde::Deserialize, Debug)]
pub struct ComponentReference {
    pub value: Vec<String>,
}

#[derive(serde::Deserialize, Debug)]
pub struct ComponentQuantities {
    pub value: Vec<i64>,
}

/// Deserialized from `$app:price_adjustment` metafield.
/// Also embedded inside `ComponentParent.price_adjustment`.
#[derive(serde::Deserialize, Debug, Clone)]
pub struct PriceAdjustmentConfig {
    pub method: PricingMethod,
    pub value: f64,
    #[serde(default)]
    pub conditions: Option<Condition>,
}

#[derive(serde::Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PricingMethod {
    PercentageOff,
    FixedAmountOff,
    FixedBundlePrice,
}

/// Optional discount threshold condition.
#[derive(serde::Deserialize, Debug, Clone)]
pub struct Condition {
    #[serde(rename = "type")]
    pub condition_type: ConditionType,
    pub operator: String,  // normalized later in helpers::normalize_operator
    pub value: f64,
}

#[derive(serde::Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConditionType {
    Quantity,
    Amount,
}

/// Normalized condition operator — long-form aliases are resolved in helpers::normalize_operator.
#[derive(Debug, Clone, PartialEq)]
pub enum Operator {
    Gte,  // >=
    Gt,   // >
    Lte,  // <=
    Lt,   // <
    Eq,   // == (treated as >= at threshold — matches storefront semantics)
}

/// Deserialized from `$app:component_pricing` metafield (JSON array).
/// Contains pre-computed pricing display data for the checkout UI.
#[derive(serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComponentPricingItem {
    pub variant_id: String,         // "gid://shopify/ProductVariant/123"
    #[serde(default)]
    pub title: Option<String>,      // Product title — optional for backwards compat
    pub retail_price: i64,          // Retail price in cents
    pub bundle_price: i64,          // Discounted price in cents
    pub discount_percent: f64,      // Discount percentage (e.g. 10.0)
    pub savings_amount: i64,        // Savings in cents
}
