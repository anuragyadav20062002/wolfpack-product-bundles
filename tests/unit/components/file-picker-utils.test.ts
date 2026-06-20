import {
  filenameFromUrl,
  formatStoreFileDate,
  truncateStoreFileText,
} from "../../../app/components/shared/file-picker/utils";

describe("file picker utilities", () => {
  it("truncates long labels while leaving short labels unchanged", () => {
    expect(truncateStoreFileText("short.png", 24)).toBe("short.png");
    expect(truncateStoreFileText("averyverylongfilename.png", 12)).toBe("averyverylo…");
  });

  it("extracts and decodes filenames from URLs", () => {
    expect(filenameFromUrl("https://cdn.example.com/files/Hero%20Image.png?width=80"))
      .toBe("Hero Image.png");
  });

  it("falls back to the original string when filename parsing fails", () => {
    expect(filenameFromUrl("not a url")).toBe("not a url");
  });

  it("formats valid store file dates and matches existing invalid date handling", () => {
    expect(formatStoreFileDate("not-a-date")).toBe("Invalid Date");
    expect(formatStoreFileDate("2026-06-21T00:00:00.000Z")).toEqual(
      expect.any(String)
    );
  });
});
