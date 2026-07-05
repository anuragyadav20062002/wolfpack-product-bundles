export function shouldDisplayClassicFixedBundleRawTotal(widget, discountInfo) {
  if (widget?.getFullPageDesignPreset?.() !== 'CLASSIC') return false;
  if (!discountInfo?.hasDiscount) return false;

  const method = String(
    discountInfo?.applicableRule?.method
      || discountInfo?.applicableRule?.discountType
      || widget?.selectedBundle?.pricing?.method
      || widget?.selectedBundle?.pricing?.discountType
      || ''
  ).toLowerCase();

  return method === 'fixed_bundle_price' || method === 'fixed_bundle' || method === 'fixed_price';
}
