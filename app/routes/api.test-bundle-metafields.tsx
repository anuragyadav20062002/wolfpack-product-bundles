import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    console.log("🧪 [TEST_METAFIELDS] Testing bundle metafield setup");
    
    // Create test products for bundle
    const CREATE_PRODUCT = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Create bundle parent product
    const bundleProductResponse = await admin.graphql(CREATE_PRODUCT, {
      variables: {
        input: {
          title: "Test Bundle Product",
          productType: "Bundle",
          status: "DRAFT",
          variants: [{
            price: "50.00",
            inventoryQuantity: 100,
            inventoryManagement: "SHOPIFY"
          }]
        }
      }
    });

    const bundleProductData = await bundleProductResponse.json();
    const bundleProduct = bundleProductData.data?.productCreate?.product;
    const bundleVariantId = bundleProduct?.variants?.edges?.[0]?.node?.id;

    if (!bundleProduct || !bundleVariantId) {
      throw new Error("Failed to create bundle product");
    }

    console.log("🧪 [TEST_METAFIELDS] Bundle product created:", bundleProduct.id);
    console.log("🧪 [TEST_METAFIELDS] Bundle variant ID:", bundleVariantId);

    // Create component products
    const componentProducts = [];
    
    for (let i = 1; i <= 2; i++) {
      const componentResponse = await admin.graphql(CREATE_PRODUCT, {
        variables: {
          input: {
            title: `Test Component Product ${i}`,
            productType: "Component",
            status: "DRAFT",
            variants: [{
              price: `${15 + i * 5}.00`,
              inventoryQuantity: 100,
              inventoryManagement: "SHOPIFY"
            }]
          }
        }
      });

      const componentData = await componentResponse.json();
      const componentProduct = componentData.data?.productCreate?.product;
      const componentVariantId = componentProduct?.variants?.edges?.[0]?.node?.id;
      
      if (componentProduct && componentVariantId) {
        componentProducts.push({
          product: componentProduct,
          variantId: componentVariantId
        });
        console.log(`🧪 [TEST_METAFIELDS] Component ${i} created:`, componentProduct.id, componentVariantId);
      }
    }

    // Now set up the metafields following official Shopify pattern
    
    // 1. Create metafield definitions
    const METAFIELD_DEFINITIONS = [
      {
        namespace: "custom",
        key: "component_reference",
        name: "Component Reference",
        description: "Bundle component variant IDs",
        type: "list.product_reference",
        ownerType: "PRODUCT"
      },
      {
        namespace: "custom", 
        key: "component_quantities",
        name: "Component Quantities",
        description: "Bundle component quantities", 
        type: "list.number_integer",
        ownerType: "PRODUCT"
      },
      {
        namespace: "custom",
        key: "component_parents",
        name: "Component Parents", 
        description: "Bundle parent configurations",
        type: "json",
        ownerType: "PRODUCT"
      },
      {
        namespace: "custom",
        key: "price_adjustment",
        name: "Price Adjustment",
        description: "Bundle price adjustment configuration", 
        type: "number_decimal",
        ownerType: "PRODUCT"
      }
    ];

    const CREATE_DEFINITION = `
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            namespace
            key
            type {
              name
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Create definitions
    for (const definition of METAFIELD_DEFINITIONS) {
      try {
        const defResponse = await admin.graphql(CREATE_DEFINITION, {
          variables: { definition }
        });
        const defData = await defResponse.json();
        console.log(`🧪 [TEST_METAFIELDS] Definition created:`, definition.key, defData.data?.metafieldDefinitionCreate?.createdDefinition?.type?.name);
      } catch (error) {
        console.log(`🧪 [TEST_METAFIELDS] Definition may already exist:`, definition.key);
      }
    }

    // 2. Set bundle parent metafields (for expand operation)
    const componentReferences = componentProducts.map(c => c.variantId);
    const componentQuantities = [1, 1]; // 1 of each component

    const SET_BUNDLE_METAFIELDS = `
      mutation SetBundleMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const bundleMetafields = [
      {
        ownerId: bundleProduct.id,
        namespace: "custom",
        key: "component_reference",
        type: "list.product_reference",
        value: componentReferences
      },
      {
        ownerId: bundleProduct.id,
        namespace: "custom", 
        key: "component_quantities",
        type: "list.number_integer",
        value: componentQuantities
      },
      {
        ownerId: bundleProduct.id,
        namespace: "custom",
        key: "price_adjustment",
        type: "number_decimal",
        value: 10.5
      }
    ];

    const bundleMetafieldResponse = await admin.graphql(SET_BUNDLE_METAFIELDS, {
      variables: { metafields: bundleMetafields }
    });

    const bundleMetafieldData = await bundleMetafieldResponse.json();
    console.log("🧪 [TEST_METAFIELDS] Bundle metafields set:", bundleMetafieldData.data?.metafieldsSet?.metafields?.map((m: any) => ({key: m.key, value: m.value})));

    // 3. Set component parent metafields (for merge operation)
    const componentParentsData = [{
      id: bundleVariantId,
      component_reference: {
        value: componentReferences
      },
      component_quantities: {
        value: componentQuantities
      },
      price_adjustment: {
        value: 10.5
      }
    }];

    for (const component of componentProducts) {
      const componentMetafields = [{
        ownerId: component.product.id,
        namespace: "custom",
        key: "component_parents", 
        type: "json",
        value: JSON.stringify(componentParentsData)
      }];

      const componentMetafieldResponse = await admin.graphql(SET_BUNDLE_METAFIELDS, {
        variables: { metafields: componentMetafields }
      });

      const componentMetafieldData = await componentMetafieldResponse.json();
      console.log(`🧪 [TEST_METAFIELDS] Component ${component.product.title} metafields set:`, componentMetafieldData.data?.metafieldsSet?.metafields?.map((m: any) => ({key: m.key, value: m.value})));
    }

    console.log("🧪 [TEST_METAFIELDS] Test bundle setup completed successfully!");

    return json({
      success: true,
      message: "Test bundle metafields created successfully",
      data: {
        bundleProduct: {
          id: bundleProduct.id,
          title: bundleProduct.title,
          variantId: bundleVariantId
        },
        componentProducts: componentProducts.map(c => ({
          id: c.product.id,
          title: c.product.title,
          variantId: c.variantId
        })),
        metafields: {
          componentReferences,
          componentQuantities,
          componentParentsData
        }
      }
    });

  } catch (error) {
    console.error("🧪 [TEST_METAFIELDS] Error:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};