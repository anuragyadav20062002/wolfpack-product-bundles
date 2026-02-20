import { useState, useCallback, useEffect } from "react";
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
} from "@shopify/polaris";
import { ImageIcon, XCircleIcon } from "@shopify/polaris-icons";
import type { StoreFile } from "../../../routes/app/app.store-files";

interface FilePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
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

  const fetcher = useFetcher<{ files: StoreFile[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }>();
  const loading = fetcher.state === "loading";

  // Load initial files when picker opens
  useEffect(() => {
    if (open && files.length === 0) {
      fetcher.load("/app/store-files");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Append fetcher results to file list
  useEffect(() => {
    if (fetcher.data) {
      const { files: newFiles, pageInfo } = fetcher.data;
      setFiles((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const unique = newFiles.filter((f) => !existingIds.has(f.id));
        return [...prev, ...unique];
      });
      setHasNextPage(pageInfo.hasNextPage);
      setCursor(pageInfo.endCursor ?? null);
    }
  }, [fetcher.data]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSelectedUrl(null);
    setSearch("");
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedUrl) {
      onChange(selectedUrl);
    }
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
  }, [selectedUrl, onChange]);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleLoadMore = useCallback(() => {
    if (cursor) {
      fetcher.load(`/app/store-files?cursor=${encodeURIComponent(cursor)}`);
    }
  }, [cursor, fetcher]);

  const filteredFiles = search
    ? files.filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()))
    : files;

  const currentFilename = value ? filenameFromUrl(value) : null;

  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodyMd" fontWeight="semibold">
        Background Image
      </Text>

      {value ? (
        <InlineStack gap="300" blockAlign="center">
          <Thumbnail
            source={value}
            alt={currentFilename || "Background image"}
            size="small"
          />
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">
              {truncate(currentFilename || value, 30)}
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

      <Modal
        open={open}
        onClose={handleClose}
        title="Choose background image"
        primaryAction={{
          content: "Select",
          disabled: !selectedUrl,
          onAction: handleSelect,
        }}
        secondaryActions={[{ content: "Cancel", onAction: handleClose }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Search files"
              labelHidden
              placeholder="Search files…"
              value={search}
              onChange={setSearch}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setSearch("")}
            />

            {loading && files.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Spinner size="large" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {search ? "No files match your search." : "No image files found in your store."}
              </Text>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "12px",
                }}
              >
                {filteredFiles.map((file) => {
                  const isSelected = selectedUrl === file.url;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setSelectedUrl(file.url)}
                      style={{
                        border: isSelected ? "2px solid #5c6ac4" : "2px solid #e1e3e5",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: "pointer",
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
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }}
                        loading="lazy"
                      />
                      <span style={{ fontSize: "11px", color: "#6d7175", wordBreak: "break-all", lineHeight: 1.3 }}>
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
                <Button variant="plain" onClick={handleLoadMore} loading={loading}>
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
