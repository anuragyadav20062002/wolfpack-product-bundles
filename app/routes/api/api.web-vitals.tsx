import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

/**
 * Tombstone for the retired custom Admin Web Vitals telemetry endpoint.
 *
 * Shopify App Bridge now owns embedded Admin Web Vitals collection. Keep this
 * no-op endpoint so stale browser sessions can stop cleanly without hitting an
 * authenticated route or emitting warning logs.
 */
export async function action(_args: ActionFunctionArgs) {
  return new Response(null, { status: 204 });
}

export async function loader(_args: LoaderFunctionArgs) {
  return new Response(null, { status: 404 });
}
