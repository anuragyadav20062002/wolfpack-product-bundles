import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    console.log("🔥 Creating automatic discounts for bundle functions...");

    // Get the current function ID dynamically
    const functionsResponse = await admin.graphql(`
      query {
        app {
          functions(first: 10) {
            edges {
              node {
                id
                title
                apiType
                appTitle
              }
            }
          }
        }
      }
    `);

    const functionsData = await functionsResponse.json();
    console.log("🔥 Functions Response:", JSON.stringify(functionsData, null, 2));
    
    // List all functions for debugging
    console.log("🔥 Available functions:");
    functionsData.data?.app?.functions?.edges?.forEach((edge: any, index: number) => {
      console.log(`🔥 Function ${index + 1}:`, {
        id: edge.node.id,
        title: edge.node.title,
        apiType: edge.node.apiType,
        appTitle: edge.node.appTitle
      });
    });

    // Find the bundle discount function by title/handle
    const bundleFunction = functionsData.data?.app?.functions?.edges?.find(
      (edge: any) => edge.node.title?.includes("bundle-discount-function-ts") ||
                   edge.node.title?.includes("t:name") ||
                   edge.node.id?.includes("bundle-discount-function")
    );

    if (!bundleFunction) {
      console.log("🔥 No bundle function found. Available functions:");
      functionsData.data?.app?.functions?.edges?.forEach((edge: any) => {
        console.log(`🔥 - ${edge.node.title} (${edge.node.id})`);
      });
      throw new Error("Bundle discount function not found. Please deploy the function first.");
    }

    const FUNCTION_ID = bundleFunction.node.id;
    console.log("🔥 Using Function ID:", FUNCTION_ID);

    // Create single automatic discount following Shopify reference app pattern
    const discountResponse = await admin.graphql(`
      mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
        discountCreate: discountAutomaticAppCreate(
          automaticAppDiscount: $discount
        ) {
          automaticAppDiscount {
            discountId
            title
            status
            functionId
            createdAt
          }
          userErrors {
            code
            message
            field
          }
        }
      }
    `, {
      variables: {
        discount: {
          title: "Bundle Discounts",
          functionId: FUNCTION_ID,
          startsAt: new Date().toISOString(),
          discountClasses: ["ORDER", "PRODUCT", "SHIPPING"],
          combinesWith: {
            orderDiscounts: true,
            productDiscounts: true,
            shippingDiscounts: true
          },
          metafields: [
            {
              namespace: "$app:bundle-discounts",
              key: "function-configuration",
              type: "json",
              value: JSON.stringify({
                enableBundleDiscounts: true,
                bundleTypes: ["product", "order", "shipping"]
              })
            }
          ]
        }
      }
    });

    const discountData = await discountResponse.json();
    console.log("🔥 Discount Response:", JSON.stringify(discountData, null, 2));

    // Check for errors
    const errors = discountData.data?.discountCreate?.userErrors || [];

    if (errors.length > 0) {
      console.log("🔥 Discount Creation Errors:");
      errors.forEach((error: any) => {
        console.log(`🔥 - ${error.message}`);
      });
    }

    const result = {
      success: errors.length === 0,
      discount: discountData.data?.discountCreate?.automaticAppDiscount,
      errors: errors,
    };

    console.log("🔥 Final Result:", JSON.stringify(result, null, 2));

    return json(result);

  } catch (error: any) {
    console.error("🔥 Error creating automatic discounts:", error);
    return json(
      {
        error: error.message || "Failed to create automatic discounts",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function loader({ request }: any) {
  const { admin } = await authenticate.admin(request);

  try {
    // Check existing automatic discounts
    const response = await admin.graphql(
      `#graphql
      query {
        automaticDiscountNodes(first: 50) {
          edges {
            node {
              id
              automaticDiscount {
                ... on DiscountAutomaticApp {
                  title
                  status
                  createdAt
                  functionId
                  discountId
                }
              }
            }
          }
        }
      }`
    );

    const data = await response.json();
    
    return json({
      existingDiscounts: data.data?.automaticDiscountNodes?.edges || [],
      functionId: "1a554c48-0d1c-4c77-8971-12152d1613d3"
    });

  } catch (error: any) {
    return json(
      {
        error: error.message || "Failed to check automatic discounts",
      },
      { status: 500 }
    );
  }
}