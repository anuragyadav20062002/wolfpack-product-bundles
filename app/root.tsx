import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import { useEffect } from "react";
import CrispChat from "./components/CrispChat";
import { ErrorPage } from "./components/ErrorPage";
import { reportWebVitals } from "./lib/web-vitals.client";

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
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
  // Wire Core Web Vitals reporting (LCP, INP, CLS, TTFB, FCP) once on first
  // mount. Posts to /api/web-vitals — see app/lib/web-vitals.client.ts.
  // Idempotent: subsequent calls are no-ops, safe under React StrictMode.
  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
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
