import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { BundleType } from "../../constants/bundle";
import { prisma } from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { buildSettingsLanguageResponse } from "../../lib/settings-language-runtime";

// auth: public - served to storefront widgets through the Shopify app proxy.
// Data is non-sensitive merchant-authored UI copy for bundle widgets.

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

    return json(buildSettingsLanguageResponse(generalSettings.settingsLanguage, bundleType), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    AppLogger.error("Failed to load language settings", {
      component: "api.language-settings",
      shopDomain,
      bundleType,
      error: error instanceof Error ? error.message : String(error),
    });

    return json(buildSettingsLanguageResponse(null, bundleType), {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}
