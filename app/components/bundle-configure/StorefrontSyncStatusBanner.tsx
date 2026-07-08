import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "@remix-run/react";

type StorefrontSyncState = {
  status?: "queued" | "syncing" | "synced" | "failed";
  attemptId?: string | null;
  error?: string | null;
};

function getTone(status: StorefrontSyncState["status"]) {
  if (status === "failed") return "critical";
  if (status === "queued" || status === "syncing") return "info";
  return "success";
}

function getTitle(status: StorefrontSyncState["status"]) {
  if (status === "failed") return "Storefront sync failed";
  if (status === "queued") return "Storefront sync queued";
  if (status === "syncing") return "Storefront sync in progress";
  return "Storefront sync complete";
}

function getBody(status: StorefrontSyncState["status"], error?: string | null) {
  if (status === "failed") {
    return error || "Retry storefront sync before testing the storefront bundle.";
  }
  if (status === "queued") return "Storefront and Cart Transform updates are waiting to run.";
  if (status === "syncing") return "Storefront and Cart Transform updates are running.";
  return "Storefront and Cart Transform updates are current.";
}

export function StorefrontSyncStatusBanner({
  initialState,
}: {
  initialState?: StorefrontSyncState | null;
}) {
  const fetcher = useFetcher<any>();
  const [state, setState] = useState<StorefrontSyncState>(
    initialState ?? { status: "synced" },
  );
  const status = state.status ?? "synced";
  const isPending = status === "queued" || status === "syncing";

  useEffect(() => {
    setState(initialState ?? { status: "synced" });
  }, [initialState]);

  useEffect(() => {
    const nextState = fetcher.data?.storefrontSync;
    if (nextState) setState(nextState);
  }, [fetcher.data]);

  useEffect(() => {
    if (!isPending) return undefined;
    const interval = window.setInterval(() => {
      if (fetcher.state !== "idle") return;
      const formData = new FormData();
      formData.append("intent", "getStorefrontSyncStatus");
      fetcher.submit(formData, { method: "post" });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [fetcher, isPending]);

  const actions = useMemo(() => {
    if (status !== "failed") return undefined;
    return (
      <s-button
        variant="secondary"
        icon="clock"
        loading={fetcher.state !== "idle" || undefined}
        disabled={fetcher.state !== "idle" || undefined}
        onClick={() => {
          const formData = new FormData();
          formData.append("intent", "retryStorefrontSync");
          fetcher.submit(formData, { method: "post" });
        }}
      >
        Retry storefront sync
      </s-button>
    );
  }, [fetcher, status]);

  return (
    <s-banner tone={getTone(status)}>
      <s-stack gap="small">
        <s-text>{getTitle(status)}</s-text>
        <s-text>{getBody(status, state.error)}</s-text>
        {actions}
      </s-stack>
    </s-banner>
  );
}
