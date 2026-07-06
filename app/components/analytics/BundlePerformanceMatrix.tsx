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
    <section className="wpb-card wpb-card--flush" aria-labelledby="wpb-bundle-matrix-title">
      <header className="wpb-section-header">
        <div>
          <h2 id="wpb-bundle-matrix-title" className="wpb-section-title">Bundle Performance</h2>
          <p className="wpb-section-hint">{rows.length} active bundles in period</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="wpb-empty-block">
          No bundle activity yet in this window. Once shoppers engage with a bundle, it appears here.
        </div>
      ) : (
        <div className="wpb-matrix-scroll">
          <table className="wpb-matrix-table">
            <thead>
              <tr className="wpb-matrix-head-row">
                <th className="wpb-matrix-th wpb-matrix-th--bundle">
                  <SortableHeader label="Bundle" sortKey="bundleName" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--preset">
                  <SortableHeader label="Preset" sortKey="presetId" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--right wpb-matrix-th--engaged">
                  <SortableHeader label="Engaged" sortKey="engagedSessions" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--right wpb-matrix-th--orders">
                  <SortableHeader label="Orders" sortKey="ordersFromBundle" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--right wpb-matrix-th--conv">
                  <SortableHeader label="Conv." sortKey="engagementToOrderRate" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--right wpb-matrix-th--aov">
                  <SortableHeader label="AOV" sortKey="aovCents" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
                <th className="wpb-matrix-th wpb-matrix-th--right wpb-matrix-th--revenue">
                  <SortableHeader label="Revenue" sortKey="revenueCents" activeKey={sortKey} direction={sortDir} onSort={handleSort} align="right" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                return (
                  <tr
                    key={row.bundleId}
                    onClick={onRowClick ? () => onRowClick(row.bundleId) : undefined}
                    className="wpb-matrix-row"
                    data-clickable={Boolean(onRowClick)}
                  >
                    <td className="wpb-matrix-cell wpb-matrix-cell--primary">
                      {row.bundleName}
                    </td>
                    <td className="wpb-matrix-cell">
                      <span
                        className="wpb-preset-chip"
                        data-preset={row.presetId ?? "DEFAULT"}
                      >
                        {row.presetId ?? "—"}
                      </span>
                    </td>
                    <td className="wpb-matrix-cell wpb-matrix-cell--right wpb-matrix-cell--engagement">
                      {row.engagedSessions.toLocaleString()}
                    </td>
                    <td className="wpb-matrix-cell wpb-matrix-cell--right">
                      {row.ordersFromBundle.toLocaleString()}
                    </td>
                    <td className="wpb-matrix-cell wpb-matrix-cell--right wpb-matrix-cell--muted">
                      {row.engagementToOrderRate === null ? "—" : `${row.engagementToOrderRate}%`}
                    </td>
                    <td className="wpb-matrix-cell wpb-matrix-cell--right wpb-matrix-cell--muted">
                      {row.aovCents === null ? "—" : formatRevenue(row.aovCents)}
                    </td>
                    <td className="wpb-matrix-cell wpb-matrix-cell--right wpb-matrix-cell--revenue">
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
