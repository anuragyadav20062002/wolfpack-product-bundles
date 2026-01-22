import { RangeSlider } from "@shopify/polaris";

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
 * RangeSliderRow - A standardized range slider with output display.
 * Wraps Polaris RangeSlider with consistent props and type handling.
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
    <RangeSlider
      label={label}
      value={value}
      onChange={(val) => onChange(val as number)}
      min={min}
      max={max}
      step={step}
      output
      suffix={suffix}
    />
  );
}
