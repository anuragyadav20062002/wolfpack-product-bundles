import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    console.log("🧹 [CLEANUP] Starting cleanup of deleted bundle metafields");

    // Get only active bundles from database (exclude archived)
    const activeBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        status: 'active' // Only include active bundles in cleanup process
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    console.log(`🧹 [CLEANUP] Found ${activeBundles.length} active bundles in database`);

    // Get current shop metafield data
    const SHOP_METAFIELD_QUERY = `
      query getShopBundleMetafield {
        shop {
          metafield(namespace: "custom", key: "all_bundles") {
            id
            value
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(SHOP_METAFIELD_QUERY);
    const metafieldData = await metafieldResponse.json();

    let currentBundleData = {};
    if (metafieldData.data?.shop?.metafield?.value) {
      try {
        currentBundleData = JSON.parse(metafieldData.data.shop.metafield.value);
        console.log(`🧹 [CLEANUP] Current metafield contains ${Object.keys(currentBundleData).length} bundle entries`);
      } catch (error) {
        console.error("🧹 [CLEANUP] Error parsing current metafield data:", error);
      }
    }

    // Create cleaned bundle data with only active bundles
    const cleanedBundleData = {};
    const activeBundleIds = new Set(activeBundles.map(b => b.id));

    for (const [bundleId, bundleConfig] of Object.entries(currentBundleData)) {
      if (activeBundleIds.has(bundleId)) {
        cleanedBundleData[bundleId] = bundleConfig;
        console.log(`🧹 [CLEANUP] Keeping bundle: ${bundleId}`);
      } else {
        console.log(`🧹 [CLEANUP] Removing deleted bundle: ${bundleId}`);
      }
    }

    const removedCount = Object.keys(currentBundleData).length - Object.keys(cleanedBundleData).length;
    console.log(`🧹 [CLEANUP] Removed ${removedCount} deleted bundle entries`);

    // Update shop metafield with cleaned data
    if (removedCount > 0) {
      const UPDATE_SHOP_METAFIELD = `
        mutation updateShopMetafield($metafields: [MetafieldInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const metafieldInput = [{
        namespace: "custom",
        key: "all_bundles",
        type: "json",
        value: JSON.stringify(cleanedBundleData),
        ownerId: `gid://shopify/Shop/${session.shop.split('.')[0]}`
      }];

      const updateResponse = await admin.graphql(UPDATE_SHOP_METAFIELD, {
        variables: { metafields: metafieldInput }
      });

      const updateData = await updateResponse.json();

      if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error("🧹 [CLEANUP] Error updating shop metafield:", updateData.data.metafieldsSet.userErrors);
        return json({
          success: false,
          error: "Failed to update shop metafield",
          details: updateData.data.metafieldsSet.userErrors
        }, { status: 500 });
      }

      console.log("🧹 [CLEANUP] Shop metafield updated successfully");
    }

    return json({
      success: true,
      message: `Cleanup completed. Removed ${removedCount} deleted bundle entries.`,
      activeBundlesCount: activeBundles.length,
      removedBundlesCount: removedCount,
      cleanedData: cleanedBundleData
    });

  } catch (error) {
    console.error("🧹 [CLEANUP] Error during cleanup:", error);
    return json({
      success: false,
      error: (error as Error).message || "Cleanup failed"
    }, { status: 500 });
  }
};