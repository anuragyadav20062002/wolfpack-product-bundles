/**
 * POST /api/admin/backfill-cart-transform
 *
 * One-time backfill endpoint: iterates every installed shop (offline session)
 * and ensures their CartTransform points to the Rust function.
 * Required after migrating from the TS cart transform to the Rust version,
 * because existing merchants never re-ran OAuth.
 *
 * Protected by the BACKFILL_SECRET env variable.
 * Usage:
 *   curl -X POST https://<app-url>/api/admin/backfill-cart-transform \
 *     -H "x-backfill-secret: <BACKFILL_SECRET>"
 */
import { timingSafeEqual } from "crypto";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { CartTransformService } from "../../services/cart-transform-service.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Guard with a secret header — simple protection for a one-time internal tool
  const secret = request.headers.get('x-backfill-secret');
  const expectedSecret = process.env.BACKFILL_SECRET;

  if (!expectedSecret) {
    return json(
      { error: 'BACKFILL_SECRET env variable not set — refusing to run without protection' },
      { status: 500 }
    );
  }

  const secretMatch = secret &&
    secret.length === expectedSecret.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));

  if (!secretMatch) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { results, summary } = await CartTransformService.backfillAllShops();
    return json({ ok: true, summary, results });
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// No loader — GET hits are not meaningful here
export async function loader() {
  return json({ error: 'Use POST' }, { status: 405 });
}
