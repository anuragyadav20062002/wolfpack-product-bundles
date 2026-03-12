import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import CrispChat from "./components/CrispChat";
import { ErrorPage } from "./components/ErrorPage";

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
