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
      className="wpb-sort-button"
      data-align={align}
    >
      <span>{label}</span>
      <span className="wpb-sort-indicator" data-active={isActive}>
        {isActive ? (direction === "asc" ? "▲" : "▼") : "▼"}
      </span>
    </button>
  );
}
