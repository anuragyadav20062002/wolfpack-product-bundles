import { json } from "@remix-run/node";
import type { Session } from "@shopify/shopify-api";
import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import db from "../../../../db.server";
import { parseBundleDesignTemplate } from "./parsers";
import { updateSyncMetafields } from "./runtime-config.server";

export async function handleUpdateBundleDesignTemplate(
  _admin: ShopifyAdmin,
  session: Session,
  bundleId: string,
  formData: FormData
) {
  const { bundleDesignTemplate, bundleDesignPresetId } = parseBundleDesignTemplate(formData);

  const updatedBundle = await db.bundle.update({
    where: { id: bundleId, shopId: session.shop },
    data: { bundleDesignTemplate, bundleDesignPresetId },
    include: {
      steps: {
        include: {
          StepProduct: { orderBy: { position: "asc" } },
          StepCategory: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { position: "asc" },
      },
      pricing: true,
    },
  });

  if (updatedBundle.shopifyProductId) {
    await updateSyncMetafields(
      _admin,
      updatedBundle.shopifyProductId,
      updatedBundle,
    );
  }

  return json({ success: true });
}
