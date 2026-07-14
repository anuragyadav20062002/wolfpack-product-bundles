import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbCompareAtPriceSettings() {
  const {
    markAsDirty,
    setShowCompareAtPrices,
    showCompareAtPrices,
  } = usePpbConfigureContext();

  return (
    <s-section>
      <s-stack direction="inline" alignItems="center" gap="small">
        <s-text>Show Compare At Price</s-text>
        <s-switch
          accessibilityLabel="Show Compare At Price"
          checked={showCompareAtPrices || undefined}
          onChange={(event) => {
            setShowCompareAtPrices(
              (event.target as HTMLInputElement).checked,
            );
            markAsDirty();
          }}
        />
      </s-stack>
    </s-section>
  );
}
