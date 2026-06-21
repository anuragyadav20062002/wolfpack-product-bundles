import { defer, json, type ActionFunctionArgs, type HeadersFunction, type LinksFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { loaderCache } from "../../../lib/loader-cache.server";
import { ServerTiming } from "../../../lib/server-timing.server";
import { requireAdminSession } from "../../../lib/auth-guards.server";
import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { BillingService } from "../../../services/billing.server";
import { checkAppEmbedEnabled } from "../../../services/theme/app-embed-check.server";
import { BundleStatus, BundleType } from "../../../constants/bundle";
import { handleCreatePreviewPage } from "../app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import { saveShopAdminLocale } from "../../../services/admin-locale.server";
import { handleCloneBundle, handleDeleteBundle } from "./handlers";
import { DashboardPage } from "./DashboardPage";

/**
 * Preload first-viewport dashboard images via real
 * `<link rel="preload" as="image">` tags emitted during HTML parse.
 * The app embed card image is the measured embedded-app LCP candidate.
 */
export const links: LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "/Parth.avif",
    imageSrcSet: "/Parth.avif 120w",
    imageSizes: "120px",
    type: "image/avif",
    fetchpriority: "high",
  } as ReturnType<LinksFunction>[number],
  {
    rel: "preload",
    as: "image",
    href: "/appEmbed.avif",
    imageSrcSet: "/appEmbed.avif 420w",
    imageSizes: "420px",
    type: "image/avif",
    fetchpriority: "high",
  } as ReturnType<LinksFunction>[number],
];

