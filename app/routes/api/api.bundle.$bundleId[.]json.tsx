import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { BundleStatus } from "../../constants/bundle";
import { ERROR_MESSAGES } from "../../constants/errors";
import { formatBundleForWidget } from "../../lib/bundle-formatter.server";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";

/**
 * Public API endpoint to fetch a single bundle by ID
 * Used by the full-page bundle widget via Shopify App Proxy
 *
 * GET /apps/product-bundles/api/bundle/:bundleId.json
 *
 * Supports sparse fieldsets for optimized responses:
 * ?fields=id,name,steps.products.id,steps.products.title
 * ?fields=bootstrap
 *
 * Examples:
 * - Full response: /api/bundle/123.json
 * - Minimal: /api/bundle/123.json?fields=id,name,status
 * - Nested: /api/bundle/123.json?fields=id,name,steps.id,steps.name,steps.products.id
 * - Bootstrap pointer: /api/bundle/123.json?fields=bootstrap
 */

/**
 * Filters an object to include only the specified fields.
 * Supports nested field notation (e.g., "steps.products.id")
 */
function filterFields(obj: any, requestedFields: string[]): any {
  if (!requestedFields || requestedFields.length === 0) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterFields(item, requestedFields));
  }

  const result: any = {};
  const fieldsMap = new Map<string, string[]>();

  requestedFields.forEach(field => {
    const parts = field.split('.');
    const root = parts[0];

    if (!fieldsMap.has(root)) {
      fieldsMap.set(root, []);
    }

    if (parts.length > 1) {
      fieldsMap.get(root)!.push(parts.slice(1).join('.'));
    } else {
      fieldsMap.get(root)!.push('*');
    }
  });

  for (const [field, subFields] of fieldsMap.entries()) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      if (subFields.includes('*')) {
        result[field] = obj[field];
      } else if (subFields.length > 0) {
        result[field] = filterFields(obj[field], subFields);
      }
    }
  }

  return result;
}

