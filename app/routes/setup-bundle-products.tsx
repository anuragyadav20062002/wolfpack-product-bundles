import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    console.log('🏗️ Setting up bundle products...');
    
    // First, let's check existing products with bundle metafields
    const CHECK_PRODUCTS = `
      query CheckBundleProducts {
        products(first: 10, query: "bundle") {
          edges {
            node {
              id
              title
              handle
              cartTransformConfig: metafield(namespace: "bundle_discounts", key: "cart_transform_config") {
                value
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    console.log('🔍 Checking existing bundle products...');
    const checkResponse = await admin.graphql(CHECK_PRODUCTS);
    const checkData = await checkResponse.json();
    
    console.log('📋 Existing products:', checkData.data.products.edges);
    
    // Create sample bundle products if none exist with proper metafields
    const productsToCreate = [];
    const hasExistingBundleProducts = checkData.data.products.edges.some(
      edge => edge.node.cartTransformConfig?.value
    );
    
    if (!hasExistingBundleProducts) {
      console.log('🆕 Creating sample bundle products...');
      
      // Create Product 1 - T-Shirt
      const CREATE_PRODUCT_1 = `
        mutation CreateProduct1($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
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
      
      const product1Response = await admin.graphql(CREATE_PRODUCT_1, {
        variables: {
          input: {
            title: "Bundle Test T-Shirt",
            productType: "Clothing", 
            status: "ACTIVE",
            published: true,
            variants: [
              {
                price: "25.00",
                title: "Default Title"
              }
            ]
          }
        }
      });
      
      const product1Data = await product1Response.json();
      console.log('✅ Created Product 1:', product1Data.data.productCreate.product.title);
      
      // Create Product 2 - Hat  
      const product2Response = await admin.graphql(`
        mutation CreateProduct2($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
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
      `, {
        variables: {
          input: {
            title: "Bundle Test Hat",
            productType: "Accessories",
            status: "ACTIVE", 
            published: true,
            variants: [
              {
                price: "15.00",
                title: "Default Title"
              }
            ]
          }
        }
      });
      
      const product2Data = await product2Response.json();
      console.log('✅ Created Product 2:', product2Data.data.productCreate.product.title);
      
      // Create Bundle Product
      const bundleConfig = {
        id: "bundle_test_1",
        name: "T-Shirt + Hat Bundle",
        allBundleProductIds: [
          product1Data.data.productCreate.product.id,
          product2Data.data.productCreate.product.id
        ],
        pricing: {
          enableDiscount: true,
          discountMethod: "fixed_amount_off",
          rules: [
            {
              discountOn: "quantity",
              minimumQuantity: 2,
              fixedAmountOff: 5,
              percentageOff: 0
            }
          ]
        }
      };
      
      const bundleProductResponse = await admin.graphql(`
        mutation CreateBundleProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
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
      `, {
        variables: {
          input: {
            title: "T-Shirt + Hat Bundle",
            productType: "Bundle",
            status: "ACTIVE",
            published: true,
            variants: [
              {
                price: "35.00",
                title: "Bundle Variant",
                metafields: [
                  {
                    namespace: "bundle_discounts",
                    key: "cart_transform_config",
                    type: "json",
                    value: JSON.stringify(bundleConfig)
                  }
                ]
              }
            ]
          }
        }
      });
      
      const bundleProductData = await bundleProductResponse.json();
      console.log('✅ Created Bundle Product:', bundleProductData.data.productCreate.product.title);
      
      // Also set metafield on the product itself
      const SET_PRODUCT_METAFIELD = `
        mutation SetProductMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      await admin.graphql(SET_PRODUCT_METAFIELD, {
        variables: {
          metafields: [
            {
              ownerId: bundleProductData.data.productCreate.product.id,
              namespace: "bundle_discounts",
              key: "cart_transform_config", 
              type: "json",
              value: JSON.stringify(bundleConfig)
            }
          ]
        }
      });
      
      console.log('✅ Set bundle metafield on product');
      
      return json({
        success: true,
        message: 'Bundle products created successfully!',
        products: [
          product1Data.data.productCreate.product,
          product2Data.data.productCreate.product,
          bundleProductData.data.productCreate.product
        ],
        bundleConfig
      });
      
    } else {
      console.log('✅ Bundle products already exist with metafields');
      return json({
        success: true,
        message: 'Bundle products already configured',
        products: checkData.data.products.edges.map(edge => edge.node)
      });
    }
    
  } catch (error) {
    console.error('❌ Error setting up bundle products:', error);
    return json({ 
      success: false, 
      error: error.message 
    });
  }
};

export default function SetupBundleProducts() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🏗️ Bundle Products Setup</h1>
      <p>Check the console/network tab for setup results.</p>
      <p>This will create test products with proper cart transform metafields.</p>
    </div>
  );
}