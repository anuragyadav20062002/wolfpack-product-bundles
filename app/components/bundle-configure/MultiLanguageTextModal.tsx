import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LocalAppModal } from "./LocalAppModal";

interface ShopLocale {
  locale: string;
  name: string;
  primary?: boolean;
}

export interface MultiLanguageField {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
}

interface MultiLanguageTextModalProps {
  open: boolean;
  title: string;
  locales: ShopLocale[];
  activeLocale: string;
  fields: MultiLanguageField[];
  valuesByLocale: Record<string, Record<string, string>>;
  onActiveLocaleChange: (locale: string) => void;
  onChange: (locale: string, key: string, value: string) => void;
  onSave?: (valuesByLocale: Record<string, Record<string, string>>) => void;
  onClose: () => void;
}

const DEFAULT_LOCALES: ShopLocale[] = [
  { locale: "en", name: "English", primary: true },
  { locale: "ar", name: "Arabic" },
  { locale: "bg", name: "Bulgarian (BG)" },
  { locale: "ca", name: "Catalan" },
  { locale: "zh-CN", name: "Chinese (CN)" },
  { locale: "zh-TW", name: "Chinese (TW)" },
  { locale: "hr", name: "Croatian" },
  { locale: "cs", name: "Czech" },
  { locale: "da", name: "Danish" },
  { locale: "nl", name: "Dutch" },
  { locale: "et", name: "Estonian" },
  { locale: "fi", name: "Finnish" },
  { locale: "fr", name: "French" },
  { locale: "ka", name: "Georgian" },
  { locale: "de", name: "German" },
  { locale: "el", name: "Greek" },
  { locale: "he", name: "Hebrew" },
  { locale: "hu", name: "Hungarian" },
  { locale: "id", name: "Indonesian" },
  { locale: "it", name: "Italian" },
  { locale: "ja", name: "Japanese" },
  { locale: "ko", name: "Korean" },
  { locale: "lv", name: "Latvian" },
  { locale: "lt", name: "Lithuanian" },
  { locale: "nb", name: "Norwegian Bokmål" },
  { locale: "pl", name: "Polish" },
  { locale: "pt-BR", name: "Portuguese (BR)" },
  { locale: "pt-PT", name: "Portuguese (PT)" },
  { locale: "ro", name: "Romanian" },
  { locale: "ru", name: "Russian" },
  { locale: "sk", name: "Slovak (SK)" },
  { locale: "sl", name: "Slovenian (SI)" },
  { locale: "es", name: "Spanish" },
  { locale: "sv", name: "Swedish" },
  { locale: "th", name: "Thai" },
  { locale: "tr", name: "Turkish" },
  { locale: "vi", name: "Vietnamese" },
  { locale: "no", name: "Norwegian" },
];

export function MultiLanguageTextModal({
  open,
  title: _title,
  locales,
  activeLocale,
  fields,
  valuesByLocale,
  onActiveLocaleChange,
  onChange,
  onSave,
  onClose,
}: MultiLanguageTextModalProps) {
  const { t } = useTranslation();
  const [draftByLocale, setDraftByLocale] = useState<Record<string, Record<string, string>>>({});

  const visibleLocales = useMemo(() => {
    const merged = new Map<string, ShopLocale>();
    DEFAULT_LOCALES.forEach((locale) => merged.set(locale.locale, locale));
    locales.forEach((locale) => merged.set(locale.locale, locale));
    return Array.from(merged.values());
  }, [locales]);

  const selectedLocale = visibleLocales.some((locale) => locale.locale === activeLocale)
    ? activeLocale
    : visibleLocales[0].locale;

  useEffect(() => {
    if (!open) return;
    setDraftByLocale(valuesByLocale);
  }, [open, valuesByLocale]);

  if (!open) return null;

  const localeValues = draftByLocale[selectedLocale] ?? {};

  const updateDraft = (key: string, value: string) => {
    setDraftByLocale((prev) => ({
      ...prev,
      [selectedLocale]: {
        ...(prev[selectedLocale] ?? {}),
        [key]: value,
      },
    }));
  };

  const saveAndClose = () => {
    if (onSave) {
      onSave(draftByLocale);
    } else {
      fields.forEach((field) => {
        visibleLocales.forEach((locale) => {
          const value = draftByLocale[locale.locale]?.[field.key];
          if (value !== undefined) {
            onChange(locale.locale, field.key, value);
          }
        });
      });
    }
    onClose();
  };

  return (
    <LocalAppModal
      title={t("common.multiLanguage.title")}
      onClose={onClose}
      primaryAction={(
        <s-button variant="primary" onClick={saveAndClose}>
          {t("common.multiLanguage.saveAndClose")}
        </s-button>
      )}
    >
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small-100">
          <s-heading>{t("common.multiLanguage.translations")}</s-heading>
          <s-text color="subdued">{t("common.multiLanguage.helper")}</s-text>
        </s-stack>
        <s-heading>{t("common.multiLanguage.chooseLanguage")}</s-heading>
        <s-select
          label={t("common.multiLanguage.chooseLanguage")}
          value={selectedLocale}
          onChange={(event: Event) => onActiveLocaleChange((event.target as HTMLSelectElement).value)}
        >
          {visibleLocales.map((locale) => (
            <s-option key={locale.locale} value={locale.locale}>
              {locale.name || locale.locale}
            </s-option>
          ))}
        </s-select>

        <s-stack direction="block" gap="small-100">
          <s-heading>{t("common.multiLanguage.customText")}</s-heading>
          <s-text color="subdued">{t("common.multiLanguage.inputHelper")}</s-text>
        </s-stack>
        <s-heading>{t("common.multiLanguage.textSettings")}</s-heading>

        <s-stack direction="block" gap="base">
          {fields.map((field) => (
            field.multiline ? (
              <s-text-area
                key={field.key}
                label={field.label}
                value={localeValues[field.key] ?? field.fallback}
                onInput={(event: Event) => updateDraft(field.key, (event.target as HTMLTextAreaElement).value)}
              />
            ) : (
              <s-text-field
                key={field.key}
                label={field.label}
                value={localeValues[field.key] ?? field.fallback}
                autocomplete="off"
                onInput={(event: Event) => updateDraft(field.key, (event.target as HTMLInputElement).value)}
              />
            )
          ))}
        </s-stack>
      </s-stack>
    </LocalAppModal>
  );
}
