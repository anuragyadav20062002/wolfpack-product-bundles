import {
  DESIGN_CONFIGURATION,
  EXPERT_COLOR_CONTROLS,
  type SettingsField,
} from "./admin-configuration-surfaces";

export type SettingsDesignPayload = {
  fieldValues: Record<string, string>;
  isExpertControlsEnabled: boolean;
};

const DESIGN_FIELDS = [
  ...DESIGN_CONFIGURATION.flatMap((tab) => tab.fields),
  ...Object.values(EXPERT_COLOR_CONTROLS).flat(),
];

const FIELD_BY_KEY = new Map(
  DESIGN_FIELDS.map((field) => [field.key ?? field.label, field]),
);

export const SETTINGS_DESIGN_DEFAULT_FIELD_VALUES = Object.freeze(Object.fromEntries(
  DESIGN_FIELDS.map((field) => [field.key ?? field.label, field.value ?? ""]),
));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCssColor(value: string) {
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|transparent)$/i.test(value);
}

function isNonNegativeSize(value: string) {
  const normalized = value.toLowerCase();
  const unit = ["rem", "px", "em"].find((candidate) => normalized.endsWith(candidate));
  const numericValue = unit ? normalized.slice(0, -unit.length) : normalized;
  if (!numericValue || numericValue.length > 7) return false;
  let decimalCount = 0;
  for (const character of numericValue) {
    if (character === ".") {
      decimalCount += 1;
      if (decimalCount > 1) return false;
      continue;
    }
    if (character < "0" || character > "9") return false;
  }
  const [integer, fraction] = numericValue.split(".");
  if (!integer || integer.length > 3 || fraction?.length === 0 || (fraction?.length ?? 0) > 3) return false;
  return Number(numericValue) <= 999;
}

function validateFieldValue(field: SettingsField, value: string) {
  if (field.kind === "color") return isCssColor(value);
  if (field.kind === "number") return isNonNegativeSize(value);
  if (field.kind === "select") {
    const options = field.options?.length ? field.options : [field.value ?? ""];
    return options.includes(value);
  }
  return value.length <= 2048;
}

export function parseSettingsDesignPayload(value: unknown): SettingsDesignPayload {
  if (!isRecord(value) || !isRecord(value.fieldValues) || typeof value.isExpertControlsEnabled !== "boolean") {
    throw new Error("Invalid Settings Design payload");
  }

  for (const key of Object.keys(value.fieldValues)) {
    if (!FIELD_BY_KEY.has(key)) throw new Error(`Unknown Design field: ${key}`);
  }

  const fieldValues = { ...SETTINGS_DESIGN_DEFAULT_FIELD_VALUES } as Record<string, string>;
  for (const [key, field] of FIELD_BY_KEY) {
    const candidate = value.fieldValues[key];
    if (candidate === undefined) continue;
    if (typeof candidate !== "string" || !validateFieldValue(field, candidate.trim())) {
      throw new Error(`Invalid Design field: ${key}`);
    }
    fieldValues[key] = candidate.trim();
  }

  return {
    fieldValues,
    isExpertControlsEnabled: value.isExpertControlsEnabled,
  };
}

export function createSettingsDesignState(value?: unknown): SettingsDesignPayload {
  if (!isRecord(value)) {
    return {
      fieldValues: { ...SETTINGS_DESIGN_DEFAULT_FIELD_VALUES },
      isExpertControlsEnabled: false,
    };
  }

  return parseSettingsDesignPayload({
    fieldValues: isRecord(value.fieldValues) ? value.fieldValues : {},
    isExpertControlsEnabled: value.isExpertControlsEnabled === true,
  });
}
