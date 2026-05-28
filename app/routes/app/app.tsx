import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse, useSearchParams } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate, sessionStorage } from "../../shopify.server";
import prisma from "../../db.server";
import { ErrorPage } from "../../components/ErrorPage";
import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
import { i18n, isSupportedLocale } from "../../i18n/config";
import { getPolarisLocale } from "../../i18n/polaris-locales.server";
import { MantleTracker } from "../../components/MantleTracker";
import { ensureShopHasExpiringOfflineSession } from "../../services/offline-token.server";
import { AppLogger } from "../../lib/logger";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  try {
    await ensureShopHasExpiringOfflineSession(prisma, session.shop, sessionStorage);
  } catch (error) {
    AppLogger.error("Failed to ensure expiring offline session during app load", {
      component: "app.app",
      shop: session.shop,
    }, error);
  }
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale") ?? "en";
  const locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const polarisTranslations = getPolarisLocale(locale);
  const mantleAppToken = process.env.MANTLE_APP_TOKEN || "";
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale,
    polarisTranslations,
    shop: session.shop,
    mantleAppToken,
  };
};

export default function App() {
  const { apiKey, polarisTranslations, shop, mantleAppToken } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlLocale = searchParams.get("locale");
    let target: string;
    if (urlLocale && isSupportedLocale(urlLocale)) {
      target = urlLocale;
      localStorage.setItem("wolfpack-locale", target);
    } else {
      target = localStorage.getItem("wolfpack-locale") ?? "en";
    }
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [searchParams]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisTranslations}>
      <I18nextProvider i18n={i18n}>
        {mantleAppToken ? (
          <MantleTracker appToken={mantleAppToken} customerId={shop} />
        ) : null}
        {/* polaris.js deferred so App Bridge (injected above by AppProvider) initialises first */}
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" defer />
        <ui-nav-menu>
          <a href="/app/dashboard" rel="home">Dashboard</a>
          <a href="/app/design-control-panel">Design Control Panel</a>
          <a href="/app/attribution">Analytics</a>
          <a href="/app/pricing">Pricing</a>
          <a href="/app/events">Updates &amp; FAQs</a>
        </ui-nav-menu>
        <Outlet />
      </I18nextProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status !== 401 && error.status !== 403) {
    return <ErrorPage error={error} />;
  }
  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
