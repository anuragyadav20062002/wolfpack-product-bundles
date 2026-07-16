type OpenWindow = (
  url?: string | URL,
  target?: string,
  features?: string,
) => Window | null;

export function openPendingDashboardPreview(
  openWindow: OpenWindow = window.open.bind(window),
): Window | null {
  const popup = openWindow("about:blank", "_blank");
  if (popup) popup.opener = null;
  return popup;
}

export function navigatePendingDashboardPreview(
  popup: Window | null,
  previewUrl: string,
): boolean {
  if (!popup || popup.closed) return false;
  popup.location.replace(previewUrl);
  return true;
}

export function closePendingDashboardPreview(popup: Window | null): void {
  if (popup && !popup.closed) popup.close();
}
