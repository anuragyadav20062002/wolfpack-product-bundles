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
          // @ts-expect-error — onLoad is fine on a <link>, React's types omit it for non-JS resources.
          onLoad="this.media='all'"
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
