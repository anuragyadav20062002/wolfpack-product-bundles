import { Page, Layout, Card, Button, BlockStack, Text, InlineStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server"; // Import db
import { authenticate } from "../shopify.server"; // Import authenticate

// This loader will fetch the bundle details based on the bundleId in the URL
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request); // Authenticate the request
  const shop = session.shop;
  const bundleId = params.bundleId;

  // TODO: Fetch bundle data from your database using Prisma based on bundleId
  // Fetch bundle data from your database using Prisma
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: shop, // Ensure the bundle belongs to the current shop
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  return json({ bundle });
}

export default function BundleBuilderPage() {
  const { bundle } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title={bundle.name}>
        <Button variant="secondary">Add Step</Button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Bundle Steps</Text>
              <Text variant="bodyMd" as="p">No steps yet. Click "Add Step" to create your first step.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Bundle Pricing</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">Configure discounts and pricing rules</Text>
                  <Button variant="secondary">Configure Pricing</Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Bundle Publish</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodyMd" as="p">Make bundle available in your store</Text>
                  <Button variant="primary">Publish</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 