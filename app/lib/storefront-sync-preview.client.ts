type PrepareStorefrontPreviewResponse = {
  success?: boolean;
  ready?: boolean;
  error?: string | null;
};

export function getPrepareStorefrontPreviewUrl(location: Location) {
  const previewUrl = new URL(location.href);
  previewUrl.pathname = `${previewUrl.pathname.replace(/\/$/, "")}/prepare-preview`;
  return previewUrl.toString();
}

export async function prepareStorefrontPreviewForOpen() {
  const formData = new FormData();
  formData.append("intent", "preparePreviewBundle");

  const response = await fetch(getPrepareStorefrontPreviewUrl(window.location), {
    method: "POST",
    body: formData,
  });
  let data: PrepareStorefrontPreviewResponse | null = null;

  try {
    data = (await response.json()) as PrepareStorefrontPreviewResponse;
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success || !data.ready) {
    throw new Error(
      data?.error ?? "Preview is not ready. Please try preview again.",
    );
  }
}
