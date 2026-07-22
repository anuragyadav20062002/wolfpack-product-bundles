export interface PpbWidgetPlacementGate {
  ready: boolean;
  installationLink: string | null;
  message: string | null;
}

interface PpbWidgetPlacementResponse {
  success?: boolean;
  installationLink?: string;
  message?: string;
}

type PpbPlacementFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Pick<Response, "ok" | "json">>;

function isPlacementResponse(
  value: unknown
): value is PpbWidgetPlacementResponse {
  return value !== null && typeof value === "object";
}

export async function validatePpbWidgetPlacementBeforePreview(
  configureUrl: string,
  fetcher: PpbPlacementFetcher = fetch
): Promise<PpbWidgetPlacementGate> {
  try {
    const placementUrl = new URL(configureUrl);
    placementUrl.pathname = `${placementUrl.pathname.replace(/\/$/, "")}/validate-widget-placement`;
    const response = await fetcher(placementUrl.toString(), {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const responseBody: unknown = await response.json().catch(() => null);
    const result = isPlacementResponse(responseBody) ? responseBody : null;

    if (response.ok && result?.success === true) {
      return { ready: true, installationLink: null, message: null };
    }

    return {
      ready: false,
      installationLink:
        typeof result?.installationLink === "string"
          ? result.installationLink
          : null,
      message:
        typeof result?.message === "string"
          ? result.message
          : "Unable to verify bundle widget placement",
    };
  } catch {
    return {
      ready: false,
      installationLink: null,
      message: "Unable to verify bundle widget placement",
    };
  }
}
