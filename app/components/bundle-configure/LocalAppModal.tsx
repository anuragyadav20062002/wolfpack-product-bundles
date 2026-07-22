import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./LocalAppModal.module.css";

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
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.dialog}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            {title}
          </h2>
          <s-button
            variant="tertiary"
            icon="x"
            accessibilityLabel={t("common.actions.close")}
            onClick={onClose}
          />
        </header>
        <div className={styles.body}>
          {children}
        </div>
        {(primaryAction || secondaryAction) && (
          <footer className={styles.footer}>
            {secondaryAction}
            {primaryAction}
          </footer>
        )}
      </section>
    </div>
  );
}
