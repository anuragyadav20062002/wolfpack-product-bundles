import type { ShopifyAdmin } from "../../../../lib/auth-guards.server";
import { AppLogger } from "../../../../lib/logger";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import {
  buildBundleProductDescriptionHtml,
  getShopifyStatusFromBundleStatus,
} from "../../../../services/bundles/bundle-configure-handlers.server";
import { BundleStatus } from "../../../../constants/bundle";

async function updateFpbProductStatus(
  admin: ShopifyAdmin,
  productId: string,
  shopifyStatus: string,
  descriptionHtml?: string,
) {
  const response = await admin.graphql(
    `
    mutation SyncFpbProductStatus($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id status }
        userErrors { field message }
      }
    }
  `,
    {
      variables: {
        product: {
          id: productId,
          status: shopifyStatus,
          ...(descriptionHtml ? { descriptionHtml } : {}),
        },
      },
    },
  );

  return response.json() as Promise<{
    data?: Record<string, any>;
    errors?: unknown[];
  }>;
}

async function setFpbParentVariantRequiresComponents(
  admin: ShopifyAdmin,
  productId: string,
  parentVariantId: string,
  requiresComponents: boolean,
) {
  const response = await admin.graphql(
    `
    mutation SetFpbParentVariantRequiresComponents($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id requiresComponents }
        userErrors { field message code }
      }
    }
  `,
    {
      variables: {
        productId,
        variants: [{ id: parentVariantId, requiresComponents }],
      },
    },
  );

  const data = (await response.json()) as {
    data?: Record<string, any>;
    errors?: unknown[];
  };
  return data.data?.productVariantsBulkUpdate?.userErrors ?? [];
}

function hasUnsupportedBundlePublicationError(userErrors: any[]) {
  return userErrors.some(
    (error) =>
      typeof error?.message === "string" &&
      error.message.includes("does not support bundle products"),
  );
}

async function activateFpbBundleProductWithParentSequence(
  admin: ShopifyAdmin,
  productId: string,
  bundleId: string,
) {
  const parentVariantId = await getBundleProductVariantId(admin, productId);
  if (!parentVariantId) {
    AppLogger.warn(
      "[PRODUCT_SYNC] Could not activate FPB parent product because no parent variant was found",
      {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
      },
    );
    return;
  }

  const disableErrors = await setFpbParentVariantRequiresComponents(
    admin,
    productId,
    parentVariantId,
    false,
  );
  if (disableErrors.length > 0) {
    AppLogger.warn(
      "[PRODUCT_SYNC] Could not temporarily clear FPB parent requiresComponents",
      {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        parentVariantId,
      },
      { userErrors: disableErrors },
    );
    return;
  }

  const retryData = await updateFpbProductStatus(admin, productId, "ACTIVE");
  const retryErrors = retryData.data?.productUpdate?.userErrors ?? [];
  if (retryData.errors?.length || retryErrors.length > 0) {
    await setFpbParentVariantRequiresComponents(
      admin,
      productId,
      parentVariantId,
      true,
    );
    AppLogger.warn(
      "[PRODUCT_SYNC] FPB parent activation still failed after clearing requiresComponents",
      {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        parentVariantId,
      },
      { errors: retryData.errors, userErrors: retryErrors },
    );
    return;
  }

  const restoreErrors = await setFpbParentVariantRequiresComponents(
    admin,
    productId,
    parentVariantId,
    true,
  );
  if (restoreErrors.length > 0) {
    await updateFpbProductStatus(admin, productId, "DRAFT");
    await setFpbParentVariantRequiresComponents(
      admin,
      productId,
      parentVariantId,
      true,
    );
    AppLogger.warn(
      "[PRODUCT_SYNC] Reverted FPB parent product after requiresComponents restore failed",
      {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        parentVariantId,
      },
      { userErrors: restoreErrors },
    );
    return;
  }

  AppLogger.info(
    "[PRODUCT_SYNC] FPB bundle parent activated with requiresComponents sequence",
    {
      component: "app.bundles.full-page.configure",
      bundleId,
      productId,
      parentVariantId,
    },
  );
}

export async function syncFpbProductStatus(
  admin: ShopifyAdmin,
  productId: string,
  bundleId: string,
  finalStatus: BundleStatus,
  bundleName: string,
  bundleDescription: string | null,
) {
  try {
    const shopifyStatus = getShopifyStatusFromBundleStatus(finalStatus);
    const descriptionHtml = buildBundleProductDescriptionHtml({
      bundleName,
      customDescription: bundleDescription,
      status: finalStatus,
    });

    const responseData = await updateFpbProductStatus(
      admin,
      productId,
      shopifyStatus,
      descriptionHtml,
    );

    if (responseData.errors?.length) {
      AppLogger.warn(
        "[PRODUCT_SYNC] GraphQL transport error updating FPB product status",
        {
          component: "app.bundles.full-page.configure",
          bundleId,
          productId,
          shopifyStatus,
        },
        responseData.errors,
      );
      return;
    }

    const userErrors = responseData.data?.productUpdate?.userErrors ?? [];
    if (userErrors.length > 0) {
      AppLogger.warn(
        "[PRODUCT_SYNC] Shopify errors updating FPB product status",
        {
          component: "app.bundles.full-page.configure",
          bundleId,
          productId,
          shopifyStatus,
        },
        { userErrors },
      );
      if (
        shopifyStatus === "ACTIVE" &&
        finalStatus === BundleStatus.ACTIVE &&
        hasUnsupportedBundlePublicationError(userErrors)
      ) {
        await activateFpbBundleProductWithParentSequence(
          admin,
          productId,
          bundleId,
        );
      }
      return;
    }

    if (finalStatus === BundleStatus.UNLISTED) {
      const unlistedResponseData = await updateFpbProductStatus(
        admin,
        productId,
        "UNLISTED",
        descriptionHtml,
      );
      const unlistedErrors =
        unlistedResponseData.data?.productUpdate?.userErrors ?? [];
      if (unlistedResponseData.errors?.length) {
        AppLogger.warn(
          "[PRODUCT_SYNC] GraphQL transport error updating FPB product status to UNLISTED",
          {
            component: "app.bundles.full-page.configure",
            bundleId,
            productId,
          },
          unlistedResponseData.errors,
        );
        return;
      }
      if (unlistedErrors.length > 0) {
        AppLogger.warn(
          "[PRODUCT_SYNC] Shopify errors updating FPB product status to UNLISTED",
          {
            component: "app.bundles.full-page.configure",
            bundleId,
            productId,
          },
          { userErrors: unlistedErrors },
        );
        return;
      }
      AppLogger.info("[PRODUCT_SYNC] FPB product status synced to UNLISTED", {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
      });
      return;
    }

    AppLogger.info("[PRODUCT_SYNC] FPB product status synced", {
      component: "app.bundles.full-page.configure",
      bundleId,
      productId,
      status:
        responseData.data?.productUpdate?.product?.status ?? shopifyStatus,
    });
  } catch (error) {
    AppLogger.warn(
      "[PRODUCT_SYNC] Failed to sync FPB product status (non-fatal)",
      {
        component: "app.bundles.full-page.configure",
        bundleId,
        productId,
        shopifyStatus: getShopifyStatusFromBundleStatus(finalStatus),
      },
      error as Error,
    );
  }
}
