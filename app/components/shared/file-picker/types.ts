import type { RefObject } from "react";
import type { StoreFile } from "../../../routes/app/app.store-files";

export type UploadStatus = "idle" | "uploading" | "polling" | "success" | "timeout" | "error";

export interface FilePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  uploadLabel?: string;
  triggerIcon?: "desktop" | "mobile";
  uploadButtonAction?: "upload" | "openPicker";
  fitPreviewToTrigger?: boolean;
  maxUploadBytes?: number;
  maxUploadErrorMessage?: string;
  autoOpen?: boolean;
  onClose?: () => void;
}

export type FilePickerDialogProps = {
  dialogRef: RefObject<HTMLDialogElement>;
  label: string;
  search: string;
  setSearch: (value: string) => void;
  files: StoreFile[];
  filteredFiles: StoreFile[];
  selectedUrl: string | null;
  setSelectedUrl: (url: string) => void;
  hasNextPage: boolean;
  filesLoading: boolean;
  isBlocked: boolean;
  sizeError: string | null;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  showProgressCircle: boolean;
  progressCircleStatus: "spinning" | "success";
  progressLabel: string;
  progressTone: "subdued" | "success";
  handleClose: () => void;
  handleUploadClick: () => void;
  handleLoadMore: () => void;
  handleSelect: () => void;
};
