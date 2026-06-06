/**
 * BundlePerformanceMatrix — sortable per-bundle row table.
 *
 * Each row shows: preset chip, name, engaged sessions, orders, AOV, revenue,
 * conversion %. Sort by any column. Click a row to navigate to bundle configure.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { useMemo, useState } from "react";
import { SortableHeader, type SortDir } from "./shared/SortableHeader";
import type { BundleMatrixRow } from "../../lib/analytics";

export interface BundlePerformanceMatrixProps {
  rows: BundleMatrixRow[];
  formatRevenue: (cents: number) => string;
  onRowClick?: (bundleId: string) => void;
}

const PRESET_ACCENT: Record<string, { fg: string; bg: string }> = {
  DEFAULT:    { fg: "#15140F", bg: "#E8E2D6" },
  CLASSIC:    { fg: "#15140F", bg: "#E0DACC" },
  COMPACT:    { fg: "#15140F", bg: "#E0DACC" },
  HORIZONTAL: { fg: "#0E7C7B", bg: "#CCE5E3" },
};

type RowKey = keyof Pick<BundleMatrixRow, "bundleName" | "presetId" | "engagedSessions" | "ordersFromBundle" | "revenueCents" | "aovCents" | "engagementToOrderRate">;

export function BundlePerformanceMatrix({ rows, formatRevenue, onRowClick }: BundlePerformanceMatrixProps) {
  const [sortKey, setSortKey] = useState<RowKey>("revenueCents");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      const av = a[sortKey] as number | string | null;
      const bv = b[sortKey] as number | string | null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as RowKey);
      setSortDir("desc");
    }
  };

  return (
    <section className="wpb-card" aria-labelledby="wpb-bundle-matrix-title" style={{ overflow: "hidden" }}>
      <header className="wpb-section-header">
        <div>
          <h2 id="wpb-bundle-matrix-title" className="wpb-section-title">Bundle Performance</h2>
          <p className="wpb-section-hint">{rows.length} active bundles in period</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--wpb-ink-500)", font: "var(--wpb-body)" }}>
          No bundle activity yet in this window. Once shoppers engage with a bundle, it appears here.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--wpb-line)" }}>
                <th style={{ padding: "12px 8px", textAlign: "left", width: "26%" }}>
                  <SortableHeader label="Bundle" sortKey="bundleName" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "left", width: "14%" }}>
                  <SortableHeader label="Preset" sortKey="presetId" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "right", width: "12%" }}>
                  <SortableHeader label="Engaged" sortKey="engagedSessions" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "right", width: "10%" }}>
                  <SortableHeader label="Orders" sortKey="ordersFromBundle" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "right", width: "12%" }}>
                  <SortableHeader label="Conv." sortKey="engagementToOrderRate" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "right", width: "12%" }}>
                  <SortableHeader label="AOV" sortKey="aovCents" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th style={{ padding: "12px 8px", textAlign: "right", width: "14%" }}>
                  <SortableHeader label="Revenue" sortKey="revenueCents" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => {
                const accent = (row.presetId && PRESET_ACCENT[row.presetId]) || PRESET_ACCENT["DEFAULT"];
                return (
                  <tr
                    key={row.bundleId}
                    onClick={onRowClick ? () => onRowClick(row.bundleId) : undefined}
                    style={{
                      borderBottom: idx === sorted.length - 1 ? "none" : "1px solid var(--wpb-line)",
                      cursor: onRowClick ? "pointer" : "default",
                    }}
                  >
                    <td style={{ padding: "16px 8px", color: "var(--wpb-ink-900)", font: "var(--wpb-body)", fontWeight: 600 }}>
                      {row.bundleName}
                    </td>
                    <td style={{ padding: "16px 8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: accent.bg,
                          color: accent.fg,
                          font: "var(--wpb-micro)",
                          fontSize: "var(--wpb-label-size)",
                          fontWeight: 600,
                          letterSpacing: "var(--wpb-label-spacing)",
                          textTransform: "uppercase",
                        }}
                      >
                        {row.presetId ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right", font: "var(--wpb-body)", color: "var(--wpb-accent-engagement)", fontWeight: 600 }}>
                      {row.engagedSessions.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right", font: "var(--wpb-body)", color: "var(--wpb-ink-900)" }}>
                      {row.ordersFromBundle.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right", font: "var(--wpb-body)", color: "var(--wpb-ink-700)" }}>
                      {row.engagementToOrderRate === null ? "—" : `${row.engagementToOrderRate}%`}
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right", font: "var(--wpb-body)", color: "var(--wpb-ink-700)" }}>
                      {row.aovCents === null ? "—" : formatRevenue(row.aovCents)}
                    </td>
                    <td style={{ padding: "16px 8px", textAlign: "right", font: "var(--wpb-body)", color: "var(--wpb-accent-revenue)", fontWeight: 700 }}>
                      {formatRevenue(row.revenueCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
