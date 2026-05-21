interface ProxyHealthBannerProps {
  shop: string;
  appUrl: string;
}

export function ProxyHealthBanner({ shop, appUrl }: ProxyHealthBannerProps) {
  const reinstallUrl = `${appUrl}/?shop=${shop}`;

  return (
    <s-banner tone="critical">
      <s-button slot="primaryAction" variant="primary" href={reinstallUrl} target="_blank">
        Reinstall app
      </s-button>
      <strong>App proxy not connected</strong> — Full-page bundle widgets won&apos;t load on your storefront.
      Reinstall the app to fix this.
    </s-banner>
  );
}
