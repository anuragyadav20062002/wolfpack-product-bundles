import React from "react";

import { FilePickerTrigger } from "../../../app/components/shared/file-picker/FilePickerTrigger";

jest.mock("@shopify/polaris", () => ({
  BlockStack: "BlockStack",
  Button: "Button",
  InlineStack: "InlineStack",
  Spinner: "Spinner",
  Text: "Text",
}));

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    value: null,
    currentFilename: null,
    label: "Choose banner image",
    uploadLabel: "Upload image",
    triggerIcon: "desktop" as const,
    uploadButtonAction: "upload" as const,
    fitPreviewToTrigger: false,
    triggerIsUploading: false,
    uploadStatus: "idle" as const,
    handleOpen: jest.fn(),
    handleRemove: jest.fn(),
    handleTriggerUpload: jest.fn(),
    ...overrides,
  };
}

function getEmptyTriggerChildren(props: ReturnType<typeof makeProps>) {
  const trigger = FilePickerTrigger(props as any);
  const content = React.Children.toArray(trigger.props.children)[0] as React.ReactElement;
  return React.Children.toArray(content.props.children) as React.ReactElement[];
}

describe("FilePickerTrigger", () => {
  it("opens the asset picker when the upload button uses picker mode", () => {
    const props = makeProps({ uploadButtonAction: "openPicker" });
    const children = getEmptyTriggerChildren(props);
    const uploadButton = children.at(-1)!;

    uploadButton.props.onClick({ stopPropagation: jest.fn() });

    expect(props.handleOpen).toHaveBeenCalledTimes(1);
    expect(props.handleTriggerUpload).not.toHaveBeenCalled();
  });

  it("uses the mobile device icon for mobile banner pickers", () => {
    const props = makeProps({ triggerIcon: "mobile" });
    const children = getEmptyTriggerChildren(props);
    const icon = children[0];

    expect((icon.type as Function).name).toBe("MobileIcon");
  });
});
