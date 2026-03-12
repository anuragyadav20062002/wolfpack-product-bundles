import { isRouteErrorResponse } from "@remix-run/react";

interface ErrorPageProps {
  error: unknown;
}

const STATUS_COPY: Record<number, { title: string; description: string }> = {
  400: {
    title: "Bad Request",
    description: "The request couldn't be understood. Please check the URL and try again.",
  },
  401: {
    title: "Unauthorised",
    description: "You need to be signed in to access this page.",
  },
  403: {
    title: "Access Denied",
    description: "You don't have permission to view this page.",
  },
  404: {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
  },
  422: {
    title: "Unprocessable Request",
    description: "The server couldn't process your request. Please try again.",
  },
  429: {
    title: "Too Many Requests",
    description: "You've made too many requests. Please wait a moment before trying again.",
  },
};

const FALLBACK_4XX = {
  title: "Something Went Wrong",
  description: "An unexpected error occurred. Please try again or return to the dashboard.",
};

export function ErrorPage({ error }: ErrorPageProps) {
  let status = 500;
  let title = "Unexpected Error";
  let description = "Something went wrong on our end. Please try again shortly.";
  let detail: string | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    const copy = STATUS_COPY[status] ?? (status < 500 ? FALLBACK_4XX : null);
    if (copy) {
      title = copy.title;
      description = copy.description;
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const is4xx = status >= 400 && status < 500;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand mark */}
        <div style={styles.brandMark}>
          <span style={styles.brandText}>W</span>
        </div>

        {/* Status badge */}
        <div style={is4xx ? styles.badgeClient : styles.badgeServer}>
          {status}
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>{title}</h1>

        {/* Description */}
        <p style={styles.description}>{description}</p>

        {/* Technical detail (only in non-production or for non-4xx) */}
        {detail && !is4xx && (
          <pre style={styles.detail}>{detail}</pre>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <a href="/app" style={styles.btnPrimary}>
            Go to Dashboard
          </a>
          <button
            onClick={() => window.history.back()}
            style={styles.btnSecondary}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8f8fb 0%, #f0f0f8 100%)",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -8px rgba(92,106,196,0.12)",
    padding: "48px 40px 40px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
  },
  brandMark: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #5c6ac4 0%, #9c6ade 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    boxShadow: "0 4px 12px rgba(92,106,196,0.35)",
  },
  brandText: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: 1,
  },
  badgeClient: {
    display: "inline-block",
    padding: "3px 12px",
    borderRadius: "100px",
    background: "linear-gradient(135deg, #5c6ac4 0%, #9c6ade 100%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    marginBottom: "20px",
  },
  badgeServer: {
    display: "inline-block",
    padding: "3px 12px",
    borderRadius: "100px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    marginBottom: "20px",
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a2e",
    lineHeight: 1.25,
  },
  description: {
    margin: "0 0 32px",
    fontSize: "15px",
    color: "#6b7280",
    lineHeight: 1.6,
  },
  detail: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#374151",
    textAlign: "left",
    overflowX: "auto",
    marginBottom: "24px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnPrimary: {
    display: "inline-block",
    padding: "10px 24px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #5c6ac4 0%, #9c6ade 100%)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(92,106,196,0.30)",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    display: "inline-block",
    padding: "10px 24px",
    borderRadius: "8px",
    background: "transparent",
    border: "1.5px solid #e5e7eb",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
};
