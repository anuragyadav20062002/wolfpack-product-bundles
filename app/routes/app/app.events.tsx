import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, BlockStack, Text, InlineStack, Badge } from "@shopify/polaris";
import { authenticate } from "../../shopify.server";
import { AccordionItem } from "../../components/AccordionItem";
import { CartPropertyFixContent } from "../../components/CartPropertyFixCard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

// ─────────────────────────────────────────────────────────────────────────────
// Static content — add new events / FAQs here
// ─────────────────────────────────────────────────────────────────────────────

const LATEST_EVENTS = [
  {
    id: "fpb-metafield-cache-v2.3.0",
    title: "FPB Bundle Config Metafield Cache",
    subtitle: "Full-page bundles now load instantly — no app proxy round-trip on first paint.",
    badge: "v2.3.0",
    badgeColor: "#e6f4ea",
    badgeTextColor: "#1e7e34",
    content: (
      <BlockStack gap="400">
        <Text variant="bodySm" as="p" tone="subdued">
          Released: March 2026
        </Text>
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="semibold" as="p">What changed</Text>
          <Text variant="bodySm" tone="subdued" as="p">
            When a merchant clicks "Place Widget Now" or "Sync Bundle", the full bundle
            configuration is serialised as JSON and stored directly on the Shopify page as a{' '}
            <code style={{ fontFamily: 'monospace', background: '#f4f4f4', padding: '1px 4px', borderRadius: 3, fontSize: '0.88em' }}>custom:bundle_config</code>
            {' '}metafield. The FPB widget reads this metafield at load time via a{' '}
            <code style={{ fontFamily: 'monospace', background: '#f4f4f4', padding: '1px 4px', borderRadius: 3, fontSize: '0.88em' }}>data-bundle-config</code>
            {' '}attribute, skipping the proxy API call entirely.
          </Text>
        </BlockStack>
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="semibold" as="p">Why it matters</Text>
          <Text variant="bodySm" tone="subdued" as="p">
            Eliminates the visible loading spinner on first paint for full-page bundles.
            The proxy API remains as a fallback if the metafield is absent.
          </Text>
        </BlockStack>
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="semibold" as="p">What you need to do</Text>
          <Text variant="bodySm" tone="subdued" as="p">
            Click <strong>Sync Bundle</strong> on any existing full-page bundle to populate the metafield.
            New bundles created after this release populate it automatically.
          </Text>
        </BlockStack>
      </BlockStack>
    ),
  },
] as const;

const FAQS_AND_TUTORIALS = [
  {
    id: "cart-property-display-fix",
    title: "Cart Property Display Fix",
    subtitle: "Hide internal bundle properties from your cart page on custom themes.",
    badge: "Custom themes only",
    badgeColor: "#e8f4fd",
    badgeTextColor: "#0066b2",
    content: <CartPropertyFixContent />,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  useLoaderData<typeof loader>();

  return (
    <Page
      title="Events"
      subtitle="Release notes, how-tos, and tutorials"
    >
      <Layout>

        {/* ── Latest Events ──────────────────────────────────────────── */}
        <Layout.Section>
          <BlockStack gap="400">
            <SectionHeader
              title="Latest Events"
              count={LATEST_EVENTS.length}
            />
            <BlockStack gap="300">
              {LATEST_EVENTS.map((item) => (
                <AccordionItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  badge={item.badge}
                  badgeColor={item.badgeColor}
                  badgeTextColor={item.badgeTextColor}
                >
                  {item.content}
                </AccordionItem>
              ))}
            </BlockStack>
          </BlockStack>
        </Layout.Section>

        {/* ── FAQs & Tutorials ───────────────────────────────────────── */}
        <Layout.Section>
          <BlockStack gap="400">
            <SectionHeader
              title="FAQs & Tutorials"
              count={FAQS_AND_TUTORIALS.length}
            />
            <BlockStack gap="300">
              {FAQS_AND_TUTORIALS.map((item) => (
                <AccordionItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  badge={item.badge}
                  badgeColor={item.badgeColor}
                  badgeTextColor={item.badgeTextColor}
                >
                  {item.content}
                </AccordionItem>
              ))}
            </BlockStack>
          </BlockStack>
        </Layout.Section>

      </Layout>
    </Page>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <InlineStack gap="200" blockAlign="center">
      <Text variant="headingMd" as="h2">{title}</Text>
      <Badge tone="info">{String(count)}</Badge>
    </InlineStack>
  );
}
