import type { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { ensureShopIdentity, recordBusinessEvent } from "../app-events.server";

type AdminApiContext = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

type PreviewEventBundle = {
  id: string;
  bundleType: string | null;
  status: string | null;
};

export async function recordFirstBundlePreviewEvent({
  admin,
  shopDomain,
  bundle,
  bundleLink,
  routeFamily,
}: {
  admin: AdminApiContext;
  shopDomain: string;
  bundle: PreviewEventBundle;
  bundleLink: string;
  routeFamily: string;
}): Promise<boolean> {
  try {
    const existingEvent = await db.businessEvent.findFirst({
      where: {
        eventHandle: "bundle_previewed",
        shopDomain,
        bundleId: bundle.id,
      },
      select: { id: true },
    });

    if (existingEvent) return false;

    const shopifyShopGid = await ensureShopIdentity(admin, shopDomain);

    await recordBusinessEvent({
      eventHandle: "bundle_previewed",
      shopDomain,
      shopifyShopGid,
      bundleId: bundle.id,
      bundleType: bundle.bundleType,
      surface: "admin",
      actor: "merchant",
      routeFamily,
      result: "success",
      idempotencyKey: `bundle-previewed:${bundle.id}`,
      attributes: {
        bundle_status: bundle.status,
        bundle_link: bundleLink,
      },
    });

    return true;
  } catch (error) {
    AppLogger.warn("Failed to record first bundle preview event", {
      component: "bundle-preview-event",
      operation: "record-first-preview",
      shop: shopDomain,
      bundleId: bundle.id,
    }, error);
    return false;
  }
}
