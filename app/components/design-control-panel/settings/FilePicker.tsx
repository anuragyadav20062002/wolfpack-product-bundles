import { useState, useCallback, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Modal,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Text,
  Spinner,
  Thumbnail,
  Banner,
} from "@shopify/polaris";
import { ImageIcon, XCircleIcon, UploadIcon } from "@shopify/polaris-icons";
import type { StoreFile } from "../../../routes/app/app.store-files";

interface FilePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

type UploadStatus = "idle" | "uploading" | "timeout" | "error";

interface UploadResult {
  ok: boolean;
  file?: StoreFile;
  error?: string;
  timeout?: boolean;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif";
const MAX_BYTES = 20 * 1024 * 1024;

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

export function FilePicker({ value, onChange }: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<StoreFile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filesFetcher = useFetcher<{
    files: StoreFile[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }>();

  const uploadFetcher = useFetcher<UploadResult>();

  const filesLoading = filesFetcher.state === "loading";
  const isUploading = uploadStatus === "uploading";

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

  // Handle upload result
  useEffect(() => {
    if (uploadFetcher.state === "idle" && uploadFetcher.data) {
      const result = uploadFetcher.data;
      if (result.ok && result.file) {
        // Prepend new file and auto-select it
        setFiles((prev) => {
          const existingIds = new Set(prev.map((f) => f.id));
          if (existingIds.has(result.file!.id)) return prev;
          return [result.file!, ...prev];
        });
        setSelectedUrl(result.file.url);
        setUploadStatus("idle");
      } else if (result.timeout) {
        setUploadStatus("timeout");
      } else {
        setUploadStatus("error");
        setUploadError(result.error ?? "Upload failed. Please try again.");
      }
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSelectedUrl(null);
    setSearch("");
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedUrl) {
      onChange(selectedUrl);
    }
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
  }, [selectedUrl, onChange]);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleLoadMore = useCallback(() => {
    if (cursor) {
      filesFetcher.load(`/app/store-files?cursor=${encodeURIComponent(cursor)}`);
    }
  }, [cursor, filesFetcher]);

  const handleUploadClick = useCallback(() => {
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset input so same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (!file) return;

      // Client-side size check
      if (file.size > MAX_BYTES) {
        setSizeError("File must be under 20 MB.");
        return;
      }

      setSizeError(null);
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
  const gridDisabled = isUploading;

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodyMd" fontWeight="semibold">
        Background Image
      </Text>

      {value ? (
        <InlineStack gap="300" blockAlign="center">
          <Thumbnail
            source={value}
            alt={currentFilename ?? "Background image"}
            size="small"
          />
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">
              {truncate(currentFilename ?? value, 30)}
            </Text>
            <Button
              variant="plain"
              tone="critical"
              icon={XCircleIcon}
              onClick={handleRemove}
            >
              Remove image
            </Button>
          </BlockStack>
        </InlineStack>
      ) : (
        <Button variant="plain" icon={ImageIcon} onClick={handleOpen}>
          Choose from store files
        </Button>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      <Modal
        open={open}
        onClose={handleClose}
        title="Choose background image"
        primaryAction={{
          content: "Select",
          disabled: !selectedUrl || isUploading,
          onAction: handleSelect,
        }}
        secondaryActions={[{ content: "Cancel", onAction: handleClose }]}
      >
        <Modal.Section>
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
                  disabled={isUploading}
                />
              </div>
              <Button
                variant="plain"
                icon={UploadIcon}
                onClick={handleUploadClick}
                disabled={isUploading}
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

            {/* Upload error banner */}
            {uploadStatus === "error" && uploadError && (
              <Banner title="Upload failed" tone="critical">
                <p>{uploadError}</p>
              </Banner>
            )}

            {/* Upload timeout message */}
            {uploadStatus === "timeout" && (
              <Banner title="Processing" tone="info">
                <p>
                  Upload successful — image may take a moment to appear in your
                  library. Close and re-open the picker to see it.
                </p>
              </Banner>
            )}

            {/* Upload loading state */}
            {isUploading && (
              <InlineStack gap="200" blockAlign="center">
                <Spinner size="small" />
                <Text as="p" variant="bodySm" tone="subdued">
                  Uploading…
                </Text>
              </InlineStack>
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
                  opacity: gridDisabled ? 0.5 : 1,
                  pointerEvents: gridDisabled ? "none" : "auto",
                }}
              >
                {filteredFiles.map((file) => {
                  const isSelected = selectedUrl === file.url;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedUrl(file.url)}
                      disabled={gridDisabled}
                      style={{
                        border: isSelected ? "2px solid #5c6ac4" : "2px solid #e1e3e5",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: gridDisabled ? "default" : "pointer",
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
                  disabled={isUploading}
                >
                  Load more
                </Button>
              </div>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
