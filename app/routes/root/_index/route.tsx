import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

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
  // The Sec-Fetch-Dest header is set by the browser when loading in an iframe.
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
