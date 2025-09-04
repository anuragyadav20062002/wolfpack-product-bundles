// Simple activation script using app's existing infrastructure
import { authenticate } from "../app/shopify.server.js";

async function activateCartTransform() {
  console.log('🚀 Activating cart transform function...');
  
  // Mock request object to get admin access
  const mockRequest = {
    headers: {
      'host': 'wolfpack-store-test-1.myshopify.com',
      'authorization': 'Bearer mock' // This will use your app's stored session
    },
    url: '/activate-cart-transform'
  };

  try {
    const { admin } = await authenticate.admin(mockRequest);
    
    // Function ID from your .env file
    const functionId = "527a500e-5386-4a67-a61b-9cb4cb8973f8";
    
    console.log(`📍 Using function ID: ${functionId}`);
    
    const CREATE_CART_TRANSFORM = `
      mutation CreateCartTransform($functionId: String!) {
        cartTransformCreate(functionId: $functionId) {
          cartTransform {
            id
            functionId
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const response = await admin.graphql(CREATE_CART_TRANSFORM, {
      variables: { functionId }
    });
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ GraphQL Errors:', data.errors);
      return;
    }
    
    if (data.data.cartTransformCreate.userErrors.length > 0) {
      console.error('❌ User Errors:');
      data.data.cartTransformCreate.userErrors.forEach(error => {
        console.error(`  - ${error.message}`);
      });
      return;
    }
    
    console.log('🎉 Cart transform activated successfully!');
    console.log('📍 CartTransform ID:', data.data.cartTransformCreate.cartTransform.id);
    console.log('✅ Your cart transform function is now live!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If auth fails, let's try using curl with the app info
    console.log('\n📋 Manual activation instructions:');
    console.log('1. Get your app access token from Partner Dashboard');
    console.log('2. Run this curl command:');
    console.log(`
curl -X POST \\
  https://wolfpack-store-test-1.myshopify.com/admin/api/2025-01/graphql.json \\
  -H 'X-Shopify-Access-Token: YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "mutation { cartTransformCreate(functionId: \\"527a500e-5386-4a67-a61b-9cb4cb8973f8\\") { cartTransform { id } userErrors { message } } }"
  }'
    `);
  }
}

activateCartTransform();