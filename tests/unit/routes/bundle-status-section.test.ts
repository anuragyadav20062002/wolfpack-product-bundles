import {
  BUNDLE_STATUS_OPTIONS,
  BundleStatus,
} from "../../../app/constants/bundle";

describe("BundleStatusSection", () => {
  it("exposes the canonical status values accepted by bundle status controls", () => {
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
