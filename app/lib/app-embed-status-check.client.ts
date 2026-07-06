export interface AppEmbedStatusCheckResult {
  appEmbedEnabled: boolean;
  themeEditorUrl: string | null;
}

interface AppEmbedStatusResponse extends Partial<AppEmbedStatusCheckResult> {
  success?: boolean;
}

export async function checkAppEmbedStatusFromCurrentRoute(
  fetchImpl: typeof fetch = window.fetch.bind(window),
  currentUrl: string = window.location.href,
): Promise<AppEmbedStatusCheckResult> {
  const statusUrl = new URL("/app/app-embed-status", currentUrl).toString();

  try {
    const response = await fetchImpl(statusUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const contentType = response.headers.get("Content-Type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return { appEmbedEnabled: false, themeEditorUrl: null };
    }
    const data = (await response.json()) as AppEmbedStatusResponse;
    if (data.success !== true) {
      return { appEmbedEnabled: false, themeEditorUrl: null };
    }
    return {
      appEmbedEnabled: data.appEmbedEnabled === true,
      themeEditorUrl: data.themeEditorUrl ?? null,
    };
  } catch {
    return { appEmbedEnabled: false, themeEditorUrl: null };
  }
}

export function resolveAppEmbedStatusThemeEditorUrl(
  currentThemeEditorUrl: string | null,
  checkedThemeEditorUrl: string | null,
): string | null {
  return checkedThemeEditorUrl ?? currentThemeEditorUrl;
}

export async function verifyAppEmbedEnabledBeforePreview(
  currentAppEmbedEnabled: boolean,
  checkStatus: () => Promise<boolean>,
  options: {
    onValidationStart?: () => void;
    onValidationBlocked?: () => void;
  } = {},
): Promise<boolean> {
  if (!currentAppEmbedEnabled) return false;
  options.onValidationStart?.();
  const appEmbedEnabled = await checkStatus();
  if (!appEmbedEnabled) {
    options.onValidationBlocked?.();
  }
  return appEmbedEnabled;
}
