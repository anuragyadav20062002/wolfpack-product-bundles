import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { CartTransformService } from "../services/cart-transform-service.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    console.log(`🚀 Activating cart transform for shop: ${shopDomain}`);
    
    const result = await CartTransformService.completeSetup(admin, shopDomain);

    return json({
      success: result.success,
      cartTransformId: result.cartTransformId,
      alreadyExists: result.alreadyExists,
      error: result.error,
      shopDomain
    });

  } catch (error) {
    console.error("❌ Cart transform activation failed:", error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      shopDomain 
    });
  }
}