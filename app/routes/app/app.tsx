import type { HeadersFunction } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Auth is NOT called here. Remix runs layout and child loaders in parallel.
// With unstable_newEmbeddedAuthStrategy, calling authenticate.admin() here
// races with the child loader (app._index.tsx) for the same one-shot id_token.
// Each child route calls authenticate.admin() in its own loader instead.
export const loader = async () => {
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
        <a href="/app/pricing">Pricing</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
