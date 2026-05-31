interface EnablePreviewModalProps {
  open: boolean;
  onClose: () => void;
  themeEditorUrl: string | null;
}

export function EnablePreviewModal({ open, onClose, themeEditorUrl }: EnablePreviewModalProps) {
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
          width: "min(400px, 100%)",
          padding: "32px 28px 24px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
          textAlign: "center",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#f1f1f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <h2
          id="enable-preview-modal-title"
          style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "#111" }}
        >
          Your bundle visibility is not set up yet
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280", lineHeight: 1.55 }}>
          Your bundle is live but shoppers have no way to find it. Set up visibility to change that.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <s-button variant="secondary" onClick={onClose}>Maybe Later</s-button>
          <s-button
            variant="primary"
            onClick={() => {
              if (themeEditorUrl) window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
              onClose();
            }}
          >
            Set Up Visibility
          </s-button>
        </div>
      </div>
    </div>
  );
}
