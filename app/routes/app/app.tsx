import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../../shopify.server";
import { ErrorPage } from "../../components/ErrorPage";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Layout handles auth: token exchange, exit-iframe bounce, and session storage.
// Child routes under /app authenticate via App Bridge's Authorization header
// (added automatically on client-side navigations).
//
// IMPORTANT: app._index.tsx must NOT call authenticate.admin() or do server-side
// redirects — Remix runs layout and child loaders in parallel, and a child
// redirect short-circuits Promise.all before the layout's token exchange completes.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app/dashboard" rel="home">
          Dashboard
        </a>
        <a href="/app/design-control-panel">Design Control Panel</a>
        <a href="/app/attribution">Analytics</a>
        <a href="/app/pricing">Pricing</a>
        <a href="/app/events">Events</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
// For 4xx application errors we show a branded error page; auth errors are delegated to boundary.error().
export function ErrorBoundary() {
  const error = useRouteError();
  // boundary.error() handles Shopify auth redirects (401/403 from authenticate.admin).
  // For all other route error responses (4xx from application code), show our branded page.
  if (isRouteErrorResponse(error) && error.status !== 401 && error.status !== 403) {
    return <ErrorPage error={error} />;
  }
  return boundary.error(error);
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
