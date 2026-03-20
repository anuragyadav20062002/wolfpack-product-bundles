import { isRouteErrorResponse } from "@remix-run/react";

interface ErrorPageProps {
  error: unknown;
}

// ---------------------------------------------------------------------------
// Status-specific copy
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  number,
  { title: string; description: string; hint: string }
> = {
  400: {
    title: "Bad Request",
    description:
      "The request couldn't be understood. Please check the URL and try again.",
    hint: "If this keeps happening, try clearing your browser cache.",
  },
  401: {
    title: "Not Authenticated",
    description: "You need to be signed in to access this page.",
    hint: "Try refreshing the page to re-authenticate with Shopify.",
  },
  403: {
    title: "Access Denied",
    description: "You don't have permission to view this page.",
    hint: "Contact your store owner if you believe this is a mistake.",
  },
  404: {
    title: "Page Not Found",
    description:
      "The page you're looking for doesn't exist or may have been moved.",
    hint: "Check the URL for typos, or head back to the dashboard.",
  },
  422: {
    title: "Invalid Request",
    description: "The server couldn't process your request as submitted.",
    hint: "Try again with different parameters.",
  },
  429: {
    title: "Too Many Requests",
    description:
      "You've sent too many requests in a short period. Please slow down.",
    hint: "Wait a few seconds and try again.",
  },
};

const FALLBACK_5XX = {
  title: "Unexpected Error",
  description: "Something went wrong on our end. Our team has been notified.",
  hint: "Try refreshing the page or returning to the dashboard.",
};

// ---------------------------------------------------------------------------
// Illustrations
// ---------------------------------------------------------------------------
function IllustrationServer() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Server stack */}
      <rect x="30" y="20" width="100" height="22" rx="5" fill="#E8E8F0" stroke="#C9C9DE" strokeWidth="1.5"/>
      <circle cx="46" cy="31" r="4" fill="#A0A0C0"/>
      <rect x="56" y="28" width="24" height="6" rx="3" fill="#C9C9DE"/>
      <circle cx="112" cy="31" r="3" fill="#86EFAC"/>

      <rect x="30" y="48" width="100" height="22" rx="5" fill="#E8E8F0" stroke="#C9C9DE" strokeWidth="1.5"/>
      <circle cx="46" cy="59" r="4" fill="#A0A0C0"/>
      <rect x="56" y="56" width="24" height="6" rx="3" fill="#C9C9DE"/>
      <circle cx="112" cy="59" r="3" fill="#FCA5A5"/>

      {/* Lightning bolt — error indicator */}
      <path d="M88 40 L78 58 L86 58 L76 78 L96 54 L88 54 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>

      {/* Bottom decorative dots */}
      <circle cx="50" cy="100" r="4" fill="#E8E8F0"/>
      <circle cx="65" cy="108" r="3" fill="#E8E8F0"/>
      <circle cx="80" cy="103" r="5" fill="#E8E8F0"/>
      <circle cx="96" cy="107" r="3" fill="#E8E8F0"/>
      <circle cx="110" cy="100" r="4" fill="#E8E8F0"/>
    </svg>
  );
}

function IllustrationNotFound() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="70" cy="55" r="28" stroke="#C9C9DE" strokeWidth="6" fill="#F4F4F8"/>
      <line x1="90" y1="75" x2="115" y2="100" stroke="#C9C9DE" strokeWidth="7" strokeLinecap="round"/>
      {/* X inside lens */}
      <line x1="58" y1="43" x2="82" y2="67" stroke="#A0A0C0" strokeWidth="5" strokeLinecap="round"/>
      <line x1="82" y1="43" x2="58" y2="67" stroke="#A0A0C0" strokeWidth="5" strokeLinecap="round"/>
      {/* Dots */}
      <circle cx="35" cy="100" r="4" fill="#E8E8F0"/>
      <circle cx="130" cy="30" r="5" fill="#E8E8F0"/>
      <circle cx="140" cy="90" r="3" fill="#E8E8F0"/>
      <circle cx="25" cy="40" r="3" fill="#E8E8F0"/>
    </svg>
  );
}

function IllustrationLocked() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lock body */}
      <rect x="48" y="58" width="64" height="46" rx="8" fill="#E8E8F0" stroke="#C9C9DE" strokeWidth="2"/>
      {/* Shackle */}
      <path d="M62 58 V42 Q62 22 80 22 Q98 22 98 42 V58" stroke="#C9C9DE" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Keyhole */}
      <circle cx="80" cy="78" r="8" fill="#A0A0C0"/>
      <rect x="76" y="82" width="8" height="12" rx="2" fill="#A0A0C0"/>
      {/* Dots */}
      <circle cx="30" cy="90" r="4" fill="#E8E8F0"/>
      <circle cx="130" cy="95" r="5" fill="#E8E8F0"/>
      <circle cx="140" cy="30" r="3" fill="#E8E8F0"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dashboard URL helper — preserves Shopify shop/host params so auth works
