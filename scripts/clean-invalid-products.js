/**
 * Clean Invalid Product IDs Script
 *
 * This script removes all StepProduct records that have UUID values instead of proper Shopify GIDs.
 * Run this to clean up legacy data before the strict validation was implemented.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInvalidProducts() {
  console.log('🔍 Scanning for StepProducts with invalid UUID product IDs...\n');

  try {
    // Find all StepProducts
    const allStepProducts = await prisma.stepProduct.findMany({
      select: {
        id: true,
        productId: true,
        title: true,
        stepId: true
      }
    });

    console.log(`📊 Found ${allStepProducts.length} total StepProducts in database\n`);

    // Identify invalid UUIDs
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidProducts = allStepProducts.filter(product =>
      uuidPattern.test(product.productId)
    );

    if (invalidProducts.length === 0) {
      console.log('✅ No invalid product IDs found. Database is clean!');
      return;
    }

    console.log(`❌ Found ${invalidProducts.length} StepProducts with UUID product IDs:\n`);
    invalidProducts.forEach(product => {
      console.log(`  - ${product.title || 'Unnamed'} (ID: ${product.productId})`);
    });

    console.log('\n🗑️  Deleting invalid StepProducts...\n');

    // Delete invalid products
    const deleteResult = await prisma.stepProduct.deleteMany({
      where: {
        id: {
          in: invalidProducts.map(p => p.id)
        }
      }
    });

    console.log(`✅ Successfully deleted ${deleteResult.count} invalid StepProducts`);
    console.log('\n⚠️  Action required: Re-select products for affected bundle steps using the product picker.\n');

  } catch (error) {
    console.error('❌ Error cleaning invalid products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanInvalidProducts()
  .then(() => {
    console.log('✨ Cleanup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
