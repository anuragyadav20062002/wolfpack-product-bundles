/**
 * Shared cart submission payload helpers.
 *
 * Transport remains owned by each widget. These helpers only build payload
 * structures that must stay consistent across controller refactors.
 */

'use strict';

export function extractBundleDetailsSourceProperties(cartItems = []) {
  const firstItem = cartItems.find(item => item?.properties?._bundle_display_properties);
  return firstItem?.properties || {};
}

export function buildProductPageCartFormData(cartItems = [], {
  bundleName = '',
  offerId = '',
  sessionKey = '',
} = {}) {
  const formData = new FormData();

  cartItems.forEach((item, index) => {
    const itemNumber = index + 1;
    formData.append(`items[${index}][id]`, String(item.id));
    formData.append(`items[${index}][quantity]`, String(item.quantity));

    if (item.selling_plan) {
      formData.append(`items[${index}][selling_plan]`, String(item.selling_plan));
    }

    Object.entries(item.properties || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(`items[${index}][properties][${key}]`, String(value));
    });
    formData.append(`items[${index}][properties][Box]`, String(itemNumber));
    formData.append(`items[${index}][properties][_bundleName]`, bundleName);
    formData.append(`items[${index}][properties][_easyBundle:OfferId]`, `${offerId}_${sessionKey}_${itemNumber}`);
    formData.append(`items[${index}][properties][_easyBundle:prodQty]`, String(item.quantity));
  });

  return {
    formData,
    bundleDetailsKey: `${offerId}_${sessionKey}`,
    sourceProperties: extractBundleDetailsSourceProperties(cartItems),
  };
}
