import { useState, useCallback, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import {
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Text,
  Spinner,
  Banner,
} from "@shopify/polaris";
import { UploadIcon, XCircleIcon } from "@shopify/polaris-icons";
import type { StoreFile } from "../../../routes/app/app.store-files";
import { ImageCropEditor } from "./ImageCropEditor";

interface FilePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  cropValue?: string | null;
  onCropChange?: (crop: string | null) => void;
  label?: string;
  hint?: string;
  uploadLabel?: string;
  hideCropEditor?: boolean;
}

type UploadStatus = "idle" | "uploading" | "polling" | "success" | "timeout" | "error";

interface UploadActionResult {
  ok: boolean;
  fileId?: string;
  error?: string;
}

interface StatusResult {
  fileStatus?: string;
  file?: StoreFile;
  error?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif";
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_POLLS = 15;

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? url);
  } catch {
    return url;
  }
}

function MonitorIcon() {
  return (
    <svg
      width="28"
      height="23"
      viewBox="0 0 28 23"
      fill="none"
      stroke="#8c9196"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="26" height="16" rx="2" />
      <path d="M9 22h10M14 17v5" />
    </svg>
  );
}

function ProgressCircle({ status }: { status: "spinning" | "success" }) {
  if (status === "success") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Upload complete">
        <circle cx="14" cy="14" r="12" stroke="#008060" strokeWidth="2" fill="#f1f8f5" />
        <polyline
          points="8,14 12,18 20,10"
          stroke="#008060"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <>
      <style>{`@keyframes wpa-spin{to{transform:rotate(360deg)}}`}</style>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-label="Uploading"
        style={{ animation: "wpa-spin 0.75s linear infinite" }}
      >
        <circle cx="14" cy="14" r="11" stroke="#e1e3e5" strokeWidth="2.5" />
        <path
          d="M14 3 A11 11 0 0 1 25 14"
          stroke="#5c6ac4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

export function FilePicker({
  value,
  onChange,
  cropValue,
  onCropChange,
  label = "Choose background image",
  hint,
  uploadLabel = "Upload image",
  hideCropEditor = false,
}: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<StoreFile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);
  const [pollTrigger, setPollTrigger] = useState(0);
  const [uploadFromTrigger, setUploadFromTrigger] = useState(false);
  const pollCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filesFetcher = useFetcher<{
    files: StoreFile[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }>();

  const uploadFetcher = useFetcher<UploadActionResult>();
  const statusFetcher = useFetcher<StatusResult>();

  const filesLoading = filesFetcher.state === "loading";
  const isBlocked = uploadStatus === "uploading" || uploadStatus === "polling";

  // Open/close the native <dialog> so it appears in the browser top layer,
  // above App Bridge's <ui-modal> which also uses the top layer.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Load initial files when picker opens
  useEffect(() => {
    if (open && files.length === 0) {
      filesFetcher.load("/app/store-files");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append files-fetcher results
  useEffect(() => {
    if (filesFetcher.data) {
      const { files: newFiles, pageInfo } = filesFetcher.data;
      setFiles((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const unique = newFiles.filter((f) => !existingIds.has(f.id));
        return [...prev, ...unique];
      });
      setHasNextPage(pageInfo.hasNextPage);
      setCursor(pageInfo.endCursor ?? null);
    }
  }, [filesFetcher.data]);

  // Handle upload action result → transition to polling
  useEffect(() => {
    if (uploadFetcher.state === "idle" && uploadFetcher.data) {
      const result = uploadFetcher.data;
      if (result.ok && result.fileId) {
        setPendingFileId(result.fileId);
        pollCountRef.current = 0;
        setPollTrigger(0);
        setUploadStatus("polling");
      } else {
        setUploadStatus("error");
        setUploadError(result.error ?? "Upload failed. Please try again.");
        setUploadFromTrigger(false);
      }
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  // Schedule a status poll when in "polling" state
  useEffect(() => {
    if (uploadStatus !== "polling" || !pendingFileId) return;

    if (pollCountRef.current >= MAX_POLLS) {
      setUploadStatus("timeout");
      setPendingFileId(null);
      setUploadFromTrigger(false);
      return;
    }

    const timer = setTimeout(() => {
      pollCountRef.current += 1;
      statusFetcher.load(
        `/app/upload-store-file?fileId=${encodeURIComponent(pendingFileId)}`,
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [uploadStatus, pendingFileId, pollTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle status poll result
  useEffect(() => {
    if (statusFetcher.state !== "idle" || !statusFetcher.data || uploadStatus !== "polling") return;

    const result = statusFetcher.data;

    if (result.fileStatus === "READY" && result.file) {
      if (uploadFromTrigger) {
        // Direct-upload path: auto-apply and skip the modal Select button
        onChange(result.file.url);
        setUploadFromTrigger(false);
      } else {
        setFiles((prev) => {
          const existingIds = new Set(prev.map((f) => f.id));
          if (existingIds.has(result.file!.id)) return prev;
          return [result.file!, ...prev];
        });
        setSelectedUrl(result.file.url);
      }
      setUploadStatus("success");
      setPendingFileId(null);
    } else if (result.fileStatus === "FAILED") {
      setUploadStatus("error");
      setUploadError("Upload processing failed. Please try again.");
      setPendingFileId(null);
      setUploadFromTrigger(false);
    } else {
      setPollTrigger((n) => n + 1);
    }
  }, [statusFetcher.state, statusFetcher.data, uploadStatus, uploadFromTrigger, onChange]);

  // Auto-reset success indicator after a brief delay
  useEffect(() => {
    if (uploadStatus !== "success") return;
    const timer = setTimeout(() => setUploadStatus("idle"), 1500);
    return () => clearTimeout(timer);
  }, [uploadStatus]);

  // Capture Escape to prevent the DCP modal from closing while picker is open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while picker is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const resetUploadState = useCallback(() => {
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
    setPendingFileId(null);
    setUploadFromTrigger(false);
  }, []);

  const handleOpen = useCallback(() => {
    if (isBlocked) return;
    setOpen(true);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
  }, [isBlocked, resetUploadState]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
  }, [resetUploadState]);

  const handleSelect = useCallback(() => {
    if (selectedUrl) {
      onChange(selectedUrl);
    }
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
  }, [selectedUrl, onChange, resetUploadState]);

  const handleRemove = useCallback(() => {
    onChange(null);
    onCropChange?.(null);
  }, [onChange, onCropChange]);

  const handleLoadMore = useCallback(() => {
    if (cursor) {
      filesFetcher.load(`/app/store-files?cursor=${encodeURIComponent(cursor)}`);
    }
  }, [cursor, filesFetcher]);

  const handleUploadClick = useCallback(() => {
    setSizeError(null);
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  // Trigger-area direct upload — bypasses the modal, auto-applies on success
  const handleTriggerUpload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBlocked) return;
      setUploadFromTrigger(true);
      setSizeError(null);
      setUploadError(null);
      fileInputRef.current?.click();
    },
    [isBlocked],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (!file) {
        setUploadFromTrigger(false);
        return;
      }

      if (file.size > MAX_BYTES) {
        setSizeError("File must be under 20 MB.");
        setUploadFromTrigger(false);
        return;
      }

      setSizeError(null);
      setPendingFileId(null);
      pollCountRef.current = 0;
      setPollTrigger(0);
      setUploadStatus("uploading");

      const form = new FormData();
      form.append("file", file);
      uploadFetcher.submit(form, {
        method: "POST",
        action: "/app/upload-store-file",
        encType: "multipart/form-data",
      });
    },
    [uploadFetcher],
  );

  const filteredFiles = search
    ? files.filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()))
    : files;

  const currentFilename = value ? filenameFromUrl(value) : null;

  const showProgressCircle =
    uploadStatus === "uploading" || uploadStatus === "polling" || uploadStatus === "success";
  const progressCircleStatus: "spinning" | "success" =
    uploadStatus === "success" ? "success" : "spinning";
  const progressLabel =
    uploadStatus === "uploading"
      ? "Uploading…"
      : uploadStatus === "polling"
        ? "Processing…"
        : "Upload complete!";
  const progressTone: "subdued" | "success" =
    uploadStatus === "success" ? "success" : "subdued";

  const triggerIsUploading = uploadFromTrigger && isBlocked;

  // ─── Trigger area ──────────────────────────────────────────────────────────

  const trigger = value ? (
    // Selected state
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
            {truncate(currentFilename ?? value, 24)}
          </Text>
          <InlineStack gap="200">
            <Button variant="plain" size="slim" onClick={handleOpen}>
              Change
            </Button>
            {!hideCropEditor && (
              <Button variant="plain" size="slim" onClick={() => setCropEditorOpen(true)}>
                Adjust Image
              </Button>
            )}
            <Button variant="plain" tone="critical" size="slim" icon={XCircleIcon} onClick={handleRemove}>
              Remove
            </Button>
          </InlineStack>
        </BlockStack>
      </InlineStack>
    </div>
  ) : (
    // Empty state — dashed drop zone
    <div
      role="button"
      tabIndex={0}
      onClick={!triggerIsUploading ? handleOpen : undefined}
      onKeyDown={
        !triggerIsUploading
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleOpen();
            }
          : undefined
      }
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

  // ─── Native <dialog> modal ─────────────────────────────────────────────────
  // Using showModal() places the dialog in the browser top layer, above
  // App Bridge's <ui-modal> which also uses the top layer.

  const dialogInner = (
      <div
        style={{
          width: "min(90vw, 680px)",
          maxHeight: "82vh",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text as="span" variant="headingMd">
            {label}
          </Text>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px",
              color: "#6d7175",
              fontSize: "18px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <BlockStack gap="400">
            {/* Search + upload row */}
            <InlineStack gap="200" blockAlign="center">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search files"
                  labelHidden
                  placeholder="Search files…"
                  value={search}
                  onChange={setSearch}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearch("")}
                  disabled={isBlocked}
                />
              </div>
              <Button
                variant="plain"
                icon={UploadIcon}
                onClick={handleUploadClick}
                disabled={isBlocked}
              >
                Upload image
              </Button>
            </InlineStack>

            {/* Client-side size error */}
            {sizeError && (
              <Text as="p" variant="bodySm" tone="critical">
                {sizeError}
              </Text>
            )}

            {/* Progress circle */}
            {showProgressCircle && (
              <InlineStack gap="300" blockAlign="center">
                <ProgressCircle status={progressCircleStatus} />
                <Text as="p" variant="bodySm" tone={progressTone}>
                  {progressLabel}
                </Text>
              </InlineStack>
            )}

            {/* Upload error banner */}
            {uploadStatus === "error" && uploadError && (
              <Banner title="Upload failed" tone="critical">
                <p>{uploadError}</p>
              </Banner>
            )}

            {/* Upload timeout banner */}
            {uploadStatus === "timeout" && (
              <Banner title="Processing" tone="info">
                <p>
                  Upload successful — image may take a moment to appear in your
                  library. Close and re-open the picker to see it.
                </p>
              </Banner>
            )}

            {/* Files grid */}
            {filesLoading && files.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Spinner size="large" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {search
                  ? "No files match your search."
                  : "No image files found in your store."}
              </Text>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "12px",
                  opacity: isBlocked ? 0.5 : 1,
                  pointerEvents: isBlocked ? "none" : "auto",
                }}
              >
                {filteredFiles.map((file) => {
                  const isSelected = selectedUrl === file.url;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedUrl(file.url)}
                      disabled={isBlocked}
                      style={{
                        border: isSelected ? "2px solid #5c6ac4" : "2px solid #e1e3e5",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: isBlocked ? "default" : "pointer",
                        background: isSelected ? "#f4f6f8" : "#fff",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <img
                        src={`${file.url}${file.url.includes("?") ? "&" : "?"}width=80`}
                        alt={file.alt || file.filename}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        loading="lazy"
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#6d7175",
                          wordBreak: "break-all",
                          lineHeight: 1.3,
                        }}
                      >
                        {truncate(file.filename, 24)}
                      </span>
                      <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                        {formatDate(file.createdAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {hasNextPage && !search && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="plain"
                  onClick={handleLoadMore}
                  loading={filesLoading}
                  disabled={isBlocked}
                >
                  Load more
                </Button>
              </div>
            )}
          </BlockStack>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!selectedUrl || isBlocked}
            onClick={handleSelect}
          >
            Select
          </Button>
        </div>
      </div>
  );

  return (
    <BlockStack gap="200">
      {trigger}

      {/* Trigger-level errors shown when upload was initiated from the empty-state button */}
      {!open && sizeError && (
        <Text as="p" variant="bodySm" tone="critical">
          {sizeError}
        </Text>
      )}
      {!open && uploadStatus === "error" && uploadError && (
        <Banner title="Upload failed" tone="critical">
          <p>{uploadError}</p>
        </Banner>
      )}

      {/* File input lives outside the dialog so .click() works as a trusted
          user-gesture whether or not the dialog is currently open. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Native <dialog> — rendered in the browser top layer via showModal(),
          which places it above App Bridge's <ui-modal> regardless of z-index. */}
      <style>{`dialog.fp-dialog::backdrop { background: rgba(0,0,0,0.5); } dialog.fp-dialog { border: none; padding: 0; background: transparent; border-radius: 12px; outline: none; }`}</style>
      <dialog
        ref={dialogRef}
        className="fp-dialog"
        onClose={handleClose}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        style={{ maxWidth: "none", maxHeight: "none" }}
      >
        {dialogInner}
      </dialog>

      {/* Crop editor */}
      {!hideCropEditor && cropEditorOpen && value && (
        <ImageCropEditor
          imageUrl={value}
          cropValue={cropValue ?? null}
          onConfirm={(crop) => {
            onCropChange?.(crop);
            setCropEditorOpen(false);
          }}
          onClose={() => setCropEditorOpen(false)}
        />
      )}
    </BlockStack>
  );
}
