/**
 * LiveActivityFeed — vertical stream of the last N engagement events.
 *
 * Today: server renders the most-recent rows from BundleEngagement.
 * Polling for refresh is opt-in via the `pollMs` prop (defaults off — the
 * route renders once per loader invocation, which is acceptable for an
 * MVP). A WebSocket-backed real-time variant is a follow-up.
 *
 * Issue: docs/issues-prod/wpb-analytics-revamp-1.md
 */

import { useEffect, useState } from "react";

export interface ActivityEvent {
  id: string;
  bundleName: string;
  presetId: string | null;
  sessionId: string;
  createdAt: string; // ISO
}

export interface LiveActivityFeedProps {
  initialEvents: ActivityEvent[];
  /** Optional poll interval. 0 = no polling. */
  pollMs?: number;
  pollEndpoint?: string;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function shortSession(sessionId: string): string {
  const tail = sessionId.replace(/-/g, "").slice(-4).toUpperCase();
  return `S·${tail}`;
}

export function LiveActivityFeed({ initialEvents, pollMs = 0, pollEndpoint }: LiveActivityFeedProps) {
  const [events, setEvents] = useState(initialEvents);
  const [tick, setTick] = useState(0);

  // Re-render every 30s so relative times stay fresh even without polling.
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pollMs <= 0 || !pollEndpoint) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(pollEndpoint);
        if (!res.ok) return;
        const data = await res.json() as { events?: ActivityEvent[] };
        if (Array.isArray(data.events)) setEvents(data.events);
      } catch {
        /* swallow */
      }
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, pollEndpoint]);

  return (
    <section className="wpb-card" aria-labelledby="wpb-activity-feed-title">
      <header className="wpb-section-header">
        <div>
          <h2 id="wpb-activity-feed-title" className="wpb-section-title">Live Activity</h2>
          <p className="wpb-section-hint">Most recent engagements</p>
        </div>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--wpb-accent-engagement)",
            boxShadow: "0 0 0 4px rgba(14,124,123,0.16)",
          }}
        />
      </header>

      {events.length === 0 ? (
        <p style={{ color: "var(--wpb-ink-500)", font: "var(--wpb-body)", margin: 0 }}>
          Nobody has engaged yet. Activity will stream here as shoppers interact with your bundles.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflow: "auto" }} aria-live="polite">
          {events.map(ev => (
            <li key={ev.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--wpb-accent-engagement)",
                  marginLeft: 2,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, font: "var(--wpb-body)", color: "var(--wpb-ink-900)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.bundleName} engaged
                </p>
                <p style={{ margin: 0, font: "var(--wpb-micro)", color: "var(--wpb-ink-500)" }}>
                  {ev.presetId ?? "—"} · {shortSession(ev.sessionId)}
                </p>
              </div>
              <span data-tick={tick} style={{ font: "var(--wpb-micro)", color: "var(--wpb-ink-500)", whiteSpace: "nowrap" }}>
                {relativeTime(ev.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
