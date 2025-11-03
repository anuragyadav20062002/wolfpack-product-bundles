import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Auth route handler for Shopify OAuth flow.
 *
 * NOTE: With unstable_newEmbeddedAuthStrategy enabled, this route is NOT called
 * during app installation. Post-installation tasks (storefront token creation,
 * cart transform activation) are now handled in the afterAuth hook in shopify.server.ts
 *
 * This route is kept for compatibility with the legacy auth flow if needed.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return redirect("/app");
};