function parseFieldsParam(fieldsParam: string | null): string[] | null {
  if (!fieldsParam) return null;
  return fieldsParam
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function buildBundleBootstrapPayload(bundleId: string, bundle: ReturnType<typeof formatBundleForWidget>, updatedAt: Date | null) {
  return {
    v: 2,
    type: bundle.bundleType,
    bundleType: bundle.bundleType,
    id: bundleId,
    ...(bundle.bundleDesignTemplate ? { bundleDesignTemplate: bundle.bundleDesignTemplate } : {}),
    ...(bundle.bundleDesignPresetId ? { bundleDesignPresetId: bundle.bundleDesignPresetId } : {}),
    ...(updatedAt ? { updatedAt: updatedAt.toISOString() } : {}),
  };
}

function getNormalizedEtag(etag: string) {
  return etag.replace(/^W\//i, '').replace(/^"|"$/g, '').trim();
}

function isFreshByCacheHeaders(
  request: Request,
  etag: string,
  lastModified: Date | null
) {
  const clientEtags = request.headers.get('if-none-match');
  if (clientEtags) {
    const candidateEtags = clientEtags
      .split(',')
      .map(tag => getNormalizedEtag(tag));

    if (candidateEtags.includes(getNormalizedEtag(etag))) {
      return true;
    }
  }

  const clientLastModifiedHeader = request.headers.get('if-modified-since');
  if (!clientLastModifiedHeader || !lastModified) {
    return false;
  }

  const clientLastModifiedMs = Date.parse(clientLastModifiedHeader);
  if (Number.isNaN(clientLastModifiedMs)) {
    return false;
  }

  return lastModified.getTime() <= clientLastModifiedMs;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const requestedFields = parseFieldsParam(url.searchParams.get('fields'));

  try {
    const { bundleId } = params;

    if (!bundleId) {
      return json({ error: ERROR_MESSAGES.BUNDLE_ID_REQUIRED }, { status: 400, headers: CORS_HEADERS });
    }

    // Verify the Shopify App Proxy HMAC signature and extract the shop domain.
    // authenticate.public.appProxy() has a known incompatibility with
    // unstable_newEmbeddedAuthStrategy — it can throw or redirect unexpectedly.
    // Lightweight HMAC verification is equivalent and more reliable for public
    // storefront-facing API routes. Bundle data is non-sensitive (storefront-visible).
    const shopDomain = verifyAppProxyRequest(url);

    if (!shopDomain) {
      AppLogger.warn("App Proxy HMAC verification failed", {
        component: "api.bundle",
        bundleId,
        url: url.toString(),
      });
      return json({ error: ERROR_MESSAGES.SHOP_NOT_FOUND }, { status: 400, headers: CORS_HEADERS });
    }

    AppLogger.info("Fetching bundle", {
      component: "api.bundle",
      operation: "loader",
      shop: shopDomain,
      bundleId
    });

    // Allow draft, active, and unlisted bundles.
    // Draft: merchants can test before publishing.
    // Unlisted: hidden from search/collections/sitemap but accessible via direct URL —
    //   the API is HMAC-protected + UUID bundle ID so serving it here is safe.
    // Archived bundles are excluded — they are taken offline.
    const bundle = await db.bundle.findFirst({
      where: {
        id: bundleId,
        shopId: shopDomain,
        status: {
          in: [BundleStatus.DRAFT, BundleStatus.ACTIVE, BundleStatus.UNLISTED]
        }
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
            StepCategory: {
              orderBy: {
                sortOrder: 'asc'
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        pricing: true
      }
    });

    if (!bundle) {
      AppLogger.warn(ERROR_MESSAGES.BUNDLE_NOT_FOUND, {
        component: "api.bundle",
        operation: "loader",
        bundleId,
        shop: shopDomain
      });
      return json({
        success: false,
        error: "Bundle not found or not active"
      }, { status: 404, headers: CORS_HEADERS });
    }

    AppLogger.info("Found bundle", {
      component: "api.bundle",
      operation: "loader",
      bundleId: bundle.id,
      bundleName: bundle.name
    });

    // Build product response using the shared widget formatter.
    // StepProduct stores title, imageUrl, and variants (JSON) captured at save time.
    // We do NOT call the Shopify Admin API here — that endpoint is public-facing
    // (every storefront visitor triggers it) and Admin API calls are rate-limited.
    const formattedBundle = formatBundleForWidget(bundle);
    const updatedAt = bundle.updatedAt ? new Date(bundle.updatedAt) : null;
    const bootstrapPayload = buildBundleBootstrapPayload(formattedBundle.id, formattedBundle, updatedAt);

    const lastModified = updatedAt;
    const etag = `bundle:${bundle.id}:${updatedAt ? updatedAt.getTime() : 0}`;
    const commonHeaders = {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=10, s-maxage=30, must-revalidate',
      'Vary': 'Accept-Encoding',
      'Last-Modified': lastModified ? lastModified.toUTCString() : new Date(0).toUTCString(),
      'ETag': `"${etag}"`
    };

    if (isFreshByCacheHeaders(request, `"${etag}"`, lastModified)) {
      return new Response(null, {
        status: 304,
        headers: commonHeaders,
      });
    }

    const responsePayload = {
      success: true,
      bundle: formattedBundle,
      timestamp: new Date().toISOString()
    };
    const bootstrapResponsePayload = {
      ...responsePayload,
      bootstrap: bootstrapPayload
    };

    // Apply sparse fieldsets if requested
    if (requestedFields) {
      const wantsBootstrap = requestedFields.includes('bootstrap');
      const requestedDataFields = requestedFields.filter((field) => field !== 'bootstrap');
      const bundleFields = requestedDataFields.map(f => `bundle.${f}`);
      const filtered = filterFields(bootstrapResponsePayload, ['success', 'timestamp', ...bundleFields]);

      if (wantsBootstrap) {
        filtered.bootstrap = bootstrapPayload;
      }

      return json(filtered, {
        headers: commonHeaders,
      });
    }

    return json(responsePayload, {
      headers: commonHeaders,
    });

  } catch (error) {
    AppLogger.error("Error fetching bundle", {
      component: "api.bundle",
      operation: "loader",
      bundleId: params.bundleId
    }, error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error"
    }, { status: 500, headers: CORS_HEADERS });
  }
};
