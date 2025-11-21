import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  ButtonGroup,
  Badge,
  DataTable,
  Thumbnail,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";

// Define a type for the bundle
interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  shopId: string;
  shopifyProductId?: string | null;
  bundleType: 'cart_transform';
  status: 'draft' | 'active' | 'archived';
  active: boolean;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  steps: any[];
  pricing?: any;
}


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get active and draft bundles for the shop (exclude archived/deleted)
  const bundles = await db.bundle.findMany({
    where: {
      shopId: session.shop,
      status: {
        in: ['active', 'draft'] // Only show active and draft bundles, exclude archived
      }
    },
    include: {
      steps: true,
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });


  return json({ 
    bundles,
    shop: session.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;

    try {
      // Get bundle data before archiving (needed for metafield cleanup)
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: session.shop }
      });

      if (!bundle) {
        return json({ success: false, error: "Bundle not found" }, { status: 404 });
      }

      // 1. Update shop metafield to remove bundle from storefront immediately
      if (bundle.shopifyProductId) {
        await MetafieldCleanupService.updateShopMetafieldsAfterDeletion(admin, bundleId);

        // 2. Set Shopify product to DRAFT status
        try {
          const UPDATE_PRODUCT_STATUS = `
            mutation UpdateProductStatus($id: ID!) {
              productUpdate(input: {id: $id, status: DRAFT}) {
                product {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const response = await admin.graphql(UPDATE_PRODUCT_STATUS, {
            variables: { id: bundle.shopifyProductId }
          });

          const data = await response.json();
          if (data.data?.productUpdate?.userErrors?.length > 0) {
            AppLogger.warn("Failed to update Shopify product status",
              { component: "app.dashboard", operation: "archive-bundle" },
              { errors: data.data.productUpdate.userErrors });
          }
        } catch (productError) {
          AppLogger.error("Error updating Shopify product status",
            { component: "app.dashboard", operation: "archive-bundle" },
            productError);
        }
      }

      // 3. Soft delete by setting status to archived
      await db.bundle.update({
        where: { id: bundleId, shopId: session.shop },
        data: {
          status: 'archived',
          active: false,
          updatedAt: new Date()
        }
      });

      AppLogger.info("Bundle archived successfully",
        { component: "app.dashboard", operation: "archive-bundle", bundleId });

      return json({ success: true, message: "Bundle archived successfully" });
    } catch (error) {
      AppLogger.error("Failed to archive bundle", { component: "app.dashboard", operation: "archive-bundle" }, error);
      return json({ success: false, error: "Failed to archive bundle" }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
};

export default function Dashboard() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleCreateBundle = () => {
    navigate("/app/bundles/cart-transform");
  };

  const handleQuickSetup = () => {
    navigate("/app/bundles/cart-transform");
  };

  const handleDirectChat = () => {
    // Open Crisp chat integration
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  };

  const handleEditBundle = (bundle: Bundle) => {
    navigate(`/app/bundles/cart-transform/configure/${bundle.id}`);
  };

  const handleBundleRowClick = (bundle: Bundle) => {
    navigate(`/app/bundles/cart-transform/configure/${bundle.id}`);
  };

  const handleDeleteBundle = (bundleId: string) => {
    if (confirm("Archive this bundle?\n\nThis will:\n• Remove the bundle from your storefront immediately\n• Hide it from customers\n• Preserve all data (you can restore later)\n\nArchived bundles can be permanently deleted later.")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const getBundleTypeDisplay = (_bundleType: string) => {
    return <Badge tone="info">Cart Transform</Badge>;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return <Badge tone="success">Active</Badge>;
      case "draft":
        return <Badge tone="info">Draft</Badge>;
      case "archived":
        return <Badge tone="critical">Archived</Badge>;
      default:
        return <Badge tone="info">{status}</Badge>;
    }
  };

  const bundleRows = bundles.map((bundle) => [
    <div
      key={`name-${bundle.id}`}
      onClick={() => handleBundleRowClick(bundle)}
      style={{ cursor: 'pointer', textDecoration: 'underline' }}
    >
      {bundle.name}
    </div>,
    getBundleTypeDisplay(bundle.bundleType),
    getStatusDisplay(bundle.status),
    bundle.steps?.length || 0,
    bundle.pricing?.enabled ? "Enabled" : "Disabled",
    bundle.createdAt ? new Date(bundle.createdAt).toLocaleDateString() : "",
    <ButtonGroup key={bundle.id}>
      <Button size="micro" onClick={(e) => {
        e.stopPropagation();
        handleEditBundle(bundle);
      }}>
        Edit
      </Button>
      <Button
        size="micro"
        tone="critical"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteBundle(bundle.id);
        }}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page 
      title="Bundle Dashboard"
      subtitle="Manage all your product bundles"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
            <InlineStack gap="200" align="space-between">
                <Text variant="headingSm" as="h3">
                  All Bundles ({bundles.length})
                </Text>
                <InlineStack gap="200">
                  <Button onClick={() => navigate("/app/onboarding")}>
                    Setup Guide
                  </Button>
                  <Button variant="primary" onClick={handleCreateBundle}>
                    Create Bundle
                  </Button>
                </InlineStack>
            </InlineStack>
              
              {bundles.length === 0 ? (
                <Card>
                  <BlockStack gap="400" align="center" inlineAlign="center">
                    <Thumbnail 
                      source="/bundle.png"
                      alt="Bundle setup"
                      size="medium"
                    />
                    <BlockStack gap="200" align="center" inlineAlign="center">
                      <Text variant="headingLg" as="h2" alignment="center">
                        Setup your bundles quickly
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                        Get your bundles up and running in 2 easy steps!
                      </Text>
                    </BlockStack>
                    <Button variant="primary" size="large" onClick={handleQuickSetup}>
                      Quick Setup
                    </Button>
                  </BlockStack>
                </Card>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "numeric", "text", "text", "text"]}
                  headings={["Bundle Name", "Type", "Status", "Steps", "Discount", "Created", "Actions"]}
                  rows={bundleRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Information Cards - Two card layout */}
        <Layout.Section>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch', minHeight: '200px' }}>
            {/* Bundle Analytics Card */}
            <div style={{ flex: '1', minWidth: 0 }}>
              <Card>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
                  {/* Header with gradient background */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: 'linear-gradient(135deg, #00A047 0%, #006B35 100%)',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: '1.5rem'
                  }}>
                    <InlineStack gap="300" align="space-between">
                      <Text variant="headingSm" as="h4" tone="text-inverse">
                        Bundle Overview
                      </Text>
                      <Text as="h3" variant="bodyLg" fontWeight="semibold" tone="text-inverse">
                        {bundles.length} Total
                      </Text>
                    </InlineStack>
                  </div>
                  
                  {/* Content area */}
                  <div style={{ padding: '0 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <BlockStack gap="400">
                      {/* Statistics Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '1.5rem',
                        padding: '1.5rem',
                        backgroundColor: '#F6F6F7',
                        borderRadius: '12px'
                      }}>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.status === 'active').length}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">Active Bundles</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.status === 'draft').length}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">Draft Bundles</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.pricing?.enabled).length}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">With Discounts</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.reduce((total, b) => total + (b.steps?.length || 0), 0)}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">Total Steps</Text>
                        </div>
                      </div>
                      
                      {bundles.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <Text as="span" variant="bodyLg" tone="subdued">
                            No bundles created yet
                          </Text>
                        </div>
                      )}
                    </BlockStack>
                  </div>
                  
                  {/* Bottom spacing */}
                  <div style={{ padding: '1.5rem' }}></div>
                </div>
              </Card>
            </div>

            {/* Your Account Manager Card */}
            <div style={{ flex: '1', minWidth: 0 }}>
              <Card>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '320px', position: 'relative' }}>
                  {/* Header with gradient background */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    background: 'linear-gradient(135deg, #006fbb 0%, #004d87 100%)',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: '1rem'
                  }}>
                    <Text variant="headingSm" as="h4" tone="text-inverse">
                      Your Account Manager
                    </Text>
                  </div>
                  
                  {/* Content area */}
                  <div style={{ padding: '0 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <InlineStack gap="400" align="start" blockAlign="start">
                      <div style={{ position: 'relative', minWidth: '120px' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src="/shrey_pfp.jpg"
                            alt="Shrey (Founder)"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        {/* Online status indicator - positioned outside the image container */}
                        <div style={{
                          position: 'absolute',
                          bottom: '-3px',
                          right: '-3px',
                          width: '18px',
                          height: '18px',
                          backgroundColor: '#00A047',
                          borderRadius: '50%',
                          border: '3px solid white',
                          zIndex: 10
                        }} />
                      </div>
                      
                      <BlockStack gap="200" align="start">
                        <BlockStack gap="100">
                          <Text as="h4" variant="bodyLg" fontWeight="semibold">
                            Shrey
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            Founder
                          </Text>
                        </BlockStack>
                        
                        {/* Services offered with icons */}
                        <BlockStack gap="150">
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text as="span" variant="bodySm">
                              Bundle setup & publishing
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text as="span" variant="bodySm">
                              Custom design & styling
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text as="span" variant="bodySm">
                              Technical support
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      </BlockStack>
                    </InlineStack>
                  </div>

                  {/* CTA Section */}
                  <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
                    <InlineStack gap="300" align="center">
                      <div style={{ flex: 1 }}>
                        <Text as="span" variant="bodySm" tone="subdued">
                          Available Mon-Fri • Responds within 1hr
                        </Text>
                      </div>
                    </InlineStack>
                    <div style={{ marginTop: '12px' }}>
                      <Button variant="primary" fullWidth onClick={handleDirectChat}>
                        Chat Directly with Shrey
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}