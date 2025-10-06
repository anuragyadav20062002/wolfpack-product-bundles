import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to fix UUID product IDs in StepProduct records
 *
 * This script identifies StepProduct records with UUID product IDs
 * and attempts to map them to proper Shopify product IDs.
 *
 * Note: Since UUIDs don't contain information about the actual Shopify product,
 * this script will flag affected records but cannot automatically convert them.
 * Manual intervention is required to map UUIDs to correct Shopify product IDs.
 */

async function findBundlesWithUUIDs() {
  console.log('🔍 Searching for bundles with UUID product IDs...\n');

  const allBundles = await prisma.bundle.findMany({
    include: {
      steps: {
        include: {
          StepProduct: true
        }
      }
    }
  });

  const affectedBundles = [];

  for (const bundle of allBundles) {
    let hasUUIDs = false;
    const uuidProducts = [];

    for (const step of bundle.steps) {
      for (const product of step.StepProduct) {
        // Check if product ID is a UUID (doesn't start with gid:// and isn't numeric)
        const isUUID = product.productId &&
                      !product.productId.startsWith('gid://shopify/Product/') &&
                      !/^\d+$/.test(product.productId) &&
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.productId);

        if (isUUID) {
          hasUUIDs = true;
          uuidProducts.push({
            stepId: step.id,
            stepName: step.name,
            productId: product.productId,
            productTitle: product.title,
            stepProductId: product.id
          });
        }
      }
    }

    if (hasUUIDs) {
      affectedBundles.push({
        bundleId: bundle.id,
        bundleName: bundle.name,
        shopifyProductId: bundle.shopifyProductId,
        uuidProducts
      });
    }
  }

  return affectedBundles;
}

async function reportAffectedBundles() {
  const affectedBundles = await findBundlesWithUUIDs();

  if (affectedBundles.length === 0) {
    console.log('✅ No bundles with UUID product IDs found!');
    return;
  }

  console.log(`❌ Found ${affectedBundles.length} bundle(s) with UUID product IDs:\n`);

  for (const bundle of affectedBundles) {
    console.log(`📦 Bundle: ${bundle.bundleName} (${bundle.bundleId})`);
    console.log(`   Shopify Product: ${bundle.shopifyProductId || 'Not set'}`);
    console.log(`   UUID Products Found:`);

    for (const product of bundle.uuidProducts) {
      console.log(`   ├─ Step: ${product.stepName}`);
      console.log(`   │  Product Title: ${product.productTitle}`);
      console.log(`   │  Invalid ID: ${product.productId}`);
      console.log(`   │  StepProduct Record ID: ${product.stepProductId}`);
    }
    console.log('');
  }

  console.log('\n⚠️  ACTION REQUIRED:');
  console.log('These bundles need to be updated manually:');
  console.log('1. Open each bundle in the admin interface');
  console.log('2. Remove the affected products from steps');
  console.log('3. Re-add the correct products using the product picker');
  console.log('4. Save the bundle\n');

  console.log('Alternative: Delete these StepProduct records and re-configure the bundles\n');
}

async function deleteUUIDProducts(dryRun = true) {
  const affectedBundles = await findBundlesWithUUIDs();

  if (affectedBundles.length === 0) {
    console.log('✅ No UUID products to delete');
    return;
  }

  const stepProductIds = affectedBundles.flatMap(bundle =>
    bundle.uuidProducts.map(p => p.stepProductId)
  );

  console.log(`\n🗑️  Found ${stepProductIds.length} StepProduct record(s) to delete`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('Records that would be deleted:', stepProductIds);
  } else {
    console.log('⚠️  DELETING records...');
    const result = await prisma.stepProduct.deleteMany({
      where: {
        id: {
          in: stepProductIds
        }
      }
    });
    console.log(`✅ Deleted ${result.count} StepProduct records`);
    console.log('⚠️  Affected bundles need to be reconfigured with proper product selections');
  }
}

async function main() {
  console.log('🚀 UUID Product ID Migration Script\n');
  console.log('=' .repeat(60));
  console.log('');

  const args = process.argv.slice(2);
  const command = args[0] || 'report';

  try {
    switch (command) {
      case 'report':
        await reportAffectedBundles();
        break;

      case 'delete-dry-run':
        await deleteUUIDProducts(true);
        break;

      case 'delete':
        console.log('⚠️  WARNING: This will permanently delete StepProduct records!');
        console.log('Waiting 5 seconds... Press Ctrl+C to cancel\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await deleteUUIDProducts(false);
        break;

      default:
        console.log('Usage:');
        console.log('  npm run fix-uuids           # Report affected bundles');
        console.log('  npm run fix-uuids report    # Report affected bundles');
        console.log('  npm run fix-uuids delete-dry-run  # Show what would be deleted');
        console.log('  npm run fix-uuids delete    # Delete UUID products (requires manual reconfiguration)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
