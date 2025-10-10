// Bundle ID Generator Service
// Generates unique Bundle IDs for full-page bundles

import { PrismaClient } from "@prisma/client";

/**
 * Generate a unique Bundle ID for a full-page bundle
 * Format: FBP-{number} (e.g., FBP-1, FBP-2, etc.)
 */
export async function generateBundleId(
  prisma: PrismaClient,
  shopId: string
): Promise<string> {
  console.log(`🔢 [BUNDLE_ID] Generating Bundle ID for shop: ${shopId}`);

  try {
    // Find all full-page bundles for this shop and extract the highest number
    const existingBundles = await prisma.bundle.findMany({
      where: {
        shopId: shopId,
        bundleType: "full_page",
      },
      select: {
        templateName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract numbers from templateName (which stores the Bundle ID like "FBP-1", "FBP-2")
    const existingNumbers = existingBundles
      .map((bundle) => {
        if (bundle.templateName) {
          const match = bundle.templateName.match(/FBP-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
        return 0;
      })
      .filter((num) => num > 0);

    // Get the highest number and increment
    const highestNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = highestNumber + 1;

    const bundleId = `FBP-${nextNumber}`;

    console.log(`✅ [BUNDLE_ID] Generated Bundle ID: ${bundleId}`);

    return bundleId;
  } catch (error) {
    console.error(`❌ [BUNDLE_ID] Error generating Bundle ID:`, error);
    throw new Error("Failed to generate Bundle ID");
  }
}

/**
 * Validate if a Bundle ID is unique
 */
export async function validateBundleIdUnique(
  prisma: PrismaClient,
  shopId: string,
  bundleId: string
): Promise<boolean> {
  const existingBundle = await prisma.bundle.findFirst({
    where: {
      shopId: shopId,
      templateName: bundleId,
      bundleType: "full_page",
    },
  });

  return existingBundle === null;
}

/**
 * Get Bundle ID from templateName field
 */
export function extractBundleId(bundle: any): string | null {
  if (bundle.bundleType === "full_page" && bundle.templateName) {
    return bundle.templateName;
  }
  return null;
}
