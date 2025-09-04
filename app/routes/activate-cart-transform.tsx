import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    console.log('🚀 Activating cart transform function...');
    
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
    
    console.log('🔍 Raw response:', JSON.stringify(data, null, 2));
    
    if ((data as any).errors) {
      console.error('❌ GraphQL Errors:', (data as any).errors);
      return json({ success: false, errors: (data as any).errors });
    }
    
    if (data.data.cartTransformCreate.userErrors.length > 0) {
      console.error('❌ User Errors:', data.data.cartTransformCreate.userErrors);
      return json({ 
        success: false, 
        errors: data.data.cartTransformCreate.userErrors 
      });
    }
    
    console.log('🎉 Cart transform activated successfully!');
    console.log('📍 CartTransform ID:', data.data.cartTransformCreate.cartTransform.id);
    
    return json({
      success: true,
      cartTransform: data.data.cartTransformCreate.cartTransform,
      message: 'Cart transform function activated successfully!'
    });
    
  } catch (error) {
    console.error('❌ Error activating cart transform:', error);
    return json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
};

export default function ActivateCartTransform() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🚀 Cart Transform Activation</h1>
      <p>Check the console/network tab for activation results.</p>
      <p>If successful, your cart transform function is now active!</p>
    </div>
  );
}