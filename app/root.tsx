import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";
import CrispChat from "./components/CrispChat";
import { ErrorPage } from "./components/ErrorPage";

export const loader = async (_args: LoaderFunctionArgs) => {
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export function ErrorBoundary() {
  const error = useRouteError();
  // Root loader may not have run if the error happened before it; fall back to "".
  const rootData = useRouteLoaderData<typeof loader>("root");
  const apiKey = rootData?.apiKey ?? "";
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Shopify mandate (March 13, 2024): app-bridge.js must be the first
            <script> tag in <head>, before any other scripts. */}
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <title>Error — Wolfpack Bundles</title>
      </head>
      <body style={{ margin: 0 }}>
        <ErrorPage error={error} />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Shopify mandate (March 13, 2024): app-bridge.js must be the first
            <script> tag in <head>, before any other scripts. The unversioned
            CDN URL is the official auto-updating endpoint — do not pin. */}
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        {/*
          Issue: admin-lcp-phase2-universal-wins-1 — font loading strategy.
          Phase 1 baseline showed FCP == LCP at 4.4 s with the Inter stylesheet
          blocking the first paint. We now:
            1. `preconnect` with `crossorigin` so the font fetch can begin
               immediately (no-cors preconnect is useless for fonts).
            2. Load the stylesheet via `preload` + `media="print"` swap, which
               downloads it as non-render-blocking and applies it as soon as it
               lands.
            3. Inline a `font-display: swap` override so first paint uses the
               system font fallback if Inter hasn't arrived yet (FOIT → FOUT).
        */}
        <link
          rel="preconnect"
          href="https://cdn.shopify.com/"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
          media="print"
          onLoad={(event) => {
            event.currentTarget.media = "all";
          }}
        />
        <noscript>
          {/* Fallback if JS is disabled — accept the render-blocking cost. */}
          <link
            rel="stylesheet"
            href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
          />
        </noscript>
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `@font-face{font-family:Inter;font-display:swap}`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <CrispChat />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
