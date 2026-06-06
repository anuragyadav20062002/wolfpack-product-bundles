import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { BundleType } from "../../constants/bundle";
import { prisma } from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { buildSettingsControlsResponse } from "../../lib/settings-controls-runtime";

// auth: public - served to storefront widgets through the Shopify app proxy.
// Data is non-sensitive merchant-authored storefront behavior settings.

function sanitizeBundleType(raw: string | null): BundleType.PRODUCT_PAGE | BundleType.FULL_PAGE {
  if (!raw) return BundleType.PRODUCT_PAGE;
  const stripped = raw.split("?")[0].split("&")[0].trim();
  return stripped === BundleType.FULL_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopDomain } = params;

  if (!shopDomain) {
    return json({ error: "Shop domain is required" }, { status: 400 });
  }

  const url = new URL(request.url);
  const bundleType = sanitizeBundleType(url.searchParams.get("bundleType"));

  try {
    const settings = await prisma.designSettings.findUnique({
      where: {
        shopId_bundleType: {
          shopId: shopDomain,
          bundleType,
        },
      },
    });
    const generalSettings = settings?.generalSettings && typeof settings.generalSettings === "object"
      ? settings.generalSettings as Record<string, unknown>
      : {};

    const { settingsControls, activeControls } = buildSettingsControlsResponse(generalSettings.settingsControls, bundleType);

    return json({ bundleType, settingsControls, activeControls }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    AppLogger.error("Failed to load controls settings", {
      component: "api.controls-settings",
      shopDomain,
      bundleType,
      error: error instanceof Error ? error.message : String(error),
    });

    const { settingsControls, activeControls } = buildSettingsControlsResponse(null, bundleType);

    return json({ bundleType, settingsControls, activeControls }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
