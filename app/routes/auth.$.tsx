import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { CartTransformService } from "../services/cart-transform-service.server";
import { AppLogger } from "../lib/logger";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Automatically activate cart transform for new installations
  try {
    const shopDomain = session.shop;
    AppLogger.info("Setting up cart transform", { component: "auth.$", operation: "setup", shop: shopDomain });

    const result = await CartTransformService.completeSetup(admin, shopDomain);

    if (result.success) {
      AppLogger.info("Cart transform setup completed", { component: "auth.$", operation: "setup", shop: shopDomain });
    } else {
      AppLogger.error("Cart transform setup failed", { component: "auth.$", operation: "setup", shop: shopDomain }, new Error(result.error));
    }
  } catch (error) {
    AppLogger.error("Error during cart transform setup", { component: "auth.$", operation: "setup" }, error);
  }

  return redirect("/app");
};
