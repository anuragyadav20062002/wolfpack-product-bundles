import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface LocalAppModalProps {
  title: string;
  children: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  onClose: () => void;
}

export function LocalAppModal({
  title,
  children,
  primaryAction,
  secondaryAction,
  onClose,
}: LocalAppModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(17, 24, 39, 0.34)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "min(560px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.24)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px",
            borderBottom: "1px solid #e3e3e3",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
            {title}
          </h2>
          <s-button
            variant="tertiary"
            icon="x"
            accessibilityLabel={t("common.actions.close")}
            onClick={onClose}
          />
        </header>
        <div style={{ padding: 20, overflow: "auto" }}>
          {children}
        </div>
        {(primaryAction || secondaryAction) && (
          <footer
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "14px 20px",
              borderTop: "1px solid #e3e3e3",
            }}
          >
            {secondaryAction}
            {primaryAction}
          </footer>
        )}
      </section>
    </div>
  );
}
