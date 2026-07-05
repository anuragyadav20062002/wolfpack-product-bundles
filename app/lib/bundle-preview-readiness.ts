export function getPreviewReadinessStorageKey(bundleId: string) {
  return `wpb_preview_${bundleId}`;
}

export function markBundlePreviewComplete({
  bundleId,
  storage,
  setHasPreview,
}: {
  bundleId: string;
  storage?: Pick<Storage, "setItem"> | null;
  setHasPreview?: (hasPreview: boolean) => void;
}) {
  try {
    storage?.setItem(getPreviewReadinessStorageKey(bundleId), "1");
  } catch {
    // Some embedded Admin contexts can block storage; keep in-memory state accurate.
  }
  setHasPreview?.(true);
}
