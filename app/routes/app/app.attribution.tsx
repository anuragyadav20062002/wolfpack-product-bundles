/**
 * Attribution Dashboard Route
 *
 * Displays UTM attribution analytics for bundle sales.
 * Shows revenue by platform, campaign, and bundle with date range filtering.
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  DataTable,
  Select,
  Badge,
  EmptyState,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { useState, useCallback, useMemo } from "react";

/** Format cents to dollars */
function formatRevenue(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get all attributions for this shop within the date range
  const attributions = await db.orderAttribution.findMany({
    where: {
      shopId: session.shop,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate by platform (utmSource)
  const byPlatform: Record<string, { revenue: number; orders: number }> = {};
  for (const attr of attributions) {
    const source = attr.utmSource || "unknown";
    if (!byPlatform[source]) byPlatform[source] = { revenue: 0, orders: 0 };
    byPlatform[source].revenue += attr.revenue;
    byPlatform[source].orders += 1;
  }

  // Aggregate by campaign
  const byCampaign: Record<string, { revenue: number; orders: number; source: string }> = {};
  for (const attr of attributions) {
    const campaign = attr.utmCampaign || "(no campaign)";
    if (!byCampaign[campaign]) {
      byCampaign[campaign] = { revenue: 0, orders: 0, source: attr.utmSource || "unknown" };
    }
    byCampaign[campaign].revenue += attr.revenue;
    byCampaign[campaign].orders += 1;
  }

  // Get bundle names for bundle-specific attributions
  const bundleIds = [...new Set(attributions.filter(a => a.bundleId).map(a => a.bundleId!))];
  const bundles = bundleIds.length > 0
    ? await db.bundle.findMany({
        where: { id: { in: bundleIds } },
        select: { id: true, name: true },
      })
    : [];
  const bundleNameMap = Object.fromEntries(bundles.map(b => [b.id, b.name]));

  // Aggregate by bundle
  const byBundle: Record<string, { name: string; revenue: number; orders: number }> = {};
  for (const attr of attributions) {
    if (!attr.bundleId) continue;
    if (!byBundle[attr.bundleId]) {
      byBundle[attr.bundleId] = {
        name: bundleNameMap[attr.bundleId] || "Unknown Bundle",
        revenue: 0,
        orders: 0,
      };
    }
    byBundle[attr.bundleId].revenue += attr.revenue;
    byBundle[attr.bundleId].orders += 1;
  }

  // Summary stats
  const totalRevenue = attributions.reduce((sum, a) => sum + a.revenue, 0);
  const totalOrders = attributions.length;
  const bundleOrders = attributions.filter(a => a.bundleId).length;

  return json({
    days,
    summary: { totalRevenue, totalOrders, bundleOrders },
    byPlatform: Object.entries(byPlatform)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byCampaign: Object.entries(byCampaign)
      .map(([campaign, data]) => ({ campaign, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byBundle: Object.values(byBundle).sort((a, b) => b.revenue - a.revenue),
  });
};

export default function AttributionDashboard() {
  const { days, summary, byPlatform, byCampaign, byBundle } = useLoaderData<typeof loader>();
  const [selectedDays, setSelectedDays] = useState(days.toString());

  const handleDaysChange = useCallback((value: string) => {
    setSelectedDays(value);
    // Navigate with new date range
    const url = new URL(window.location.href);
    url.searchParams.set("days", value);
    window.location.href = url.toString();
  }, []);

  const dateRangeOptions = useMemo(() => [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ], []);

  if (summary.totalOrders === 0) {
    return (
      <Page
        title="Attribution"
        backAction={{ content: "Dashboard", url: "/app" }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="No attribution data yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  Attribution data will appear here once customers start arriving
                  via UTM-tagged links and completing purchases.
                </p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Attribution"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        {/* Date Range Filter */}
        <Layout.Section>
          <InlineStack align="end">
            <Box width="200px">
              <Select
                label="Date range"
                labelInline
                options={dateRangeOptions}
                value={selectedDays}
                onChange={handleDaysChange}
              />
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Summary Cards */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">Total Ad Revenue</Text>
                <Text variant="headingLg" as="p">{formatRevenue(summary.totalRevenue)}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">Attributed Orders</Text>
                <Text variant="headingLg" as="p">{summary.totalOrders}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">Bundle Orders</Text>
                <Text variant="headingLg" as="p">{summary.bundleOrders}</Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Revenue by Platform */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Revenue by Platform</Text>
              <DataTable
                columnContentTypes={["text", "numeric", "numeric"]}
                headings={["Platform", "Orders", "Revenue"]}
                rows={byPlatform.map((p) => [
                  p.source,
                  p.orders.toString(),
                  formatRevenue(p.revenue),
                ])}
                totals={[
                  "",
                  summary.totalOrders.toString(),
                  formatRevenue(summary.totalRevenue),
                ]}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Revenue by Campaign */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Revenue by Campaign</Text>
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric"]}
                headings={["Campaign", "Source", "Orders", "Revenue"]}
                rows={byCampaign.map((c) => [
                  c.campaign,
                  c.source,
                  c.orders.toString(),
                  formatRevenue(c.revenue),
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Revenue by Bundle */}
        {byBundle.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Top Bundles by Ad Revenue</Text>
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric"]}
                  headings={["Bundle", "Orders", "Revenue"]}
                  rows={byBundle.map((b) => [
                    b.name,
                    b.orders.toString(),
                    formatRevenue(b.revenue),
                  ])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
