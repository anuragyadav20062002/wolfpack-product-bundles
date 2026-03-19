import { BlockStack, Text, Divider, RangeSlider, Select, TextField, Checkbox, InlineStack } from "@shopify/polaris";
import { InlineColorInput } from "../common/InlineColorInput";
import type { SettingsComponentProps } from "./types";

const FONT_WEIGHT_OPTIONS = [
  { label: "300 — Light", value: "300" },
  { label: "400 — Regular", value: "400" },
  { label: "500 — Medium", value: "500" },
  { label: "600 — Semi-bold", value: "600" },
  { label: "700 — Bold", value: "700" },
];

/**
 * Toasts Settings Panel
 * Full visual control over bundle widget toast notifications.
 */
export function ToastsSettings({ settings, onUpdate }: SettingsComponentProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">
        Toasts
      </Text>
      <Divider />

      {/* Colors */}
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Colors</Text>

      <InlineColorInput
        id="toastBgColorInput"
        label="Background Color"
        value={settings.toastBgColor}
        onChange={(value) => onUpdate("toastBgColor", value)}
      />

      <InlineColorInput
        id="toastTextColorInput"
        label="Text Color"
        value={settings.toastTextColor}
        onChange={(value) => onUpdate("toastTextColor", value)}
      />

      <Divider />

      {/* Shape */}
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Shape</Text>

      <RangeSlider
        label="Border Radius"
        min={0}
        max={50}
        step={1}
        value={settings.toastBorderRadius ?? 8}
        onChange={(value) => onUpdate("toastBorderRadius", Number(value))}
        suffix={<span style={{ minWidth: 36 }}>{settings.toastBorderRadius ?? 8}px</span>}
      />

      <RangeSlider
        label="Border Width"
        min={0}
        max={8}
        step={1}
        value={settings.toastBorderWidth ?? 0}
        onChange={(value) => onUpdate("toastBorderWidth", Number(value))}
        suffix={<span style={{ minWidth: 36 }}>{settings.toastBorderWidth ?? 0}px</span>}
      />

      {(settings.toastBorderWidth ?? 0) > 0 && (
        <InlineColorInput
          id="toastBorderColorInput"
          label="Border Color"
          value={settings.toastBorderColor ?? "#FFFFFF"}
          onChange={(value) => onUpdate("toastBorderColor", value)}
        />
      )}

      <Divider />

      {/* Typography */}
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Typography</Text>

      <RangeSlider
        label="Font Size"
        min={10}
        max={24}
        step={1}
        value={settings.toastFontSize ?? 13}
        onChange={(value) => onUpdate("toastFontSize", Number(value))}
        suffix={<span style={{ minWidth: 36 }}>{settings.toastFontSize ?? 13}px</span>}
      />

      <Select
        label="Font Weight"
        options={FONT_WEIGHT_OPTIONS}
        value={String(settings.toastFontWeight ?? 500)}
        onChange={(value) => onUpdate("toastFontWeight", Number(value))}
      />

      <Divider />

      {/* Animation */}
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Animation</Text>

      <RangeSlider
        label="Duration"
        min={100}
        max={800}
        step={50}
        value={settings.toastAnimationDuration ?? 300}
        onChange={(value) => onUpdate("toastAnimationDuration", Number(value))}
        suffix={<span style={{ minWidth: 40 }}>{settings.toastAnimationDuration ?? 300}ms</span>}
      />

      <InlineStack blockAlign="center" gap="200">
        <Checkbox
          label="Enter from Bottom"
          helpText="Slides up from the bottom instead of down from the top"
          checked={settings.toastEnterFromBottom ?? false}
          onChange={(value) => onUpdate("toastEnterFromBottom", value)}
        />
      </InlineStack>

      <Divider />

      {/* Shadow */}
      <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">Shadow</Text>

      <TextField
        label="Box Shadow"
        value={settings.toastBoxShadow ?? "0 4px 12px rgba(0, 0, 0, 0.15)"}
        onChange={(value) => onUpdate("toastBoxShadow", value)}
        autoComplete="off"
        monospaced
        placeholder="0 4px 12px rgba(0, 0, 0, 0.15)"
        helpText="Any valid CSS box-shadow value"
      />
    </BlockStack>
  );
}
