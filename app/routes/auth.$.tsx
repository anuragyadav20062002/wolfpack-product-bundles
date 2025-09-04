import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { CartTransformService } from "../services/cart-transform-service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Automatically activate cart transform for new installations
  try {
    const shopDomain = session.shop;
    console.log(`🔧 [AUTH] Setting up cart transform for shop: ${shopDomain}`);
    
    const result = await CartTransformService.completeSetup(admin, shopDomain);
    
    if (result.success) {
      console.log(`✅ [AUTH] Cart transform setup completed for ${shopDomain}`);
    } else {
      console.error(`❌ [AUTH] Cart transform setup failed for ${shopDomain}:`, result.error);
    }
  } catch (error) {
    console.error("❌ [AUTH] Error during cart transform setup:", error);
  }

  return redirect("/app");
};
