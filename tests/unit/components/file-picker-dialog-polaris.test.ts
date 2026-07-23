import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilePickerDialog } from "../../../app/components/shared/file-picker/FilePickerDialog";

describe("File picker dialog", () => {
  it("uses a Polaris modal with discoverable primary and secondary actions", () => {
    const view = renderToStaticMarkup(React.createElement(FilePickerDialog, {
      dialogRef: { current: null },
      label: "Choose image",
      search: "",
      setSearch: jest.fn(),
      files: [],
      filteredFiles: [],
      selectedUrl: null,
      setSelectedUrl: jest.fn(),
      hasNextPage: false,
      filesLoading: false,
      isBlocked: false,
      sizeError: null,
      uploadStatus: "idle",
      uploadError: null,
      showProgressCircle: false,
      progressCircleStatus: "spinning",
      progressLabel: "",
      progressTone: "subdued",
      handleClose: jest.fn(),
      handleUploadClick: jest.fn(),
      handleLoadMore: jest.fn(),
      handleSelect: jest.fn(),
    }));

    expect(view).toContain("<s-modal");
    expect(view).toContain('slot="primary-action"');
    expect(view).toContain('slot="secondary-actions"');
    expect(view).toContain("Search files");
  });
});
