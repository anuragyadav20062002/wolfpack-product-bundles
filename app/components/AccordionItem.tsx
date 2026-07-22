import type { ReactNode } from "react";
import styles from "./AccordionItem.module.css";

interface AccordionItemProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  subtitle,
  badge,
  badgeColor = "#e8f4fd",
  badgeTextColor: _badgeTextColor = "#0066b2",
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const badgeTone = badgeColor.toLowerCase() === "#e6f4ea" ? "success" : "info";

  return (
    <s-section padding="none">
      <details className={styles.disclosure} open={defaultOpen || undefined}>
        <summary className={styles.summary}>
          <span className={styles.headingGroup}>
            <span className={styles.titleRow}>
              <s-text type="strong">{title}</s-text>
              {badge ? <s-badge tone={badgeTone}>{badge}</s-badge> : null}
            </span>
            <s-text color="subdued">{subtitle}</s-text>
          </span>
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.content}>{children}</div>
      </details>
    </s-section>
  );
}
