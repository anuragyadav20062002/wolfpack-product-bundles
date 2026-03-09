/**
 * Attribution API Route
 *
 * Receives UTM attribution data from the Wolfpack Web Pixel extension
 * when a checkout is completed. Creates OrderAttribution records in the database.
 *
 * This route is accessed via the app proxy: /apps/product-bundles/api/attribution
 * It does NOT require Shopify admin authentication (called from the storefront pixel).
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.json();

    const {
      orderId,
      orderNumber,
      shopId,
      totalPrice,
      currencyCode,
      lineItems,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landingPage,
    } = payload;

    // Validate required fields
    if (!shopId || !utmSource) {
      return json({ error: "Missing required fields: shopId and utmSource" }, { status: 400 });
    }

    // Calculate revenue in cents
    const revenue = totalPrice ? Math.round(parseFloat(totalPrice) * 100) : 0;

    // Find bundle IDs from line items by matching against our database
    const bundleIds: string[] = [];
    if (lineItems && lineItems.length > 0) {
      const productIds = lineItems
        .map((item: any) => item.productId)
        .filter(Boolean);

      if (productIds.length > 0) {
        const bundles = await db.bundle.findMany({
          where: {
            shopId,
            shopifyProductId: { in: productIds },
          },
          select: { id: true },
        });
        bundleIds.push(...bundles.map((b) => b.id));
      }
    }

    // Create attribution record(s) — one per bundle, or one with null bundleId if no bundles matched
    if (bundleIds.length > 0) {
      await db.orderAttribution.createMany({
        data: bundleIds.map((bundleId) => ({
          shopId,
          bundleId,
          orderId: orderId || "unknown",
          orderNumber: orderNumber || null,
          utmSource,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmContent: utmContent || null,
          utmTerm: utmTerm || null,
          landingPage: landingPage || null,
          revenue,
          currency: currencyCode || "USD",
        })),
      });
    } else {
      // Track non-bundle orders with UTM data too (for broader analytics)
      await db.orderAttribution.create({
        data: {
          shopId,
          bundleId: null,
          orderId: orderId || "unknown",
          orderNumber: orderNumber || null,
          utmSource,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmContent: utmContent || null,
          utmTerm: utmTerm || null,
          landingPage: landingPage || null,
          revenue,
          currency: currencyCode || "USD",
        },
      });
    }

    AppLogger.info("[ATTRIBUTION] Attribution recorded", {
      component: "api.attribution",
      shopId,
      utmSource,
      bundleCount: bundleIds.length,
    });

    return json({ success: true });
  } catch (error) {
    AppLogger.error("[ATTRIBUTION] Failed to record attribution", {
      component: "api.attribution",
    }, error);
    return json({ error: "Failed to record attribution" }, { status: 500 });
  }
};
