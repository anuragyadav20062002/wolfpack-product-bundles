import {
  CONTROL_LAYOUTS,
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
  LANGUAGE_CONFIGURATION,
  type SettingsField,
} from "../../../lib/admin-configuration-surfaces";

export function getInitialLanguageFieldValues() {
  return Object.fromEntries(
    [
      ...LANGUAGE_CONFIGURATION.sharedCartFields,
      ...LANGUAGE_CONFIGURATION.productCardFields,
      ...Object.values(LANGUAGE_CONFIGURATION.templateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
      ...Object.values(LANGUAGE_CONFIGURATION.productPageTemplateFields).flatMap((groups) =>
        groups.flatMap((group) => group.fields),
      ),
    ].map((field) => [
      getFieldValueKey(field),
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

export function getInitialControlFieldValues() {
  return Object.fromEntries(
    CONTROL_LAYOUTS.flatMap((layout) => layout.tabs.flatMap((tab) => tab.fields.map((field) => [
      field.label,
      field.value ?? "",
    ]))),
  ) as Record<string, string>;
}

export function getInitialDesignFieldValues() {
  return Object.fromEntries(
    [
      ...DESIGN_CONFIGURATION.flatMap((tab) => tab.fields),
      ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
    ].map((field) => [
      field.key ?? field.label,
      field.value ?? "",
    ]),
  ) as Record<string, string>;
}

export function getFieldValueKey(field: SettingsField) {
  return field.key ?? field.label;
}
