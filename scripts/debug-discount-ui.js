/**
 * Debug Discount UI - Diagnostic Script
 *
 * This script checks why discount UI (footer messaging and strikethrough pricing)
 * isn't showing on the storefront.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDiscountUI() {
  console.log('🔍 Debugging Discount UI Implementation\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Find all active bundles
    const bundles = await prisma.bundle.findMany({
      where: {
        status: 'active',
        bundleType: 'cart_transform'
      },
      include: {
        pricing: true,
        steps: {
          include: {
            StepProduct: true
          }
        }
      }
    });

    if (bundles.length === 0) {
      console.log('❌ No active cart transform bundles found');
      console.log('   Action: Create and publish a bundle first\n');
      return;
    }

    console.log(`✅ Found ${bundles.length} active bundle(s)\n`);

    for (const bundle of bundles) {
      console.log(`📦 Bundle: ${bundle.name} (ID: ${bundle.id})`);
      console.log(`   Status: ${bundle.status}`);
      console.log(`   Shopify Product: ${bundle.shopifyProductId || 'Not set'}\n`);

      // Check discount configuration
      if (!bundle.pricing) {
        console.log('   ❌ NO PRICING CONFIGURATION FOUND');
        console.log('   Action: Go to bundle config → Discount & Pricing → Enable discounts\n');
        continue;
      }

      console.log('   💰 Pricing Configuration:');
      console.log(`      - Discount Enabled: ${bundle.pricing.enableDiscount ? '✅ YES' : '❌ NO'}`);
      console.log(`      - Discount Method: ${bundle.pricing.discountMethod || 'Not set'}`);
      console.log(`      - Rules Count: ${bundle.pricing.rules ? JSON.parse(JSON.stringify(bundle.pricing.rules)).length : 0}`);

      if (bundle.pricing.messages) {
        const messages = JSON.parse(JSON.stringify(bundle.pricing.messages));
        console.log(`      - Show Discount Display: ${messages.showDiscountDisplay !== false ? '✅ YES' : '❌ NO'}`);
        console.log(`      - Show Discount Messaging: ${messages.showDiscountMessaging !== false ? '✅ YES' : '❌ NO'}`);
        console.log(`      - Rule Messages: ${messages.ruleMessages ? Object.keys(messages.ruleMessages).length + ' configured' : 'None'}`);
      } else {
        console.log('      - Messages: ❌ Not configured');
      }

      // Check rules
      if (bundle.pricing.rules) {
        const rules = JSON.parse(JSON.stringify(bundle.pricing.rules));
        if (rules.length > 0) {
          console.log('\n   📋 Discount Rules:');
          rules.forEach((rule, index) => {
            console.log(`      Rule #${index + 1}:`);
            if (bundle.pricing.discountMethod === 'fixed_bundle_price') {
              console.log(`         - Products: ${rule.numberOfProducts || 0}`);
              console.log(`         - Price: ₹${rule.price || rule.fixedBundlePrice || 0}`);
            } else {
              console.log(`         - Type: ${rule.type || 'Not set'}`);
              console.log(`         - Condition: ${rule.condition || 'Not set'}`);
              console.log(`         - Value: ${rule.value || 0}`);
              console.log(`         - Discount: ${rule.discountValue || 0}${bundle.pricing.discountMethod === 'percentage_off' ? '%' : ''}`);
            }
          });
        } else {
          console.log('\n   ❌ NO DISCOUNT RULES CONFIGURED');
          console.log('      Action: Add at least one discount rule');
        }
      }

      // Check steps and products
      console.log(`\n   📊 Bundle Steps: ${bundle.steps.length}`);
      bundle.steps.forEach((step, index) => {
        const productsCount = step.StepProduct?.length || 0;
        console.log(`      Step ${index + 1}: ${step.name} - ${productsCount} product(s)`);
      });

      console.log('\n   ═══════════════════════════════════════════════════════\n');
    }

    // Provide diagnostic summary
    console.log('\n🔧 DIAGNOSTIC CHECKLIST:\n');

    const hasActiveBundle = bundles.length > 0;
    const hasPricing = bundles.some(b => b.pricing);
    const hasEnabledDiscount = bundles.some(b => b.pricing?.enableDiscount);
    const hasRules = bundles.some(b => {
      if (!b.pricing?.rules) return false;
      const rules = JSON.parse(JSON.stringify(b.pricing.rules));
      return rules.length > 0;
    });
    const hasProducts = bundles.some(b => b.steps.some(s => s.StepProduct && s.StepProduct.length > 0));

    console.log(`   ${hasActiveBundle ? '✅' : '❌'} Active bundle exists`);
    console.log(`   ${hasPricing ? '✅' : '❌'} Pricing configuration exists`);
    console.log(`   ${hasEnabledDiscount ? '✅' : '❌'} Discount is enabled`);
    console.log(`   ${hasRules ? '✅' : '❌'} Discount rules are configured`);
    console.log(`   ${hasProducts ? '✅' : '❌'} Products are added to steps`);

    if (!hasEnabledDiscount || !hasRules) {
      console.log('\n❌ ISSUE FOUND: Discount not properly configured');
      console.log('\n📝 ACTION REQUIRED:');
      console.log('   1. Go to bundle configuration page');
      console.log('   2. Navigate to "Discount & Pricing" section');
      console.log('   3. Check "Discount & Pricing" checkbox to enable');
      console.log('   4. Select discount type (Fixed Bundle Price recommended)');
      console.log('   5. Add at least one discount rule');
      console.log('   6. Click "Save Bundle"\n');
    } else if (!hasProducts) {
      console.log('\n❌ ISSUE FOUND: No products in bundle steps');
      console.log('\n📝 ACTION REQUIRED:');
      console.log('   1. Go to bundle configuration page');
      console.log('   2. Add products to each step');
      console.log('   3. Click "Save Bundle"\n');
    } else {
      console.log('\n✅ Configuration looks good!');
      console.log('\n🔍 NEXT STEPS TO DEBUG:');
      console.log('   1. Check browser console for JavaScript errors');
      console.log('   2. Verify bundle data is in shop metafield (check network tab)');
      console.log('   3. Ensure widget is on the correct product page');
      console.log('   4. Check if widget JavaScript is loading correctly\n');
    }

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugDiscountUI()
  .then(() => {
    console.log('✨ Diagnostic completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Diagnostic failed:', error);
    process.exit(1);
  });
