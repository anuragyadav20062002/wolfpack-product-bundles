import { RangeSlider, TextField, InlineStack } from "@shopify/polaris";

interface RangeSliderRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

/**
 * RangeSliderRow - A standardized range slider with a paired number text input.
 * Allows both dragging the slider and typing an exact number directly.
 */
export function RangeSliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: RangeSliderRowProps) {
  return (
    <InlineStack gap="300" blockAlign="center" wrap={false}>
      <div style={{ flex: 1 }}>
        <RangeSlider
          label={label}
          value={value}
          onChange={(val) => onChange(val as number)}
          min={min}
          max={max}
          step={step}
          suffix={suffix}
        />
      </div>
      <div style={{ width: "64px", flexShrink: 0, marginTop: "18px" }}>
        <TextField
          label=""
          labelHidden
          type="number"
          value={String(value)}
          onChange={(v) => {
            const parsed = parseInt(v, 10);
            if (!isNaN(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)));
            }
          }}
          min={min}
          max={max}
          step={step}
          autoComplete="off"
        />
      </div>
    </InlineStack>
  );
}
