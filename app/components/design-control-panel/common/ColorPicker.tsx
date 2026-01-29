import { useState, useRef, useEffect, useCallback } from "react";
import { InlineStack, TextField } from "@shopify/polaris";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced onChange to prevent save bar flicker during rapid color changes
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 150); // 150ms debounce for smoother save bar behavior
  }, [onChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync localValue with value prop when it changes from parent
  // This prevents stale state when settings are updated externally
  useEffect(() => {
    if (value !== localValue && /^#[0-9A-F]{6}$/i.test(value)) {
      setLocalValue(value);
    }
  }, [value]);

  const handleTextChange = (newValue: string) => {
    setLocalValue(newValue);
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue); // Text input changes are immediate
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue); // Debounce color picker changes
  };

  const handleBlur = () => {
    // If invalid, reset to current valid value
    if (!/^#[0-9A-F]{6}$/i.test(localValue)) {
      setLocalValue(value);
    }
  };

  const handleColorCircleClick = () => {
    colorInputRef.current?.click();
  };

  return (
    <InlineStack gap="300" align="start" blockAlign="center">
      <div
        onClick={handleColorCircleClick}
        style={{
          width: "41px",
          height: "41px",
          borderRadius: "50%",
          backgroundColor: value,
          border: "1px solid #E3E3E3",
          flexShrink: 0,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={handleColorChange}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <TextField
          label={label}
          value={localValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          autoComplete="off"
          placeholder="#000000"
        />
      </div>
    </InlineStack>
  );
}
