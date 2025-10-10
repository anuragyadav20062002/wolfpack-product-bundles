import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
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
  ButtonGroup,
  Banner,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { deleteBundleParentProduct } from "../services/fullPageBundleProduct.server";
import { deleteBundleFromMetafield } from "../services/fullPageBundleMetafield.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Get full-page bundles only (exclude archived)
  const fullPageBundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      bundleType: "full_page",
      status: {
        in: ['active', 'draft']
      }
    },
    include: {
      steps: {
        orderBy: {
          position: 'asc',
        },
      },
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({
    bundles: fullPageBundles,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      // Fetch bundle first
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
      });

      if (!bundle) {
        return json({ error: 'Bundle not found' }, { status: 404 });
      }

      // Delete parent product from Shopify if it exists
      if (bundle.shopifyProductId) {
        try {
          await deleteBundleParentProduct(admin, bundle.shopifyProductId);
        } catch (error) {
          console.error("Error deleting parent product:", error);
          // Continue with bundle deletion even if parent product deletion fails
        }
      }

      // Delete bundle from metafield
      if (bundle.templateName) {
        try {
          await deleteBundleFromMetafield(admin, bundle.templateName);
        } catch (error) {
          console.error("Error deleting bundle metafield:", error);
          // Continue with bundle deletion
        }
      }

      // Delete bundle from database (this will cascade delete steps and pricing)
      await db.bundle.delete({
        where: { id: bundleId, shopId: shop },
      });

      return json({ success: true, message: "Bundle deleted successfully" });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ success: false, error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

export default function FullPageBundles() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleCreateBundle = () => {
    navigate("/app/bundles/full-page/create");
  };

  const handleEditBundle = (bundleId: string) => {
    navigate(`/app/bundles/full-page/${bundleId}`);
  };

  const handleDeleteBundle = (bundleId: string, bundleName: string) => {
    if (confirm(`Are you sure you want to delete "${bundleName}"? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleCopyBundleId = (bundleId: string) => {
    navigator.clipboard.writeText(bundleId);
    // You can add a toast notification here
    alert(`Bundle ID "${bundleId}" copied to clipboard!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge tone="success">Active</Badge>;
      case "draft":
        return <Badge tone="info">Draft</Badge>;
      case "archived":
        return <Badge>Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    <InlineStack gap="200" align="start" key={`id-${bundle.id}`}>
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {bundle.templateName || "N/A"}
      </Text>
      <Button
        size="micro"
        onClick={(e) => {
          e.stopPropagation();
          handleCopyBundleId(bundle.templateName || "");
        }}
      >
        Copy
      </Button>
    </InlineStack>,
    getStatusBadge(bundle.status),
    `${bundle.steps?.length || 0} tabs`,
    bundle.pricing?.enableDiscount ? (
      <Badge tone="success">Enabled</Badge>
    ) : (
      <Badge>Disabled</Badge>
    ),
    new Date(bundle.createdAt).toLocaleDateString(),
    <ButtonGroup key={`actions-${bundle.id}`}>
      <Button
        size="micro"
        onClick={(e) => {
          e.stopPropagation();
          handleEditBundle(bundle.id);
        }}
      >
        Edit
      </Button>
      <Button
        size="micro"
        tone="critical"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteBundle(bundle.id, bundle.name);
        }}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page
      title="Full-Page Bundles"
      subtitle="Manage your full-page bundle builder experiences"
      primaryAction={{
        content: "Create Full-Page Bundle",
        icon: PlusIcon,
        onAction: handleCreateBundle,
      }}
      secondaryActions={[
        {
          content: "Back to Bundle Selection",
          onAction: () => navigate("/app/bundle-type-selection"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Installation Instructions Banner */}
            <Banner title="How to display your bundles" tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  After creating a bundle, follow these steps to display it on your store:
                </Text>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Go to <strong>Online Store → Themes → Customize</strong></li>
                  <li>Navigate to <strong>Pages</strong> and create or edit a page template</li>
                  <li>Add the <strong>"Full Page Bundle Builder"</strong> section</li>
                  <li>Enter your <strong>Bundle ID</strong> (e.g., FBP-1) in the section settings</li>
                  <li>Save and assign the template to a page</li>
                </ol>
              </BlockStack>
            </Banner>

            {/* Bundles Table */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    All Full-Page Bundles ({bundles.length})
                  </Text>
                </InlineStack>

                {bundles.length === 0 ? (
                  <EmptyState
                    heading="Create your first full-page bundle"
                    action={{
                      content: "Create Full-Page Bundle",
                      onAction: handleCreateBundle,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Full-page bundles allow you to create dedicated bundle builder pages
                      with category tabs where customers can mix and match products.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Bundle Name",
                      "Bundle ID",
                      "Status",
                      "Tabs",
                      "Discount",
                      "Created",
                      "Actions",
                    ]}
                    rows={bundleRows}
                  />
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
