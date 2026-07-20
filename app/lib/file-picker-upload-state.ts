export function shouldApplyUploadMutationResult({
  hasCurrentAttempt,
  isSuccess,
  isError,
}: {
  hasCurrentAttempt: boolean;
  isSuccess: boolean;
  isError: boolean;
}) {
  return hasCurrentAttempt && (isSuccess || isError);
}
