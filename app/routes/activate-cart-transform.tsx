import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { AppLogger } from "../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    AppLogger.info('Activating cart transform function', { operation: 'activate-cart-transform' });
    
    // Function ID from your .env file
    const functionId = process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID
    
    AppLogger.debug('Using function ID', { operation: 'activate-cart-transform' }, { functionId });
    
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
    
    AppLogger.debug('GraphQL response received', { operation: 'activate-cart-transform' }, data);
    
    if ((data as any).errors) {
      AppLogger.error('GraphQL errors in cart transform activation', { operation: 'activate-cart-transform' }, (data as any).errors);
      return json({ success: false, errors: (data as any).errors });
    }
    
    if (data.data.cartTransformCreate.userErrors.length > 0) {
      AppLogger.error('User errors in cart transform creation', { operation: 'activate-cart-transform' }, data.data.cartTransformCreate.userErrors);
      return json({ 
        success: false, 
        errors: data.data.cartTransformCreate.userErrors 
      });
    }
    
    AppLogger.info('Cart transform activated successfully', { operation: 'activate-cart-transform' }, { 
      cartTransformId: data.data.cartTransformCreate.cartTransform.id 
    });
    
    return json({
      success: true,
      cartTransform: data.data.cartTransformCreate.cartTransform,
      message: 'Cart transform function activated successfully!'
    });
    
  } catch (error) {
    AppLogger.error('Error activating cart transform', { operation: 'activate-cart-transform' }, error);
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