export const headers: HeadersFunction = () => ({
  Link: [
    "</appEmbed.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high",
    "</Parth.avif>; rel=preload; as=image; type=image/avif; fetchpriority=high",
  ].join(", "),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Issue: admin-lcp-phase4-loaders-1.
  // Was: sequential awaits for bundles -> embed-check -> billing -> proxy-health -> shop-graphql.
  // Now: bundles first (required for the rest), then Promise.all the four independent
  // calls. embed-check + billing + shop-graphql additionally cached via loaderCache so
  // back-to-back admin navigations re-use the same result within 30 s.
  const timing = new ServerTiming();
  const { session, admin } = await timing.track("auth", () => requireAdminSession(request));

  const bundles = await timing.track("db.bundles", () => db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT, BundleStatus.UNLISTED] }
    },
    select: {
      id: true, name: true, status: true, bundleType: true, createdAt: true,
      shopifyProductId: true, shopifyProductHandle: true, shopifyPageHandle: true,
      pricing: { select: { enabled: true } },
    },
    orderBy: { createdAt: "desc" },
  }));

  const bundlesNeedingBackfill = bundles.filter(
    b => b.bundleType === BundleType.PRODUCT_PAGE && b.shopifyProductId && !b.shopifyProductHandle
  );

  if (bundlesNeedingBackfill.length > 0) {
    try {
      const productIds = bundlesNeedingBackfill.map(b => b.shopifyProductId).filter(Boolean);
      const GET_PRODUCTS = `query GetProductHandles($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id handle } } }`;
      const response = await timing.track("graphql.product-handles", () => admin.graphql(GET_PRODUCTS, { variables: { ids: productIds } }));
      const data = await response.json();
      if (data.data?.nodes) {
        // Parallelise the per-bundle DB updates instead of awaiting each in series.
        const updates: Promise<unknown>[] = [];
        for (const node of data.data.nodes) {
          if (node?.id && node?.handle) {
            const bundleToUpdate = bundlesNeedingBackfill.find(b => b.shopifyProductId === node.id);
            if (bundleToUpdate) {
              bundleToUpdate.shopifyProductHandle = node.handle;
              updates.push(db.bundle.update({ where: { id: bundleToUpdate.id }, data: { shopifyProductHandle: node.handle } }));
            }
          }
        }
        if (updates.length > 0) await timing.track("db.backfill-updates", () => Promise.all(updates));
      }
    } catch (error) {
      AppLogger.error("Failed to backfill product handles", { component: "app.dashboard", operation: "backfill-product-handles" }, error);
    }
  }

  const bundlesWithPreview = bundles.map(bundle => ({
    ...bundle,
    previewHandle: bundle.bundleType === BundleType.PRODUCT_PAGE ? bundle.shopifyProductHandle : bundle.id
  }));

  const apiKey = process.env.SHOPIFY_API_KEY || "63077bb0483a6ce08a2d6139b14d170b";
  const SHORT_TTL_MS = 30_000;

  // Issue: admin-lcp-phase6-defer-skeletons-1.
  // embed-check stays eager — its outputs (`themeEditorUrl`, `appEmbedEnabled`)
  // are consumed inside `useCallback` click handlers that must be wired at
  // first render. Cached for ~30 s so its actual cost is usually <30 ms.
  // billing + proxy-health are kicked off concurrently here and surfaced via
  // a deferred `banners` promise so the bundles table can paint without
  // blocking on the 3-second proxy-health abort timeout.
  const billingPromise = loaderCache.memo(
    `billing:${session.shop}`,
    async () => {
      try { return await BillingService.getSubscriptionInfo(session.shop); }
      catch (error) {
        AppLogger.error("Failed to fetch subscription info", { component: "app.dashboard", operation: "get-subscription-info" }, error);
        return null;
      }
    },
    SHORT_TTL_MS,
  );
  const proxyHealthPromise = (async () => {
    try {
      const controller = new AbortController();
      const proxyTimer = setTimeout(() => controller.abort(), 3000);
      const proxyRes = await fetch(`https://${session.shop}/apps/product-bundles/api/proxy-health`, { signal: controller.signal });
      clearTimeout(proxyTimer);
      if (proxyRes.status === 404) {
        const ct = proxyRes.headers.get("content-type") ?? "";
        if (ct.includes("text/html")) {
          AppLogger.warn("App proxy health check failed", { component: "app.dashboard", operation: "proxy-health-check", shop: session.shop });
          return false;
        }
      }
    } catch { /* Timeout — default healthy */ }
    return true;
  })();

  const embedCheck = await timing.track("embed-check", () => loaderCache.memo(
    `embed-check:${session.shop}`,
    () => checkAppEmbedEnabled(admin, session.shop, { blockHandles: ["bundle-app-embed"] }),
    SHORT_TTL_MS,
  ));

  const banners = (async () => {
    const [subscriptionInfo, proxyHealthy] = await Promise.all([billingPromise, proxyHealthPromise]);
    return {
      subscription: subscriptionInfo ? {
        plan: subscriptionInfo.plan,
        currentBundleCount: subscriptionInfo.currentBundleCount,
        bundleLimit: subscriptionInfo.bundleLimit,
        canCreateBundle: subscriptionInfo.canCreateBundle,
      } : null,
      proxyHealthy,
    };
  })();

  const themeEditorUrl = embedCheck.themeId
    ? `https://${session.shop}/admin/themes/${embedCheck.themeId.split("/").pop()}/editor?context=apps&appEmbed=${apiKey}%2Fbundle-app-embed`
    : null;
  const appEmbedEnabled = embedCheck.enabled;

  const appUrl = process.env.SHOPIFY_APP_URL;
  if (appUrl) {
    void (async () => {
      try {
        const existingPixelRes = await admin.graphql(`query { webPixel { id settings } }`);
        const existingPixelData = await existingPixelRes.json();
        const existingId = existingPixelData.data?.webPixel?.id;
        const existingSettings = existingPixelData.data?.webPixel?.settings as Record<string, string> | null;
        if (existingId && existingSettings?.app_server_url === appUrl) {
          // Pixel correct — nothing to do.
        } else {
          if (existingId) {
            await admin.graphql(`mutation webPixelDelete($id: ID!) { webPixelDelete(id: $id) { deletedWebPixelId userErrors { field message } } }`, { variables: { id: existingId } });
          }
          const createRes = await admin.graphql(
            `mutation webPixelCreate($webPixel: WebPixelInput!) { webPixelCreate(webPixel: $webPixel) { userErrors { field message code } webPixel { id settings } } }`,
            { variables: { webPixel: { settings: { app_server_url: appUrl } } } }
          );
          const createData = await createRes.json();
          const errs = createData.data?.webPixelCreate?.userErrors || [];
          if (errs.length > 0) {
            AppLogger.warn("UTM pixel create/reconnect had errors on dashboard load", { component: "app.dashboard", operation: "ensure-web-pixel" }, errs);
          }
        }
      } catch (_err) { /* Non-critical */ }
    })();
  }

  return defer({
    bundles: bundlesWithPreview,
    shop: session.shop,
    appUrl,
    themeEditorUrl,
    appEmbedEnabled,
    banners,
  }, { headers: timing.toHeaders() });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await requireAdminSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "cloneBundle") return handleCloneBundle(admin, session, formData);
  if (intent === "deleteBundle") return handleDeleteBundle(admin, session, formData);
  if (intent === "saveAdminLocale") {
    try {
      const locale = await saveShopAdminLocale(session.shop, String(formData.get("locale") || ""));
      return json({ success: true, locale });
    } catch {
      return json({ success: false, error: "Unsupported Admin locale" }, { status: 400 });
    }
  }
  if (intent === "createPreviewPage") {
    const bundleId = String(formData.get("bundleId") || "");
    if (!bundleId) return json({ success: false, error: "Missing bundleId" }, { status: 400 });
    return handleCreatePreviewPage(admin, session, bundleId);
  }
  return json({ error: "Unknown action" }, { status: 400 });
};

export default function Dashboard() {
  return <DashboardPage />;
}
