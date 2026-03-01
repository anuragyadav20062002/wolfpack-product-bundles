import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

// This route handles /app → authenticates → redirects to /app/dashboard.
//
// Auth strategy:
// - The layout (app.tsx) does NOT call authenticate.admin() because Remix
//   runs layout and child loaders in parallel, causing a race for the
//   one-shot id_token with unstable_newEmbeddedAuthStrategy.
// - Instead, THIS route is the sole auth entry point for /app.
// - After token exchange, we redirect to /app/dashboard with `shop` and
//   `host` params preserved so the dashboard's authenticate.admin() can
//   identify the shop and perform the exit-iframe bounce if needed.
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Preserve embedded context params for the redirect target.
  // Without shop/host, authenticate.admin() at /app/dashboard can't identify
  // the shop and falls back to /auth/login (the {shop: null} problem).
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  const params = new URLSearchParams();
  params.set("shop", session.shop);
  if (host) params.set("host", host);

  return redirect(`/app/dashboard?${params.toString()}`);
}

// This component never renders — the loader always redirects.
export default function AppIndex() {
  return null;
}
