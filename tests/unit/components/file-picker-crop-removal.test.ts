import { readFileSync } from "node:fs";
import path from "node:path";

describe("FilePicker crop removal contract", () => {
  it("does not expose promo banner crop editor props or controls", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/components/shared/FilePicker.tsx"),
      "utf8",
    );

    expect(source).not.toContain("ImageCropEditor");
    expect(source).not.toContain("cropValue");
    expect(source).not.toContain("onCropChange");
    expect(source).not.toContain("hideCropEditor");
    expect(source).not.toContain("cropEditorOpen");
  });
});
