import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

export const SUPPORTED_LOCALES = ["en", "fr", "de", "es", "ja", "pt-BR"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type LocaleCatalog = Record<string, unknown>;
type LocaleLoader = () => Promise<{ default: LocaleCatalog }>;

const localeLoaders: Partial<Record<SupportedLocale, LocaleLoader>> = {
  fr: () => import("./locales/fr.json"),
  de: () => import("./locales/de.json"),
  es: () => import("./locales/es.json"),
  ja: () => import("./locales/ja.json"),
  "pt-BR": () => import("./locales/pt-BR.json"),
};

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function normalizeAdminLocale(locale: string | null | undefined): SupportedLocale {
  return locale && isSupportedLocale(locale) ? locale : "en";
}

function cloneLocaleCatalog(catalog: LocaleCatalog): LocaleCatalog {
  return JSON.parse(JSON.stringify(catalog)) as LocaleCatalog;
}

function refreshEnglishResourceBundle() {
  i18n.addResourceBundle("en", "translation", cloneLocaleCatalog(en), true, true);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: cloneLocaleCatalog(en) },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export async function loadAdminLocaleResources(locale: string | null | undefined) {
  const normalizedLocale = normalizeAdminLocale(locale);
  if (normalizedLocale === "en") {
    refreshEnglishResourceBundle();
    return "en";
  }

  if (i18n.hasResourceBundle(normalizedLocale, "translation")) {
    return normalizedLocale;
  }

  const loadLocale = localeLoaders[normalizedLocale];
  if (!loadLocale) return "en";

  const catalog = await loadLocale();
  i18n.addResourceBundle(normalizedLocale, "translation", catalog.default, true, true);
  return normalizedLocale;
}

export async function changeAdminI18nLanguage(locale: string | null | undefined) {
  const normalizedLocale = await loadAdminLocaleResources(locale);
  if (i18n.language !== normalizedLocale) {
    await i18n.changeLanguage(normalizedLocale);
  }
  return normalizedLocale;
}

export { i18n };
