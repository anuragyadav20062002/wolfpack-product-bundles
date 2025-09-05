import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { CartTransformService } from "../services/cart-transform-service.server";

export async function loader({ request }: any) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    console.log(`🚀 [MANUAL ACTIVATION] Activating cart transform for: ${session.shop}`);
    
    const result = await CartTransformService.activateForNewInstallation(admin, session.shop);
    
    return json({
      success: result.success,
      cartTransformId: result.cartTransformId,
      alreadyExists: result.alreadyExists,
      error: result.error,
      shop: session.shop,
      functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID || "527a500e-5386-4a67-a61b-9cb4cb8973f8"
    });
    
  } catch (error: any) {
    console.error("❌ [MANUAL ACTIVATION] Error:", error);
    return json(
      {
        success: false,
        error: error.message || "Failed to activate cart transform",
        shop: session.shop
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: any) {
  return loader({ request });
}