import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate, sessionStorage } from "../../shopify.server";
import prisma from "../../db.server";
import { ErrorPage } from "../../components/ErrorPage";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useEffect } from "react";
import { i18n } from "../../i18n/config";
import { getPolarisLocale } from "../../i18n/polaris-locales.server";
import { MantleTracker } from "../../components/MantleTracker";
import { ensureShopHasExpiringOfflineSession } from "../../services/offline-token.server";
import { AppLogger } from "../../lib/logger";
import { loadShopAdminLocale } from "../../services/admin-locale.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

function ensureExpiringOfflineSessionInBackground(shop: string) {
  void ensureShopHasExpiringOfflineSession(prisma, shop, sessionStorage).catch((error) => {
    AppLogger.error("Failed to ensure expiring offline session during app load", {
      component: "app.app",
      shop,
    }, error);
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  ensureExpiringOfflineSessionInBackground(session.shop);
  const locale = await loadShopAdminLocale(session.shop);
  const polarisTranslations = getPolarisLocale(locale);
  const mantleAppToken = process.env.MANTLE_APP_TOKEN ?? "";
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale,
    polarisTranslations,
    shop: session.shop,
    mantleAppToken,
  };
};

function AdminNavigation() {
  const { t } = useTranslation();

  return (
    <ui-nav-menu>
      <a href="/app/dashboard" rel="home">{t("nav.dashboard")}</a>
      <a href="/app/settings">{t("nav.settings")}</a>
      <a href="/app/integrations">{t("nav.integrations")}</a>
      <a href="/app/attribution">{t("nav.analytics")}</a>
      <a href="/app/events">{t("nav.events")}</a>
    </ui-nav-menu>
  );
}

export default function App() {
  const { apiKey, locale, polarisTranslations, shop, mantleAppToken } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisTranslations}>
      <I18nextProvider i18n={i18n}>
        {mantleAppToken ? (
          <MantleTracker appToken={mantleAppToken} customerId={shop} />
        ) : null}
        {/* polaris.js deferred so App Bridge (loaded statically from app/root.tsx <head>) initialises first */}
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" defer />
        <AdminNavigation />
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
