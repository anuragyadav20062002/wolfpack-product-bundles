export function shouldApplyDashboardLocaleSave(
  responseLocale: string,
  lastAppliedLocale: string | null,
): boolean {
  return responseLocale !== lastAppliedLocale;
}

export function buildDashboardLocaleSearchParams(
  currentParams: URLSearchParams,
  locale: string,
): URLSearchParams | null {
  if (currentParams.get("locale") === locale) return null;
  const nextParams = new URLSearchParams(currentParams);
  nextParams.set("locale", locale);
  return nextParams;
}
