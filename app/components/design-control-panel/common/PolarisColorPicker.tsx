import { useState, useCallback, useEffect } from "react";
import { ColorPicker as PolarisColorPickerBase, InlineStack, TextField, Popover, Button, Box } from "@shopify/polaris";
import type { HSBAColor } from "@shopify/polaris/build/ts/src/utilities/color-types";
import { hexToHsb, hsbToHex, isValidHex, normalizeHex } from "./colorUtils";

interface PolarisColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * PolarisColorPicker - A wrapper around Polaris ColorPicker that works with hex values.
 *
 * Features:
 * - Accepts and emits hex color values (#RRGGBB)
 * - Uses Polaris ColorPicker internally (HSB color model)
 * - Provides a color swatch button that opens a popover with the picker
 * - Includes a TextField for direct hex input
 */
export function PolarisColorPicker({ label, value, onChange }: PolarisColorPickerProps) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const [hsbColor, setHsbColor] = useState(() => hexToHsb(value));

  // Sync HSB color when value prop changes
  useEffect(() => {
    setHsbColor(hexToHsb(value));
    setHexInput(value);
  }, [value]);

  const togglePopover = useCallback(() => {
    setPopoverActive((active) => !active);
  }, []);

  const handleColorChange = useCallback((color: HSBAColor) => {
    setHsbColor(color);
    const newHex = hsbToHex(color);
    setHexInput(newHex);
    onChange(newHex);
  }, [onChange]);

  const handleHexInputChange = useCallback((newValue: string) => {
    setHexInput(newValue);

    // Validate and update if valid hex
    const normalizedValue = newValue.startsWith('#') ? newValue : `#${newValue}`;
    if (isValidHex(normalizedValue)) {
      const normalized = normalizeHex(normalizedValue);
      setHsbColor(hexToHsb(normalized));
      onChange(normalized);
    }
  }, [onChange]);

  const handleHexInputBlur = useCallback(() => {
    // Reset to current value if invalid
    if (!isValidHex(hexInput)) {
      setHexInput(value);
    }
  }, [hexInput, value]);

  const activator = (
    <button
      type="button"
      onClick={togglePopover}
      style={{
        width: "41px",
        height: "41px",
        borderRadius: "50%",
        backgroundColor: value,
        border: "1px solid #E3E3E3",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
      aria-label={`Select ${label} color`}
    />
  );

  return (
    <InlineStack gap="300" align="start" blockAlign="center">
      <Popover
        active={popoverActive}
        activator={activator}
        onClose={togglePopover}
        preferredAlignment="left"
        preferredPosition="below"
      >
        <Box padding="400">
          <PolarisColorPickerBase
            onChange={handleColorChange}
            color={hsbColor}
          />
        </Box>
      </Popover>
      <div style={{ flex: 1 }}>
        <TextField
          label={label}
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          autoComplete="off"
          placeholder="#000000"
        />
      </div>
    </InlineStack>
  );
}
