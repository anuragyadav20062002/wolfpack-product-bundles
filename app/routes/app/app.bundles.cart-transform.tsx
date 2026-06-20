import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import db from "../../db.server";
import { BillingService } from "../../services/billing.server";
import { BundleStatus } from "../../constants/bundle";
import { CartTransformBundles } from "./app.bundles.cart-transform/CartTransformBundles";

export { action } from "./app.bundles.cart-transform/action.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await requireAdminSession(request);

  const cartTransformBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: {
        in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
      }
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const subscriptionInfo = await BillingService.getSubscriptionInfo(session.shop);

  return json({
    bundles: cartTransformBundles,
    subscription: subscriptionInfo ? {
      plan: subscriptionInfo.plan,
      currentBundleCount: subscriptionInfo.currentBundleCount,
      bundleLimit: subscriptionInfo.bundleLimit,
      canCreateBundle: subscriptionInfo.canCreateBundle,
    } : null,
  });
}

export default function CartTransformRoute() {
  return <CartTransformBundles />;
}
