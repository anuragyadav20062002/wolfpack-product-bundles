import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

// This route exists solely to redirect /app → /app/dashboard.
// Authentication is already handled by the parent layout route (app.tsx),
// which calls authenticate.admin(request). Calling it here a second time
// in parallel triggers a token-exchange race condition with unstable_newEmbeddedAuthStrategy
// (both loaders fire simultaneously and both try to exchange the same id_token).
// The $app:serverUrl metafield sync has been moved to the afterAuth hook in shopify.server.ts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loader({ request }: LoaderFunctionArgs) {
  throw redirect("/app/dashboard");
}

// This component never renders — the loader always redirects.
export default function AppIndex() {
  return null;
}
