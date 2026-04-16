import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { CartTransformService } from "../../services/cart-transform-service.server";
import { AppLogger } from "../../lib/logger";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await requireAdminSession(request);
  const shopDomain = session.shop;

  try {
    const force = new URL(request.url).searchParams.get('force') === 'true';
    AppLogger.info('Activating cart transform', { operation: 'activate-cart-transform', shopId: shopDomain }, { force });

    const result = force
      ? await CartTransformService.forceReactivate(admin, shopDomain)
      : await CartTransformService.completeSetup(admin, shopDomain);

    return json({
      success: result.success,
      cartTransformId: result.cartTransformId,
      alreadyExists: result.alreadyExists,
      error: result.error,
      shopDomain
    });

  } catch (error) {
    AppLogger.error('Cart transform activation failed', { operation: 'activate-cart-transform' }, error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      shopDomain 
    });
  }
}