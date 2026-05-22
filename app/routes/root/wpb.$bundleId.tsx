import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { formatBundleForWidget } from "../../lib/bundle-formatter.server";
import { BundleStatus } from "../../constants/bundle";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBundlePage(options: {
  bundleId: string;
  bundleName: string;
  shopDomain: string;
  bundleConfig: unknown;
}) {
  const bundleConfig = escapeHtml(JSON.stringify(options.bundleConfig));
  const title = escapeHtml(options.bundleName || "Bundle");
  const shopDomain = encodeURIComponent(options.shopDomain);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="/apps/product-bundles/api/design-settings/${shopDomain}?bundleType=full_page">
  <link rel="stylesheet" href="/apps/product-bundles/assets/bundle-widget-full-page.css">
  <script>
    window.shopCurrency = null;
    window.shopMoneyFormat = null;
    window.shopifyMultiCurrency = {
      shopBaseCurrency: null,
      shopMoneyFormat: null,
      customerCurrency: null,
      customerMoneyFormat: null,
      isMultiCurrencyEnabled: false
    };
    window.bundleWidgetContext = true;
  </script>
</head>
<body>
  <main id="MainContent">
    <div
      id="bundle-builder-app"
      data-bundle-id="${escapeHtml(options.bundleId)}"
      data-bundle-type="full_page"
      data-bundle-config="${bundleConfig}"
      data-show-title="true"
      data-show-description="true"
      data-show-category-tabs="true"
      data-product-card-spacing="20"
      data-product-cards-per-row="4"
      data-show-promo-banner="true"
      class="bundle-widget-container bundle-widget-full-page"
    >
      <div class="bundle-loading"><div class="loading-spinner"></div></div>
    </div>
  </main>
  <script src="/apps/product-bundles/assets/bundle-widget-full-page-bundled.js" defer></script>
</body>
</html>`;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = verifyAppProxyRequest(url);
  const bundleId = params.bundleId;

  if (!shopDomain) {
    AppLogger.warn("FPB proxy page rejected unsigned request", {
      component: "wpb.proxy",
      operation: "loader",
    });
    return new Response("Invalid bundle link", { status: 400 });
  }

  if (!bundleId) {
    return new Response("Bundle ID is required", { status: 400 });
  }

  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
      shopId: shopDomain,
      bundleType: "full_page",
      status: {
        in: [BundleStatus.DRAFT, BundleStatus.ACTIVE, BundleStatus.UNLISTED],
      },
    },
    include: {
      steps: {
        include: {
          StepProduct: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      pricing: true,
    },
  });

  if (!bundle) {
    return new Response("Bundle not found", { status: 404 });
  }

  const widgetConfig = formatBundleForWidget(bundle);

  return new Response(
    renderBundlePage({
      bundleId,
      bundleName: bundle.name,
      shopDomain,
      bundleConfig: widgetConfig,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
