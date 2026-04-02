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

  // ── page_viewed: Capture UTMs from the landing URL (last-touch) ──
  // Uses localStorage (persists across sessions) and always overwrites so the
  // most recent UTM click gets credit (last-touch attribution model).
  analytics.subscribe("page_viewed", async (event) => {
    try {
      const url = event.context?.document?.location?.href;
      if (!url) return;

      const utmParams = extractUtmParams(url);
      if (!utmParams) return;

      // Last-touch: always overwrite with the most recent UTM click
      await browser.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    } catch (_e) {
      // Silently fail — pixel errors must not affect storefront
    }
  });

  // ── checkout_completed: Send attribution data to server ──
  // Always fires, even when no UTMs are stored, so that bundle revenue is tracked
  // for direct / organic traffic. UTM fields are null when not available.
  analytics.subscribe("checkout_completed", async (event) => {
    try {
      if (!appServerUrl) return;

      const checkout = event.data?.checkout;
      if (!checkout) return;

      // Read UTMs from localStorage — null object when customer arrived without UTMs
      const storedUtmsRaw = await browser.localStorage.getItem(UTM_STORAGE_KEY);
      const utmParams: Record<string, string> = storedUtmsRaw
        ? (JSON.parse(storedUtmsRaw) as Record<string, string>)
        : {};

      // Normalise order ID — may be a GID ("gid://shopify/Order/123") or plain number
      const rawOrderId = checkout.order?.id != null ? String(checkout.order.id) : null;
      const orderNumber = rawOrderId
        ? (rawOrderId.includes("/") ? rawOrderId.split("/").pop() ?? null : rawOrderId)
        : null;

      const payload = {
        orderId: rawOrderId,
        orderNumber,
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
      // Do NOT include /apps/product-bundles — that prefix is stripped by the App Proxy;
      // the server itself never sees it.
      await fetch(`${appServerUrl}/api/attribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      // Clear stored UTMs after successful send
      if (storedUtmsRaw) {
        await browser.localStorage.removeItem(UTM_STORAGE_KEY);
      }
    } catch (_e) {
      // Silently fail — pixel errors must not affect checkout
    }
  });
});
