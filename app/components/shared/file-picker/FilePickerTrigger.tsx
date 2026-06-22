import type { KeyboardEvent, MouseEvent } from "react";
import { BlockStack, Button, InlineStack, Spinner, Text } from "@shopify/polaris";
import { XCircleIcon } from "@shopify/polaris-icons";
import { MonitorIcon } from "./FilePickerIcons";
import { truncateStoreFileText } from "./utils";

type FilePickerTriggerProps = {
  value: string | null;
  currentFilename: string | null;
  label: string;
  hint?: string;
  uploadLabel: string;
  triggerIsUploading: boolean;
  uploadStatus: "idle" | "uploading" | "polling" | "success" | "timeout" | "error";
  handleOpen: () => void;
  handleRemove: () => void;
  handleTriggerUpload: (event: MouseEvent) => void;
};

export function FilePickerTrigger({
  value,
  currentFilename,
  label,
  hint,
  uploadLabel,
  triggerIsUploading,
  uploadStatus,
  handleOpen,
  handleRemove,
  handleTriggerUpload,
}: FilePickerTriggerProps) {
  if (value) {
    return (
      <div
        style={{
          border: "1px solid #c9cccf",
          borderRadius: "8px",
          padding: "10px",
          background: "#fafbfb",
        }}
      >
        <InlineStack gap="200" blockAlign="start">
          <img
            src={value}
            alt={currentFilename ?? "Background image"}
            style={{
              width: "52px",
              height: "52px",
              objectFit: "cover",
              borderRadius: "4px",
              flexShrink: 0,
              border: "1px solid #e1e3e5",
            }}
          />
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">
              {truncateStoreFileText(currentFilename ?? value, 24)}
            </Text>
            <InlineStack gap="200">
              <Button variant="plain" size="slim" onClick={handleOpen}>
                Change
              </Button>
              <Button variant="plain" tone="critical" size="slim" icon={XCircleIcon} onClick={handleRemove}>
                Remove
              </Button>
            </InlineStack>
          </BlockStack>
        </InlineStack>
      </div>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") handleOpen();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={!triggerIsUploading ? handleOpen : undefined}
      onKeyDown={!triggerIsUploading ? handleKeyDown : undefined}
      style={{
        width: "100%",
        border: "2px dashed #c9cccf",
        borderRadius: "8px",
        padding: "28px 16px",
        background: "#fafbfb",
        cursor: triggerIsUploading ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {triggerIsUploading ? (
        <>
          <Spinner size="small" />
          <Text as="p" variant="bodyXs" tone="subdued">
            {uploadStatus === "uploading" ? "Uploading…" : "Processing…"}
          </Text>
        </>
      ) : (
        <>
          <MonitorIcon />
          <Text as="p" variant="bodySm" fontWeight="semibold">
            {label}
          </Text>
          {hint && (
            <Text as="p" variant="bodyXs" tone="subdued">
              {hint}
            </Text>
          )}
          <button
            type="button"
            onClick={handleTriggerUpload}
            style={{
              marginTop: "4px",
              padding: "6px 20px",
              border: "1px solid #c9cccf",
              borderRadius: "20px",
              background: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              color: "#303030",
              lineHeight: "1.4",
            }}
          >
            {uploadLabel}
          </button>
        </>
      )}
    </div>
  );
}
