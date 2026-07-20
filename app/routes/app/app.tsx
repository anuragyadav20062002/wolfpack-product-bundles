import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useNavigate, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate, sessionStorage } from "../../shopify.server";
import prisma from "../../db.server";
import { ErrorPage } from "../../components/ErrorPage";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useEffect, type MouseEvent } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { changeAdminI18nLanguage, i18n, loadAdminLocaleResources } from "../../i18n/config";
import { getPolarisLocale } from "../../i18n/polaris-locales.server";
import { ensureShopHasExpiringOfflineSession } from "../../services/offline-token.server";
import { AppLogger } from "../../lib/logger";
import { loadShopAdminLocale } from "../../services/admin-locale.server";
import { ReduxProvider } from "../../store/ReduxProvider";
import { installAdminWebVitalsDiagnostics } from "../../lib/admin-web-vitals-diagnostics.client";
import { runAfterSaveBarLeaveConfirmation } from "../../lib/admin-savebar-navigation.client";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

function ensureExpiringOfflineSessionInBackground(shop: string, idToken?: string | null) {
  void ensureShopHasExpiringOfflineSession(prisma, shop, sessionStorage, { idToken }).catch((error) => {
    AppLogger.error("Failed to ensure expiring offline session during app load", {
      component: "app.app",
      shop,
    }, error);
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const idToken = new URL(request.url).searchParams.get("id_token");
  ensureExpiringOfflineSessionInBackground(session.shop, idToken);
  const [locale, shopRecord] = await Promise.all([
    loadShopAdminLocale(session.shop),
    prisma.shop.findUnique({
      where: { shopDomain: session.shop },
      select: { firstCreateTourEligible: true },
    }),
  ]);
  await loadAdminLocaleResources(locale);
  const polarisTranslations = getPolarisLocale(locale);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale,
    polarisTranslations,
    shop: session.shop,
    firstCreateTourEligible: shopRecord?.firstCreateTourEligible === true,
  };
};

function AdminNavigation() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const handleNavigation = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void runAfterSaveBarLeaveConfirmation(shopify, () => navigate(href));
  };

  return (
    <ui-nav-menu>
      <a href="/app/dashboard" rel="home" onClick={handleNavigation("/app/dashboard")}>{t("nav.dashboard")}</a>
      <a href="/app/settings" onClick={handleNavigation("/app/settings")}>{t("nav.settings")}</a>
      <a href="/app/integrations" onClick={handleNavigation("/app/integrations")}>{t("nav.integrations")}</a>
      <a href="/app/attribution" onClick={handleNavigation("/app/attribution")}>{t("nav.analytics")}</a>
      <a href="/app/events" onClick={handleNavigation("/app/events")}>{t("nav.events")}</a>
    </ui-nav-menu>
  );
}

export default function App() {
  const { apiKey, locale, polarisTranslations } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (i18n.language !== locale) {
      void changeAdminI18nLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    return installAdminWebVitalsDiagnostics();
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisTranslations}>
      <ReduxProvider>
        <I18nextProvider i18n={i18n}>
          {/* polaris.js deferred so App Bridge (loaded statically from app/root.tsx <head>) initialises first */}
          <script src="https://cdn.shopify.com/shopifycloud/polaris.js" defer />
          <AdminNavigation />
          <Outlet />
        </I18nextProvider>
      </ReduxProvider>
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
