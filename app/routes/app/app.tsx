import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../../shopify.server";
import { ErrorPage } from "../../components/ErrorPage";
import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
import { i18n, isSupportedLocale } from "../../i18n/config";
import { getPolarisLocale } from "../../i18n/polaris-locales.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale") ?? "en";
  const locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const polarisTranslations = getPolarisLocale(locale);
  return { apiKey: process.env.SHOPIFY_API_KEY || "", locale, polarisTranslations };
};

export default function App() {
  const { apiKey, locale, polarisTranslations } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisTranslations}>
      <I18nextProvider i18n={i18n}>
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
