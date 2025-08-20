import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  EmptyState,
  DataTable,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get discount function bundles only
  const discountFunctionBundles = await db.bundle.findMany({
    where: { 
      shopId: session.shop,
      bundleType: "discount_function",
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: discountFunctionBundles,
    bundleType: "discount_function",
  });
}

export default function DiscountFunctionBundles() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleCreateBundle = () => {
    navigate("/app/bundles/discount-functions/create");
  };

  const handleEditBundle = (bundleId: string) => {
    navigate(`/app/bundles/discount-functions/${bundleId}`);
  };

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    <Badge tone={bundle.status === "active" ? "success" : "subdued"}>
      {bundle.status}
    </Badge>,
    bundle.steps.length,
    bundle.pricing?.enableDiscount ? "Enabled" : "Disabled",
    bundle.pricing?.discountMethod || "N/A",
    bundle.createdAt ? new Date(bundle.createdAt).toLocaleDateString() : "",
    <Button 
      variant="plain" 
      onClick={() => handleEditBundle(bundle.id)}
    >
      Edit
    </Button>,
  ]);

  return (
    <Page 
      title="Discount Function Bundles"
      subtitle="Manage bundles that use automatic discount functions"
      primaryAction={{
        content: "Create Discount Function Bundle",
        icon: PlusIcon,
        onAction: handleCreateBundle,
      }}
      secondaryActions={[
        {
          content: "Back to Bundle Types",
          onAction: () => navigate("/app/bundle-type-selection"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" align="space-between">
                <Text variant="headingSm" as="h3">
                  Active Discount Function Bundles
                </Text>
                <Badge tone="success">Discount Function Mode</Badge>
              </InlineStack>
              
              {bundles.length === 0 ? (
                <EmptyState
                  heading="Create your first discount function bundle"
                  action={{
                    content: "Create Discount Function Bundle",
                    onAction: handleCreateBundle,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" tone="subdued">
                    Discount function bundles apply automatic discounts when bundle 
                    conditions are met. Compatible with all Shopify plans.
                  </Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "numeric", "text", "text", "text", "text"]}
                  headings={["Bundle Name", "Status", "Steps", "Discount", "Type", "Created", "Actions"]}
                  rows={bundleRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingSm" as="h4">
                Discount Function Bundle Features
              </Text>
              <BlockStack gap="200">
                <Text variant="bodyMd">
                  <strong>Automatic Discounts:</strong> Discounts are applied automatically 
                  when customers meet bundle requirements.
                </Text>
                <Text variant="bodyMd">
                  <strong>Multiple Discount Types:</strong> Support for fixed amount discounts, 
                  percentage discounts, and free shipping offers.
                </Text>
                <Text variant="bodyMd">
                  <strong>Universal Compatibility:</strong> Works on all Shopify plans 
                  without requiring Shopify Plus.
                </Text>
                <Text variant="bodyMd">
                  <strong>Flexible Conditions:</strong> Set minimum quantities and 
                  customize discount rules for different bundle scenarios.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}