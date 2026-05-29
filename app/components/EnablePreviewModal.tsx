interface EnablePreviewModalProps {
  open: boolean;
  onClose: () => void;
  themeEditorUrl: string | null;
}

export function EnablePreviewModal({ open, onClose, themeEditorUrl }: EnablePreviewModalProps) {
  if (!themeEditorUrl) return null;
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enable-preview-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 17, 17, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          width: "min(440px, 100%)",
          padding: "24px 24px 20px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="enable-preview-modal-title"
          style={{ margin: 0, fontSize: 17, fontWeight: 650, color: "#202223" }}
        >
          Enable the theme app extension to preview
        </h2>
        <p style={{ margin: "10px 0 14px", fontSize: 14, color: "#4a4a4a", lineHeight: 1.5 }}>
          Bundles only render on the storefront when the Wolfpack Bundles theme app extension is active.
        </p>
        <ol style={{ margin: "0 0 18px 18px", padding: 0, fontSize: 13, color: "#4a4a4a", lineHeight: 1.6 }}>
          <li>Go to <strong>Online Store</strong> in Shopify.</li>
          <li>Click <strong>Edit Theme</strong> on your current theme.</li>
          <li>Turn on the Wolfpack Bundles app embed, then <strong>Save</strong>.</li>
        </ol>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <s-button variant="secondary" onClick={onClose}>Cancel</s-button>
          <s-button
            variant="primary"
            onClick={() => {
              window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
              onClose();
            }}
          >
            Open theme editor
          </s-button>
        </div>
      </div>
    </div>
  );
}
