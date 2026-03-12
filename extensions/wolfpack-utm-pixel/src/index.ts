import { register } from "@shopify/web-pixels-extension";

const UTM_STORAGE_KEY = "_wolfpack_utm_params";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * Extract UTM parameters from a URL string.
 * Returns null if no UTM params are present.
 */
function extractUtmParams(url: string): Record<string, string> | null {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    let hasUtm = false;

    for (const key of UTM_PARAMS) {
      const value = urlObj.searchParams.get(key);
      if (value) {
        params[key] = value;
        hasUtm = true;
      }
    }

    if (hasUtm) {
      params.landing_page = urlObj.pathname + urlObj.search;
      params.captured_at = new Date().toISOString();
      return params;
    }
  } catch (_e) {
    // Invalid URL — ignore
  }
  return null;
}

register(({ analytics, browser, settings }) => {
  const appServerUrl = settings.app_server_url as string | undefined;

  // ── page_viewed: Capture UTMs from the landing URL (first-touch only) ──
  analytics.subscribe("page_viewed", async (event) => {
    try {
      const url = event.context?.document?.location?.href;
      if (!url) return;

      const utmParams = extractUtmParams(url);
      if (!utmParams) return;

      // Only store if no UTMs captured yet (first-touch attribution model)
      const existing = await browser.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (!existing) {
        await browser.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
      }
    } catch (_e) {
      // Silently fail — pixel errors must not affect storefront
    }
  });

  // ── checkout_completed: Send attribution data to server ──
  analytics.subscribe("checkout_completed", async (event) => {
    try {
      const storedUtms = await browser.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (!storedUtms || !appServerUrl) return;

      const utmParams = JSON.parse(storedUtms) as Record<string, string>;
      const checkout = event.data?.checkout;
      if (!checkout) return;

      const payload = {
        orderId: checkout.order?.id ?? null,
        orderNumber: (checkout.order as any)?.name ?? null,
        shopId: event.context?.document?.location?.hostname ?? null,
        totalPrice: checkout.totalPrice?.amount ?? null,
        currencyCode: checkout.totalPrice?.currencyCode ?? "USD",
        lineItems: (checkout.lineItems ?? []).map((item: any) => ({
          productId: item.variant?.product?.id ?? null,
          variantId: item.variant?.id ?? null,
          title: item.title ?? null,
          quantity: item.quantity ?? 0,
          price: item.variant?.price?.amount ?? null,
        })),
        utmSource: utmParams.utm_source ?? null,
        utmMedium: utmParams.utm_medium ?? null,
        utmCampaign: utmParams.utm_campaign ?? null,
        utmContent: utmParams.utm_content ?? null,
        utmTerm: utmParams.utm_term ?? null,
        landingPage: utmParams.landing_page ?? null,
      };

      // POST directly to the app server attribution endpoint.
      // The Remix route is at /api/attribution on the server.
      // Do NOT include /apps/product-bundles — that prefix is stripped by Shopify's
      // App Proxy when forwarding storefront requests; the server itself never sees it.
      await fetch(`${appServerUrl}/api/attribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      // Clear stored UTMs after successful send
      await browser.sessionStorage.removeItem(UTM_STORAGE_KEY);
    } catch (_e) {
      // Silently fail — pixel errors must not affect checkout
    }
  });
});
