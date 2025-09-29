import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // This endpoint provides bundle data for the theme extension
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get('shop') || request.headers.get('x-shopify-shop-domain');

    if (!shopDomain) {
      return json({ error: "Shop domain required" }, { status: 400 });
    }

    // Get bundles for the shop from database
    const bundles = await prisma.bundle.findMany({
      where: {
        shopId: shopDomain,
        status: 'active'
      },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        },
        pricing: true
      }
    });

    // Format bundles for theme extension (already filtered for active)

    const bundleData = {};
    bundles.forEach(bundle => {
      bundleData[bundle.id] = {
        id: bundle.id,
        name: bundle.name,
        status: bundle.status,
        bundleType: bundle.bundleType,
        shopifyProductId: bundle.shopifyProductId,
        steps: bundle.steps || [],
        pricing: bundle.pricing || {},
        matching: bundle.matching || {},
        isolation: bundle.isolation || {}
      };
    });

    return json({
      bundles: bundleData,
      count: bundles.length,
      success: true
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Error loading bundles for theme extension:', error);
    return json({
      error: "Failed to load bundles",
      bundles: {},
      count: 0,
      success: false
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  }
};

// Handle preflight requests
export const options = () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};