import { useCallback, useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Banner, BlockStack, Text } from "@shopify/polaris";
import {
  useLazyGetUploadStoreFileStatusQuery,
  useLazyListStoreFilesQuery,
  useUploadStoreFileMutation,
} from "../../store/api/adminApi";
import { FilePickerDialog } from "./file-picker/FilePickerDialog";
import { FilePickerTrigger } from "./file-picker/FilePickerTrigger";
import type { FilePickerProps, UploadStatus } from "./file-picker/types";
import type { StoreFile } from "../../routes/app/app.store-files";
import {
  ACCEPTED_TYPES,
  MAX_BYTES,
  MAX_POLLS,
  filenameFromUrl,
} from "./file-picker/utils";
import { shouldApplyUploadMutationResult } from "../../lib/file-picker-upload-state";

export function FilePicker({
  value,
  onChange,
  label = "Choose background image",
  hint,
  uploadLabel = "Upload image",
  triggerIcon = "desktop",
  uploadButtonAction = "upload",
  fitPreviewToTrigger = false,
  maxUploadBytes = MAX_BYTES,
  maxUploadErrorMessage = "File must be under 20 MB.",
  autoOpen = false,
  onClose,
}: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<StoreFile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);
  const [pollTrigger, setPollTrigger] = useState(0);
  const [uploadFromTrigger, setUploadFromTrigger] = useState(false);
  const pollCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCurrentUploadAttemptRef = useRef(false);

  const [loadStoreFiles, filesQuery] = useLazyListStoreFilesQuery();
  const [uploadStoreFile, uploadResult] = useUploadStoreFileMutation();
  const [loadUploadStatus, statusQuery] = useLazyGetUploadStoreFileStatusQuery();
  const resetUploadMutationRef = useRef(uploadResult.reset);
  resetUploadMutationRef.current = uploadResult.reset;

  const filesLoading = filesQuery.isFetching;
  const isBlocked = uploadStatus === "uploading" || uploadStatus === "polling";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open && files.length === 0) {
      void loadStoreFiles();
    }
  }, [files.length, loadStoreFiles, open]);

  useEffect(() => {
    if (!filesQuery.data) return;
    const { files: newFiles, pageInfo } = filesQuery.data;
    setFiles((prev) => {
      const existingIds = new Set(prev.map((file) => file.id));
      const unique = newFiles.filter((file) => !existingIds.has(file.id));
      return [...prev, ...unique];
    });
    setHasNextPage(pageInfo.hasNextPage);
    setCursor(pageInfo.endCursor ?? null);
  }, [filesQuery.data]);

  useEffect(() => {
    if (!shouldApplyUploadMutationResult({
      hasCurrentAttempt: hasCurrentUploadAttemptRef.current,
      isSuccess: uploadResult.isSuccess,
      isError: uploadResult.isError,
    }) || !uploadResult.isSuccess || !uploadResult.data) return;
    const result = uploadResult.data;
    if (result.ok && result.fileId) {
      setPendingFileId(result.fileId);
      pollCountRef.current = 0;
      setPollTrigger(0);
      setUploadStatus("polling");
      return;
    }
    setUploadStatus("error");
    setUploadError(result.error ?? "Upload failed. Please try again.");
    setUploadFromTrigger(false);
    hasCurrentUploadAttemptRef.current = false;
  }, [uploadResult.data, uploadResult.isError, uploadResult.isSuccess]);

  useEffect(() => {
    if (!shouldApplyUploadMutationResult({
      hasCurrentAttempt: hasCurrentUploadAttemptRef.current,
      isSuccess: uploadResult.isSuccess,
      isError: uploadResult.isError,
    }) || !uploadResult.isError) return;
    setUploadStatus("error");
    setUploadError("Upload failed. Please try again.");
    setUploadFromTrigger(false);
    hasCurrentUploadAttemptRef.current = false;
  }, [uploadResult.isError, uploadResult.isSuccess]);

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
      void loadUploadStatus(pendingFileId);
    }, 2000);

    return () => clearTimeout(timer);
  }, [loadUploadStatus, pendingFileId, pollTrigger, uploadStatus]);

  useEffect(() => {
    if (!statusQuery.isSuccess || !statusQuery.data || uploadStatus !== "polling") return;
    const result = statusQuery.data;

    if (result.fileStatus === "READY" && result.file) {
      if (uploadFromTrigger) {
        onChange(result.file.url);
        setUploadFromTrigger(false);
      } else {
        setFiles((prev) => {
          const existingIds = new Set(prev.map((file) => file.id));
          if (existingIds.has(result.file!.id)) return prev;
          return [result.file!, ...prev];
        });
        setSelectedUrl(result.file.url);
      }
      setUploadStatus("success");
      setPendingFileId(null);
      hasCurrentUploadAttemptRef.current = false;
      return;
    }

    if (result.fileStatus === "FAILED") {
      setUploadStatus("error");
      setUploadError("Upload processing failed. Please try again.");
      setPendingFileId(null);
      setUploadFromTrigger(false);
      hasCurrentUploadAttemptRef.current = false;
      return;
    }

    setPollTrigger((current) => current + 1);
  }, [statusQuery.data, statusQuery.isSuccess, uploadStatus, uploadFromTrigger, onChange]);

  useEffect(() => {
    if (statusQuery.isError && uploadStatus === "polling") {
      setUploadStatus("error");
      setUploadError("Upload processing failed. Please try again.");
      setPendingFileId(null);
      setUploadFromTrigger(false);
      hasCurrentUploadAttemptRef.current = false;
    }
  }, [statusQuery.isError, uploadStatus]);

  useEffect(() => {
    if (uploadStatus !== "success") return;
    const timer = setTimeout(() => setUploadStatus("idle"), 1500);
    return () => clearTimeout(timer);
  }, [uploadStatus]);

  const resetUploadState = useCallback(() => {
    hasCurrentUploadAttemptRef.current = false;
    resetUploadMutationRef.current();
    setUploadStatus("idle");
    setUploadError(null);
    setSizeError(null);
    setPendingFileId(null);
    setUploadFromTrigger(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
    onClose?.();
  }, [resetUploadState, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [handleClose, open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOpen = useCallback(() => {
    if (isBlocked) return;
    setOpen(true);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
  }, [isBlocked, resetUploadState]);

  useEffect(() => {
    if (autoOpen) handleOpen();
  }, [autoOpen, handleOpen]);

  const handleSelect = useCallback(() => {
    if (selectedUrl) onChange(selectedUrl);
    setOpen(false);
    setSelectedUrl(null);
    setSearch("");
    resetUploadState();
  }, [selectedUrl, onChange, resetUploadState]);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleLoadMore = useCallback(() => {
    if (cursor) {
      void loadStoreFiles({ cursor });
    }
  }, [cursor, loadStoreFiles]);

  const handleUploadClick = useCallback(() => {
    setSizeError(null);
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  const handleTriggerUpload = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      if (isBlocked) return;
      setUploadFromTrigger(true);
      setSizeError(null);
      setUploadError(null);
      fileInputRef.current?.click();
    },
    [isBlocked],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (!file) {
        setUploadFromTrigger(false);
        return;
      }

      if (file.size > maxUploadBytes) {
        setSizeError(maxUploadErrorMessage);
        setUploadFromTrigger(false);
        return;
      }

      setSizeError(null);
      setPendingFileId(null);
      pollCountRef.current = 0;
      setPollTrigger(0);
      setUploadStatus("uploading");
      hasCurrentUploadAttemptRef.current = true;

      const form = new FormData();
      form.append("file", file);
      void uploadStoreFile(form);
    },
    [maxUploadBytes, maxUploadErrorMessage, uploadStoreFile],
  );

  const filteredFiles = search
    ? files.filter((file) => file.filename.toLowerCase().includes(search.toLowerCase()))
    : files;
  const currentFilename = value ? filenameFromUrl(value) : null;
  const showProgressCircle =
    uploadStatus === "uploading" || uploadStatus === "polling" || uploadStatus === "success";
  const progressCircleStatus: "spinning" | "success" = uploadStatus === "success" ? "success" : "spinning";
  const progressLabel =
    uploadStatus === "uploading"
      ? "Uploading…"
      : uploadStatus === "polling"
        ? "Processing…"
        : "Upload complete!";
  const progressTone: "subdued" | "success" = uploadStatus === "success" ? "success" : "subdued";
  const triggerIsUploading = uploadFromTrigger && isBlocked;

  return (
    <BlockStack gap="200">
      {!autoOpen && (
        <FilePickerTrigger
          value={value}
          currentFilename={currentFilename}
          label={label}
          hint={hint}
          uploadLabel={uploadLabel}
          triggerIcon={triggerIcon}
          uploadButtonAction={uploadButtonAction}
          fitPreviewToTrigger={fitPreviewToTrigger}
          triggerIsUploading={triggerIsUploading}
          uploadStatus={uploadStatus}
          handleOpen={handleOpen}
          handleRemove={handleRemove}
          handleTriggerUpload={handleTriggerUpload}
        />
      )}

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

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      <FilePickerDialog
        dialogRef={dialogRef}
        label={label}
        search={search}
        setSearch={setSearch}
        files={files}
        filteredFiles={filteredFiles}
        selectedUrl={selectedUrl}
        setSelectedUrl={setSelectedUrl}
        hasNextPage={hasNextPage}
        filesLoading={filesLoading}
        isBlocked={isBlocked}
        sizeError={sizeError}
        uploadStatus={uploadStatus}
        uploadError={uploadError}
        showProgressCircle={showProgressCircle}
        progressCircleStatus={progressCircleStatus}
        progressLabel={progressLabel}
        progressTone={progressTone}
        handleClose={handleClose}
        handleUploadClick={handleUploadClick}
        handleLoadMore={handleLoadMore}
        handleSelect={handleSelect}
      />
    </BlockStack>
  );
}
