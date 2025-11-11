# Requirements Document

## Introduction

The cart transform function in the Shopify product bundling application is failing to apply discount and merge operations to bundle products. Analysis of server logs reveals multiple issues:

1. **Bundle Widget Properties (RESOLVED)**: Bundle products were being added to cart without the required `_bundle_id` cart line properties. This has been fixed and the cart transform now correctly detects bundle lines.

2. **Shop Metafield Access (CURRENT ISSUE)**: The cart transform function receives `input.shop.all_bundles` as `null` even though server logs show successful metafield creation in the `custom` namespace. Analysis reveals two potential causes:
   - **Access Permissions**: Metafield definition may lack proper `storefront: PUBLIC_READ` access
   - **Data Size**: Shop metafield contains 11,799 bytes of data including unnecessary StepProduct arrays, images, and metadata, potentially causing silent failures due to cart transform instruction limits

The cart transform function can detect bundle products in cart lines but cannot access the bundle configurations needed to create merge operations, resulting in empty operations arrays.

## Glossary

- **Cart Transform Function**: Shopify Plus feature that modifies cart contents in real-time during checkout
- **Bundle Instance ID**: Unique identifier for a specific bundle configuration (format: bundleId_hash)
- **Shop Metafield**: Store-level metafield containing all bundle configurations for cart transform access
- **Metafield Definition**: Shopify schema definition that controls access permissions and data types for metafields
- **Storefront Access**: Permission setting that allows cart transform functions to read metafield data
- **Component Products**: Individual products that make up a bundle
- **Merge Operation**: Cart transform operation that combines multiple cart lines into a single bundle line
- **Bundle Parent Variant ID**: The variant ID of the bundle container product used as the merge target
- **Cart Line Properties**: Key-value pairs added to cart items that become `attribute.value` in cart transform
- **Bundle Widget**: Frontend component that displays bundle options and handles add-to-cart functionality
- **Cart Transform Input**: The data structure passed to the cart transform function containing cart lines and shop data

## Requirements

### Requirement 1

**User Story:** As a customer, I want bundle products in my cart to be automatically merged into a single line item with the correct discount applied, so that I see the bundle as one item with the discounted price.

#### Acceptance Criteria

1. WHEN a customer adds bundle component products to their cart, THE Cart_Transform_Function SHALL merge the component lines into a single bundle line
2. WHEN the merge operation is created, THE Cart_Transform_Function SHALL apply the configured discount percentage to the bundle
3. WHEN multiple bundle instances exist in the cart, THE Cart_Transform_Function SHALL process each bundle instance separately
4. IF the bundle configuration is missing required data, THEN THE Cart_Transform_Function SHALL log the missing data and skip that bundle
5. WHERE bundle pricing is configured, THE Cart_Transform_Function SHALL calculate the discount based on the actual cart total

### Requirement 2

**User Story:** As a developer, I want the cart transform function to properly access bundle configuration data, so that it can process bundles without encountering null reference errors.

#### Acceptance Criteria

1. WHEN the cart transform function executes, THE Cart_Transform_Function SHALL successfully read bundle configurations from the shop metafield
2. WHEN the shop metafield is null or empty, THE Cart_Transform_Function SHALL fallback to product-level metafields
3. WHEN parsing bundle configurations, THE Cart_Transform_Function SHALL handle JSON parsing errors gracefully
4. IF bundle configuration data is corrupted, THEN THE Cart_Transform_Function SHALL log the error and continue processing other bundles
5. WHERE bundle configurations are found, THE Cart_Transform_Function SHALL validate required fields before processing

### Requirement 3

**User Story:** As a system administrator, I want comprehensive logging in the cart transform function, so that I can diagnose issues when bundles are not processing correctly.

#### Acceptance Criteria

1. WHEN the cart transform function starts, THE Cart_Transform_Function SHALL log the input cart structure and bundle detection results
2. WHEN bundle configurations are loaded, THE Cart_Transform_Function SHALL log the number of configurations found and their sources
3. WHEN merge operations are created, THE Cart_Transform_Function SHALL log the operation details including discount calculations
4. IF any step fails, THEN THE Cart_Transform_Function SHALL log the specific error with context
5. WHERE operations are completed, THE Cart_Transform_Function SHALL log the final operations array before returning

