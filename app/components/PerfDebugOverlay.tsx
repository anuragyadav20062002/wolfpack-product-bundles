/**
 * PerfDebugOverlay — dev-only Web Vitals overlay.
 *
 * Activated by adding `?perf=1` to the admin URL. Renders a small fixed-
 * position card in the bottom-right corner showing live LCP / INP / CLS /
 * TTFB / FCP values with rating-coloured backgrounds. Hidden in production
 * to keep merchant-facing screens clean.
 *
 * Useful for the merchant-success team when reproducing slowness on a
 * specific merchant's admin — they can append `?perf=1` and screenshot.
 *
 * Issue: docs/issues-prod/admin-lcp-measurement-1.md.
 */

import { useEffect, useState } from "react";
import { subscribeLiveVitals, type LiveVitalsSnapshot } from "../lib/web-vitals.client";

interface PerfDebugOverlayProps {
  /** Only mount when this is truthy. Caller is responsible for the gating
   *  (typically `searchParams.get("perf") === "1"`). */
  enabled: boolean;
}

const METRIC_ORDER = ["LCP", "INP", "CLS", "TTFB", "FCP"] as const;

function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

function ratingColor(rating: string | undefined): string {
  switch (rating) {
    case "good":
      return "#2f8a52";
    case "needs-improvement":
      return "#b08800";
    case "poor":
      return "#d4493e";
    default:
      return "#918c80";
  }
}

export function PerfDebugOverlay({ enabled }: PerfDebugOverlayProps) {
  const [snapshot, setSnapshot] = useState<LiveVitalsSnapshot>({});

  useEffect(() => {
    if (!enabled) return;
    return subscribeLiveVitals(setSnapshot);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside
      aria-label="Performance overlay"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 2147483646,
        background: "rgba(21, 20, 15, 0.92)",
        color: "#f5f2ee",
        padding: "10px 12px",
        borderRadius: 10,
        font: "500 11px/14px ui-monospace, SFMono-Regular, Menlo, monospace",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.24)",
        pointerEvents: "none",
        userSelect: "none",
        minWidth: 168,
      }}
    >
      <div style={{ marginBottom: 6, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Web Vitals
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px" }}>
        {METRIC_ORDER.map(name => {
          const entry = snapshot[name];
          return (
            <PerfRow key={name} name={name} entry={entry} />
          );
        })}
      </div>
    </aside>
  );
}

function PerfRow({
  name,
  entry,
}: {
  name: string;
  entry: { value: number; rating: string } | undefined;
}) {
  return (
    <>
      <span style={{ opacity: 0.65 }}>{name}</span>
      <span style={{ color: ratingColor(entry?.rating), textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {entry ? formatValue(name, entry.value) : "—"}
      </span>
    </>
  );
}
