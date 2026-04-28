import { useState, useEffect } from "react";
import { Banner } from "@shopify/polaris";

const SESSION_KEY = "wb_embed_dismissed";

interface AppEmbedBannerProps {
  appEmbedEnabled: boolean;
  themeEditorUrl: string | null;
}

export function AppEmbedBanner({ appEmbedEnabled, themeEditorUrl }: AppEmbedBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(SESSION_KEY) === "1");
  }, []);

  if (appEmbedEnabled || dismissed) return null;

  return (
    <Banner
      tone="warning"
      onDismiss={() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setDismissed(true);
      }}
      action={
        themeEditorUrl
          ? {
              content: "Enable here",
              onAction: () => window.open(themeEditorUrl, "_blank"),
            }
          : undefined
      }
    >
      Enable the Wolfpack theme extension to display your bundles on the storefront.
    </Banner>
  );
}
