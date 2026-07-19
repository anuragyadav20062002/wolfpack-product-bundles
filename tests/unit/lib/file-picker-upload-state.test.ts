import { shouldApplyUploadMutationResult } from "../../../app/lib/file-picker-upload-state";

describe("file picker upload attempt state", () => {
  it("ignores a stale upload result before current-session interaction", () => {
    expect(shouldApplyUploadMutationResult({ hasCurrentAttempt: false, isSuccess: true, isError: false })).toBe(false);
    expect(shouldApplyUploadMutationResult({ hasCurrentAttempt: false, isSuccess: false, isError: true })).toBe(false);
  });

  it("accepts a result for the current upload attempt", () => {
    expect(shouldApplyUploadMutationResult({ hasCurrentAttempt: true, isSuccess: true, isError: false })).toBe(true);
    expect(shouldApplyUploadMutationResult({ hasCurrentAttempt: true, isSuccess: false, isError: true })).toBe(true);
  });
});