### Requirement 4

**User Story:** As a bundle administrator, I want the cart transform to work with the existing bundle configuration format, so that I don't need to recreate all bundle configurations.

#### Acceptance Criteria

1. WHEN processing widget-based bundles, THE Cart_Transform_Function SHALL extract the base bundle ID from the bundle instance ID
2. WHEN looking up bundle configurations, THE Cart_Transform_Function SHALL match both instance ID and base bundle ID formats
3. WHEN the bundleParentVariantId is missing, THE Cart_Transform_Function SHALL log a clear error message and skip the bundle
4. IF the bundle configuration format is invalid, THEN THE Cart_Transform_Function SHALL attempt to normalize the data structure
5. WHERE multiple configuration sources exist, THE Cart_Transform_Function SHALL prioritize the most reliable source

### Requirement 5

**User Story:** As a customer using the bundle widget, I want bundle products to be added to cart with the correct bundle identification properties, so that the cart transform function can detect and process them.

#### Acceptance Criteria

1. WHEN a customer adds bundle products through the bundle widget, THE Bundle_Widget SHALL add each product with a `_bundle_id` property containing the bundle instance ID
2. WHEN products are added to cart, THE Bundle_Widget SHALL ensure the bundle instance ID follows the format `bundleId_hash`
3. WHEN the cart transform function receives cart data, THE Cart_Transform_Function SHALL find cart lines with `attribute.value` containing bundle instance IDs
4. IF bundle products are added without bundle ID properties, THEN THE Cart_Transform_Function SHALL log a warning and skip processing those items
5. WHERE multiple products belong to the same bundle instance, THE Bundle_Widget SHALL use the same bundle instance ID for all related products

### Requirement 6

**User Story:** As a quality assurance tester, I want the cart transform function to handle edge cases gracefully, so that the checkout process never breaks due to bundle processing errors.

#### Acceptance Criteria

1. WHEN the cart is empty, THE Cart_Transform_Function SHALL return an empty operations array without errors
2. WHEN bundle products are missing from the cart, THE Cart_Transform_Function SHALL skip those bundles without affecting others
3. WHEN pricing calculations result in invalid values, THE Cart_Transform_Function SHALL default to no discount
4. IF the function encounters an unexpected error, THEN THE Cart_Transform_Function SHALL return an empty operations array and log the error
5. WHERE the function execution time is excessive, THE Cart_Transform_Function SHALL optimize processing to stay within Shopify's limits

### Requirement 7

**User Story:** As a cart transform function, I want to access shop-level bundle configurations through the shop metafield, so that I can load bundle data and create merge operations.

#### Acceptance Criteria

1. WHEN the cart transform function queries the shop metafield, THE Shop_Metafield SHALL be accessible with `storefront: PUBLIC_READ` permissions
2. WHEN the shop metafield definition is created, THE Metafield_Definition SHALL have the correct namespace `custom` and key `all_bundles`
3. WHEN existing metafield definitions conflict with access permissions, THE Bundle_Save_Process SHALL update or recreate the definition with proper access
4. IF the shop metafield definition does not exist, THEN THE Bundle_Save_Process SHALL create a new definition with `storefront: PUBLIC_READ` access
5. WHERE the cart transform receives `input.shop.all_bundles` as null, THE System SHALL log the metafield access issue and attempt fallback configuration loading

### Requirement 8

**User Story:** As a cart transform function, I want the shop metafield to contain only essential bundle data, so that I can process bundles efficiently without exceeding size or instruction limits.

#### Acceptance Criteria

1. WHEN storing bundle configurations in the shop metafield, THE Bundle_Save_Process SHALL include only essential fields required for cart transform operations
2. WHEN the shop metafield is created, THE Bundle_Configuration SHALL exclude unnecessary data such as full StepProduct arrays, images, and UI-specific metadata
3. WHEN the shop metafield size exceeds reasonable limits, THE Bundle_Save_Process SHALL optimize the data structure to reduce size
4. IF the shop metafield contains excessive data, THEN THE Cart_Transform_Function SHALL fail silently due to instruction count limits
5. WHERE bundle configurations are optimized, THE Essential_Fields SHALL include bundleId, bundleParentVariantId, pricing rules, and component product IDs only