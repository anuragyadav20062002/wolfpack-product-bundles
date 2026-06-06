import { useState } from "react";
import { useTranslation } from "react-i18next";

interface AppEmbedBannerProps {
  appEmbedEnabled: boolean;
  themeEditorUrl: string | null;
}

export function AppEmbedBanner({ appEmbedEnabled, themeEditorUrl }: AppEmbedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  if (appEmbedEnabled || dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "6px 8px",
        margin: "0 0 12px",
        border: "1px solid #e1e3e5",
        borderRadius: 8,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(31, 41, 55, 0.06)",
      }}
      suppressHydrationWarning
    >
      <span
        aria-hidden="true"
        style={{
          display: "grid",
          flex: "0 0 auto",
          placeItems: "center",
          width: 26,
          height: 26,
          borderRadius: 7,
          background: "#ffb82e",
          color: "#5f3700",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        !
      </span>
      <span style={{ flex: 1, minWidth: 0, color: "#202223", fontSize: 13, lineHeight: 1.35 }}>
        {t("common.appEmbed.body")}
      </span>
      {themeEditorUrl && (
        <s-button
          variant="secondary"
          onClick={() => window.open(themeEditorUrl, "_blank")}
        >
          {t("common.actions.enableHere")}
        </s-button>
      )}
      <button
        aria-label={t("common.actions.dismiss")}
        onClick={() => setDismissed(true)}
        style={{
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          width: 28,
          height: 28,
          padding: 0,
          border: "none",
          borderRadius: 6,
          background: "transparent",
          cursor: "pointer",
          color: "#6b7280",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
