/**
 * SortableHeader — table column header with ascending/descending toggle.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

export type SortDir = "asc" | "desc";

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeKey: string | null;
  direction: SortDir;
  onSort: (key: string) => void;
  align?: "left" | "right";
}

export function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: SortableHeaderProps) {
  const isActive = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      style={{
        display: "inline-flex",
        gap: 4,
        alignItems: "center",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: "100%",
        background: "none",
        border: "none",
        padding: 0,
        color: "var(--wpb-ink-500)",
        font: "var(--wpb-micro)",
        fontSize: "var(--wpb-label-size)",
        fontWeight: 600,
        letterSpacing: "var(--wpb-label-spacing)",
        textTransform: "uppercase",
        cursor: "pointer",
        textAlign: align,
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: isActive ? 1 : 0.3, fontSize: 9 }}>
        {isActive ? (direction === "asc" ? "▲" : "▼") : "▼"}
      </span>
    </button>
  );
}
