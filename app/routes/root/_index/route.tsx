import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

import { login } from "../../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Redirect to /app when any Shopify context params are present.
  // These params indicate we're being loaded inside the Shopify Admin iframe.
  if (url.searchParams.get("shop") || url.searchParams.get("host") || url.searchParams.get("id_token")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  // Check if request comes from embedded context via headers.
  const secFetchDest = request.headers.get("sec-fetch-dest");
  if (secFetchDest === "iframe") {
    throw redirect("/app/dashboard");
  }

  // Check the embedded parameter that App Bridge may set
  if (url.searchParams.get("embedded") === "1") {
    throw redirect("/app/dashboard");
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  // Client-side fallback: if the server-side checks didn't catch the embedded
  // context (e.g. browser didn't send Sec-Fetch-Dest: iframe), detect iframe
  // here and redirect. This runs after first paint so there's a brief flash,
  // but it prevents the login form from staying visible in the embedded app.
  useEffect(() => {
    try {
      if (window.self !== window.top) {
        window.location.replace("/app");
      }
    } catch {
      // Cross-origin access error means we're inside an iframe — redirect.
      window.location.replace("/app");
    }
  }, []);

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>A short heading about [your app]</h1>
        <p className={styles.text}>
          A tagline about [your app] that describes your value proposition.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
