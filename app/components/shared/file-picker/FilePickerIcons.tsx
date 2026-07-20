export function MonitorIcon() {
  return (
    <svg
      width="28"
      height="23"
      viewBox="0 0 28 23"
      fill="none"
      stroke="#8c9196"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="26" height="16" rx="2" />
      <path d="M9 22h10M14 17v5" />
    </svg>
  );
}

export function MobileIcon() {
  return (
    <svg
      width="18"
      height="28"
      viewBox="0 0 18 28"
      fill="none"
      stroke="#8c9196"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="16" height="26" rx="3" />
      <path d="M7 4h4M8 24h2" />
    </svg>
  );
}

export function ProgressCircle({ status }: { status: "spinning" | "success" }) {
  if (status === "success") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Upload complete">
        <circle cx="14" cy="14" r="12" stroke="#008060" strokeWidth="2" fill="#f1f8f5" />
        <polyline
          points="8,14 12,18 20,10"
          stroke="#008060"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <>
      <style>{`@keyframes wpa-spin{to{transform:rotate(360deg)}}`}</style>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-label="Uploading"
        style={{ animation: "wpa-spin 0.75s linear infinite" }}
      >
        <circle cx="14" cy="14" r="11" stroke="#e1e3e5" strokeWidth="2.5" />
        <path
          d="M14 3 A11 11 0 0 1 25 14"
          stroke="#5c6ac4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}
