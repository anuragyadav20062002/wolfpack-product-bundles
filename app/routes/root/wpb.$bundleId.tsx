import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { verifyAppProxyRequest } from "../../lib/app-proxy.server";
import { BundleStatus } from "../../constants/bundle";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = verifyAppProxyRequest(url);
  const bundleId = params.bundleId;

  if (!shopDomain) {
    AppLogger.warn("FPB proxy page rejected unsigned request", {
      component: "wpb.proxy",
      operation: "loader",
    });
    return new Response("Invalid bundle link", { status: 400 });
  }

  if (!bundleId) {
    return new Response("Bundle ID is required", { status: 400 });
  }

  const bundle = await db.bundle.findFirst({
    where: {
      id: bundleId,
      shopId: shopDomain,
      bundleType: "full_page",
      status: {
        in: [BundleStatus.ACTIVE, BundleStatus.UNLISTED],
      },
    },
    include: {
      steps: {
        include: {
          StepProduct: true,
          StepCategory: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      pricing: true,
    },
  });

  if (!bundle) {
    return new Response("Bundle not found", { status: 404 });
  }

  const pageHandle = typeof bundle.shopifyPageHandle === "string" ? bundle.shopifyPageHandle.trim() : "";
  if (pageHandle) {
    return Response.redirect(`https://${shopDomain}/pages/${encodeURIComponent(pageHandle)}`, 302);
  }

  return new Response("Bundle storefront page is not linked. Place the full-page bundle widget on a Shopify page template first.", {
    status: 409,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
