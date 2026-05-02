import { useState, useEffect } from "react";

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

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  return (
    <s-banner tone="warning" dismissible onHide={handleDismiss} suppressHydrationWarning>
      {themeEditorUrl && (
        <s-button
          slot="primaryAction"
          onClick={() => window.open(themeEditorUrl, "_blank")}
        >
          Enable here
        </s-button>
      )}
      Enable the Wolfpack theme extension to display your bundles on the storefront.
    </s-banner>
  );
}
