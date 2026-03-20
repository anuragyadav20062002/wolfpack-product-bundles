import { Banner, Button, InlineStack, Text } from "@shopify/polaris";

interface ProxyHealthBannerProps {
  shop: string;
  appUrl: string;
}

/**
 * Shown on the dashboard when the Shopify app proxy is not registered for this store.
 * Without the proxy, full-page bundle widgets and DCP design settings cannot load on
 * the storefront. The fix is a one-click app reinstall that re-establishes the proxy link.
 */
export function ProxyHealthBanner({ shop, appUrl }: ProxyHealthBannerProps) {
  const reinstallUrl = `${appUrl}/?shop=${shop}`;

  return (
    <Banner tone="critical" onDismiss={undefined}>
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            App proxy not connected
          </Text>
          <Text as="span" variant="bodyMd">
            Full-page bundle widgets won&apos;t load on your storefront. Reinstall the app to fix this.
          </Text>
        </InlineStack>
        <Button variant="primary" url={reinstallUrl} external>
          Reinstall app
        </Button>
      </InlineStack>
    </Banner>
  );
}
