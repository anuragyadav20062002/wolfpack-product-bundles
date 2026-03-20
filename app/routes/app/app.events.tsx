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
    title: "Landing Page Bundles Now Load Instantly",
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
            Your full-page bundles now appear instantly when a customer visits the page —
            no more loading spinner while the bundle content loads in.
          </Text>
        </BlockStack>
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="semibold" as="p">Why it matters</Text>
          <Text variant="bodySm" tone="subdued" as="p">
            A faster first impression means a smoother shopping experience.
            Customers see your bundle immediately, which reduces drop-off before they even engage with it.
          </Text>
        </BlockStack>
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="semibold" as="p">What you need to do</Text>
          <Text variant="bodySm" tone="subdued" as="p">
            For any full-page bundles you set up before this update, open the bundle and click{' '}
            <strong>Sync Bundle</strong> once. That's it — bundles you create going forward are already covered.
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
      backAction={{ content: "Dashboard", url: "/app/dashboard" }}
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