// ---------------------------------------------------------------------------
function navigateToDashboard() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const shop = params.get("shop");
  const host = params.get("host");
  const qs = new URLSearchParams();
  if (shop) qs.set("shop", shop);
  if (host) qs.set("host", host);
  const query = qs.toString();
  window.location.href = `/app/dashboard${query ? `?${query}` : ""}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ErrorPage({ error }: ErrorPageProps) {
  let status = 500;
  let title = FALLBACK_5XX.title;
  let description = FALLBACK_5XX.description;
  let hint = FALLBACK_5XX.hint;
  let detail: string | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    const cfg = STATUS_CONFIG[status];
    if (cfg) {
      title = cfg.title;
      description = cfg.description;
      hint = cfg.hint;
    } else if (status >= 400 && status < 500) {
      title = "Something Went Wrong";
      description = "An unexpected error occurred. Please try again or return to the dashboard.";
      hint = "If this keeps happening, contact support.";
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const is4xx = status >= 400 && status < 500;
  const isNotFound = status === 404;
  const isAuth = status === 401 || status === 403;

  // Pick illustration
  let Illustration = IllustrationServer;
  if (isNotFound) Illustration = IllustrationNotFound;
  else if (isAuth) Illustration = IllustrationLocked;

  // Badge colour
  const badgeColor = is4xx ? { bg: "#EEF2FF", text: "#4338CA" } : { bg: "#FEF2F2", text: "#B91C1C" };

  return (
    <div style={styles.root}>
      {/* Main content */}
      <div style={styles.main}>
        <div style={styles.content}>
          {/* Illustration */}
          <div style={styles.illustration}>
            <Illustration />
          </div>

          {/* Status badge */}
          <div
            style={{
              ...styles.badge,
              background: badgeColor.bg,
              color: badgeColor.text,
            }}
          >
            {status}
          </div>

          {/* Heading */}
          <h1 style={styles.heading}>{title}</h1>

          {/* Description */}
          <p style={styles.description}>{description}</p>

          {/* Hint */}
          <p style={styles.hint}>{hint}</p>

          {/* Technical detail */}
          {detail && !is4xx && (
            <details style={styles.detailWrapper}>
              <summary style={styles.detailSummary}>Technical details</summary>
              <pre style={styles.detailPre}>{detail}</pre>
            </details>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={navigateToDashboard}
              style={styles.btnPrimary}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={styles.btnSecondary}
            >
              Go Back
            </button>
          </div>

          {/* Support link */}
          <p style={styles.support}>
            Need help?{" "}
            <a
              href="mailto:wolfpack.shopifyapp@gmail.com"
              style={styles.supportLink}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#F6F6F7",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  },

  // Main area
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  content: {
    width: "100%",
    maxWidth: "520px",
    textAlign: "center",
  },

  // Illustration
  illustration: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "32px",
    opacity: 0.9,
  },

  // Badge
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: "16px",
  },

  // Text
  heading: {
    margin: "0 0 12px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1A1A2E",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  description: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#4B5563",
    lineHeight: 1.6,
  },
  hint: {
    margin: "0 0 32px",
    fontSize: "14px",
    color: "#9CA3AF",
    lineHeight: 1.5,
  },

  // Technical detail (collapsible)
  detailWrapper: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "0",
    marginBottom: "28px",
    textAlign: "left",
    overflow: "hidden",
  },
  detailSummary: {
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6B7280",
    cursor: "pointer",
    userSelect: "none" as const,
    listStyle: "none",
  },
  detailPre: {
    margin: 0,
    padding: "12px 16px 16px",
    borderTop: "1px solid #F3F4F6",
    fontSize: "12px",
    color: "#374151",
    overflowX: "auto",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    background: "#FAFAFA",
    lineHeight: 1.6,
  },

  // Buttons
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap" as const,
    marginBottom: "28px",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "11px 28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #5C6AC4 0%, #7B5BE6 100%)",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(92,106,196,0.3), 0 4px 12px rgba(92,106,196,0.2)",
    letterSpacing: "-0.01em",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "11px 28px",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
    border: "1.5px solid #E5E7EB",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    letterSpacing: "-0.01em",
  },

  // Support
  support: {
    margin: 0,
    fontSize: "13px",
    color: "#9CA3AF",
  },
  supportLink: {
    color: "#5C6AC4",
    textDecoration: "none",
    fontWeight: "500",
  },
};
