import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleLevelCssSettings() {
  const {
    bundleLevelCss,
    bundleLevelCssExpanded,
    markAsDirty,
    setBundleLevelCss,
    setBundleLevelCssExpanded,
  } = usePpbConfigureContext();

  return (
    <s-section>
      <s-stack direction="block" gap="small">
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          onClick={() => setBundleLevelCssExpanded((prev) => !prev)}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Bundle Level CSS
          </h3>
          <span
            style={{
              fontSize: 18,
              color: "#6d7175",
              display: "inline-block",
              transform: bundleLevelCssExpanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            ▾
          </span>
        </button>
        {bundleLevelCssExpanded && (
          <textarea
            value={bundleLevelCss}
            placeholder="/* Add custom CSS for this bundle */"
            rows={6}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 13,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #c9cccf",
              resize: "vertical",
              boxSizing: "border-box",
            }}
            onInput={(e) => {
              setBundleLevelCss((e.target as HTMLTextAreaElement).value);
              markAsDirty();
            }}
          />
        )}
      </s-stack>
    </s-section>
  );
}
