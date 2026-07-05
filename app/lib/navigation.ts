import type { NavigateFunction } from "@remix-run/react";

export function navigateBackOrFallback(
  navigate: NavigateFunction,
  fallbackPath: string,
  options: { replaceFallback?: boolean } = {},
): void {
  const historyState =
    typeof window !== "undefined" && typeof window.history.state === "object" && window.history.state !== null
      ? window.history.state as { idx?: number }
      : {};

  const hasUsableHistory =
    (historyState.idx ?? 0) > 0 ||
    (typeof window !== "undefined" && window.history.length > 1);

  if (hasUsableHistory) {
    navigate(-1);
    return;
  }

  const navigateOptions = options.replaceFallback ? { replace: true } : undefined;
  navigate(fallbackPath, navigateOptions);
}
