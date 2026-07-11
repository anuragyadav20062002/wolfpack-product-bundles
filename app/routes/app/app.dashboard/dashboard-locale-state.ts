import {
  normalizeAdminLocale,
  type SupportedLocale,
} from "../../../i18n/config";

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

export async function applyDashboardLocaleSelection(input: {
  locale: string;
  activeLanguage: string;
  setSelectedLanguage: (locale: SupportedLocale) => void;
  changeLanguage: (locale: SupportedLocale) => Promise<unknown>;
  submit: (formData: FormData) => void;
}) {
  const nextLocale = normalizeAdminLocale(input.locale);
  const activeLocale = normalizeAdminLocale(input.activeLanguage);

  input.setSelectedLanguage(nextLocale);
  if (nextLocale === activeLocale) return;

  await input.changeLanguage(nextLocale);

  const formData = new FormData();
  formData.append("intent", "saveAdminLocale");
  formData.append("locale", nextLocale);
  input.submit(formData);
}
