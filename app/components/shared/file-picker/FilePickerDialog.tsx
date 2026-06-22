import { Banner, BlockStack, Button, InlineStack, Spinner, Text, TextField } from "@shopify/polaris";
import { UploadIcon } from "@shopify/polaris-icons";
import { ProgressCircle } from "./FilePickerIcons";
import type { FilePickerDialogProps } from "./types";
import { formatStoreFileDate, truncateStoreFileText } from "./utils";

export function FilePickerDialog({
  dialogRef,
  label,
  search,
  setSearch,
  files,
  filteredFiles,
  selectedUrl,
  setSelectedUrl,
  hasNextPage,
  filesLoading,
  isBlocked,
  sizeError,
  uploadStatus,
  uploadError,
  showProgressCircle,
  progressCircleStatus,
  progressLabel,
  progressTone,
  handleClose,
  handleUploadClick,
  handleLoadMore,
  handleSelect,
}: FilePickerDialogProps) {
  return (
    <>
      <style>{`dialog.fp-dialog::backdrop { background: rgba(0,0,0,0.5); } dialog.fp-dialog { border: none; padding: 0; background: transparent; border-radius: 12px; outline: none; }`}</style>
      <dialog
        ref={dialogRef}
        className="fp-dialog"
        onClose={handleClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
        style={{ maxWidth: "none", maxHeight: "none" }}
      >
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

          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <BlockStack gap="400">
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
                <Button variant="plain" icon={UploadIcon} onClick={handleUploadClick} disabled={isBlocked}>
                  Upload image
                </Button>
              </InlineStack>

              {sizeError && (
                <Text as="p" variant="bodySm" tone="critical">
                  {sizeError}
                </Text>
              )}

              {showProgressCircle && (
                <InlineStack gap="300" blockAlign="center">
                  <ProgressCircle status={progressCircleStatus} />
                  <Text as="p" variant="bodySm" tone={progressTone}>
                    {progressLabel}
                  </Text>
                </InlineStack>
              )}

              {uploadStatus === "error" && uploadError && (
                <Banner title="Upload failed" tone="critical">
                  <p>{uploadError}</p>
                </Banner>
              )}

              {uploadStatus === "timeout" && (
                <Banner title="Processing" tone="info">
                  <p>
                    Upload successful — image may take a moment to appear in your
                    library. Close and re-open the picker to see it.
                  </p>
                </Banner>
              )}

              <FileGrid
                files={files}
                filteredFiles={filteredFiles}
                filesLoading={filesLoading}
                search={search}
                selectedUrl={selectedUrl}
                setSelectedUrl={setSelectedUrl}
                isBlocked={isBlocked}
              />

              {hasNextPage && !search && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button variant="plain" onClick={handleLoadMore} loading={filesLoading} disabled={isBlocked}>
                    Load more
                  </Button>
                </div>
              )}
            </BlockStack>
          </div>

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
            <Button variant="primary" disabled={!selectedUrl || isBlocked} onClick={handleSelect}>
              Select
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function FileGrid({
  files,
  filteredFiles,
  filesLoading,
  search,
  selectedUrl,
  setSelectedUrl,
  isBlocked,
}: Pick<
  FilePickerDialogProps,
  "files" | "filteredFiles" | "filesLoading" | "search" | "selectedUrl" | "setSelectedUrl" | "isBlocked"
>) {
  if (filesLoading && files.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <Text as="p" variant="bodySm" tone="subdued">
        {search ? "No files match your search." : "No image files found in your store."}
      </Text>
    );
  }

  return (
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
              {truncateStoreFileText(file.filename, 24)}
            </span>
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>
              {formatStoreFileDate(file.createdAt)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
