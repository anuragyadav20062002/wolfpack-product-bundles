import { ProgressCircle } from "./FilePickerIcons";
import type { FilePickerDialogProps } from "./types";
import { formatStoreFileDate, truncateStoreFileText } from "./utils";
import styles from "./FilePickerDialog.module.css";

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
    <s-modal ref={dialogRef} id="store-file-picker-modal" heading={label} size="large" onHide={handleClose}>
      <s-button slot="primary-action" variant="primary" disabled={!selectedUrl || isBlocked || undefined} onClick={handleSelect}>
        Select
      </s-button>
      <s-button slot="secondary-actions" onClick={handleClose}>Cancel</s-button>

      <s-query-container containerName="file-picker">
        <s-stack direction="block" gap="base">
          <s-grid
            gridTemplateColumns="@container file-picker (inline-size > 480px) minmax(0, 1fr) auto, minmax(0, 1fr)"
            gap="small"
            alignItems="end"
          >
            <s-search-field
              label="Search files"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search files…"
              value={search}
              disabled={isBlocked || undefined}
              onInput={(event) => setSearch(event.currentTarget.value)}
            />
            <s-button icon="upload" onClick={handleUploadClick} disabled={isBlocked || undefined}>
              Upload image
            </s-button>
          </s-grid>

          {sizeError ? <s-text tone="critical">{sizeError}</s-text> : null}

          {showProgressCircle ? (
            <div className={styles.progressRow}>
              <ProgressCircle status={progressCircleStatus} />
              <s-text tone={progressTone === "success" ? "success" : "neutral"}>{progressLabel}</s-text>
            </div>
          ) : null}

          {uploadStatus === "error" && uploadError ? (
            <s-banner heading="Upload failed" tone="critical">{uploadError}</s-banner>
          ) : null}

          {uploadStatus === "timeout" ? (
            <s-banner heading="Processing" tone="info">
              Upload successful — image may take a moment to appear in your library. Close and re-open the picker to see it.
            </s-banner>
          ) : null}

          <FileGrid
            files={files}
            filteredFiles={filteredFiles}
            filesLoading={filesLoading}
            search={search}
            selectedUrl={selectedUrl}
            setSelectedUrl={setSelectedUrl}
            isBlocked={isBlocked}
          />

          {hasNextPage && !search ? (
            <div className={styles.loadMore}>
              <s-button variant="tertiary" onClick={handleLoadMore} loading={filesLoading || undefined} disabled={isBlocked || undefined}>
                Load more
              </s-button>
            </div>
          ) : null}
        </s-stack>
      </s-query-container>
    </s-modal>
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
    return <div className={styles.loading}><s-spinner size="large" accessibilityLabel="Loading files" /></div>;
  }

  if (filteredFiles.length === 0) {
    return <s-text color="subdued">{search ? "No files match your search." : "No image files found in your store."}</s-text>;
  }

  return (
    <div className={styles.fileGrid} data-blocked={isBlocked || undefined}>
      {filteredFiles.map((file) => {
        const isSelected = selectedUrl === file.url;
        return (
          <button
            key={file.id}
            type="button"
            className={styles.fileButton}
            data-selected={isSelected || undefined}
            onClick={() => setSelectedUrl(file.url)}
            disabled={isBlocked}
            aria-pressed={isSelected}
          >
            <img
              src={`${file.url}${file.url.includes("?") ? "&" : "?"}width=160`}
              alt={file.alt || file.filename}
              className={styles.fileImage}
              loading="lazy"
            />
            <span className={styles.fileName}>{truncateStoreFileText(file.filename, 24)}</span>
            <span className={styles.fileDate}>{formatStoreFileDate(file.createdAt)}</span>
          </button>
        );
      })}
    </div>
  );
}
