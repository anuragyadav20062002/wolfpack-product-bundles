/**
 * Quick Fix Script: Update Shop Metafield with Correct Bundle
 *
 * This script fixes the issue where shop.metafields.custom.all_bundles
 * contains an old/wrong bundle ID.
 *
 * Run this in browser console on the container product page:
 */

// Check current state
console.log('🔍 Current shop bundles:', window.allBundlesData);
console.log('🔍 Expected bundle ID: cmgaxiql30000v7rwmy86rmlu');
console.log('🔍 Bundle exists in metafield:', !!window.allBundlesData?.['cmgaxiql30000v7rwmy86rmlu']);

// If bundle doesn't exist, you need to either:
// 1. Re-save the bundle in admin to trigger metafield update
// 2. Or manually call the API to update shop metafield

// For Option 2, run this fetch:
/*
fetch('/app/bundles/cart-transform/configure/cmgaxiql30000v7rwmy86rmlu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ intent: 'refreshMetafield' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Shop metafield updated:', data);
  location.reload();
})
.catch(err => console.error('❌ Failed to update metafield:', err));
*/
