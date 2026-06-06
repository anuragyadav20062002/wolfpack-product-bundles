import fs from "node:fs";
import path from "node:path";
import {
  BUNDLE_STATUS_OPTIONS,
  BundleStatus,
} from "../../../app/constants/bundle";

describe("BundleStatusSection", () => {
  it("renders status options from the shared contract through Polaris select", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx"),
      "utf8"
    );

    const constantsSource = fs.readFileSync(
      path.join(process.cwd(), "app/constants/bundle.ts"),
      "utf8"
    );

    expect(source).toContain("value={status}");
    expect(source).toContain("<s-select");
    expect(source).toContain("<s-option");
    expect(source).not.toContain("<option ");
    expect(source).toContain("statusOptions.map((opt)");
    expect(source).toContain("{opt.label}");

    expect(constantsSource).toContain("Unlisted (Ad Campaigns)");
  });

  it("validates selected status against the canonical status options", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx"),
      "utf8"
    );

    expect(source).toContain("statusOptions.some");
    expect(source).toContain("opt.value === nextValue");

    const statusValues = BUNDLE_STATUS_OPTIONS.map((option) => option.value);
    expect(statusValues).toEqual([
      BundleStatus.ACTIVE,
      BundleStatus.DRAFT,
      BundleStatus.ARCHIVED,
      BundleStatus.UNLISTED,
    ]);
  });

  it("uses the shared canonical status option sequence in UI order", () => {
    const statusValues = BUNDLE_STATUS_OPTIONS.map((option) => option.value);
    const statusLabels = BUNDLE_STATUS_OPTIONS.map((option) => option.label);

    expect(statusValues).toEqual([
      BundleStatus.ACTIVE,
      BundleStatus.DRAFT,
      BundleStatus.ARCHIVED,
      BundleStatus.UNLISTED,
    ]);
    expect(statusLabels).toEqual([
      "Active",
      "Draft",
      "Archived",
      "Unlisted (Ad Campaigns)",
    ]);
  });
}); 
