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
  EmptyState,
  Thumbnail,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { EditIcon, PlusIcon, ProductIcon } from "@shopify/polaris-icons";
import db from "../db.server";

// Define a type for the bundle
interface Bundle {
  id: string;
  name: string;
  description?: string;
  shopId: string;
  shopifyProductId?: string;
  bundleType: 'cart_transform' | 'discount_function';
  status: 'draft' | 'active' | 'archived';
  active: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  steps: any[];
  pricing?: any;
}


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get all bundles for the shop
  const bundles = await db.bundle.findMany({
    where: { shopId: session.shop },
    include: { 
      steps: true, 
      pricing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`🔍 [DASHBOARD DEBUG] Total bundles found: ${bundles.length}`);

  return json({ 
    bundles,
    shop: session.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "deleteBundle") {
    const bundleId = formData.get("bundleId") as string;
    
    try {
      await db.bundle.delete({
        where: { id: bundleId, shopId: session.shop },
      });
      
      return json({ success: true, message: "Bundle deleted successfully" });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ success: false, error: "Failed to delete bundle" }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
};

export default function Dashboard() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleCreateBundle = () => {
    navigate("/app/bundle-type-selection");
  };

  const handleQuickSetup = () => {
    navigate("/app/bundle-type-selection");
  };

  const handleScheduleMeeting = () => {
    // Open external link for scheduling
    window.open("https://calendly.com/yash-wolfpack", "_blank");
  };

  const handleEditBundle = (bundle: Bundle) => {
    if (bundle.bundleType === "cart_transform") {
      navigate(`/app/bundles/cart-transform/configure/${bundle.id}`);
    } else if (bundle.bundleType === "discount_function") {
      navigate(`/app/bundles/discount-functions/configure/${bundle.id}`);
    } else {
      navigate(`/app/bundles/${bundle.id}`);
    }
  };

  const handleBundleRowClick = (bundle: Bundle) => {
    // Navigate to the bundle type's main page where they can see all bundles of that type
    if (bundle.bundleType === "cart_transform") {
      navigate("/app/bundles/cart-transform");
    } else if (bundle.bundleType === "discount_function") {
      navigate("/app/bundles/discount-functions");
    } else {
      navigate("/app/bundle-type-selection");
    }
  };

  const handleDeleteBundle = (bundleId: string) => {
    if (confirm("Are you sure you want to delete this bundle?")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const getBundleTypeDisplay = (bundleType: string) => {
    switch (bundleType) {
      case "cart_transform":
        return <Badge tone="info">Cart Transform</Badge>;
      case "discount_function":
        return <Badge tone="success">Discount Function</Badge>;
      default:
        return <Badge tone="subdued">Unknown</Badge>;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "active":
        return <Badge tone="success">Active</Badge>;
      case "draft":
        return <Badge tone="subdued">Draft</Badge>;
      case "archived":
        return <Badge tone="critical">Archived</Badge>;
      default:
        return <Badge tone="subdued">{status}</Badge>;
    }
  };

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    getBundleTypeDisplay(bundle.bundleType),
    getStatusDisplay(bundle.status),
    bundle.steps?.length || 0,
    bundle.pricing?.enableDiscount ? "Enabled" : "Disabled",
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
                <Button variant="primary" onClick={handleCreateBundle}>
                  Create Bundle
                </Button>
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
                      <Text variant="bodyMd" tone="subdued" alignment="center">
                        Get your bundles up and running in 2 easy steps!
                      </Text>
                    </BlockStack>
                    <Button variant="primary" size="large" onClick={handleQuickSetup}>
                      Quick Setup
                    </Button>
                  </BlockStack>
                </Card>
              ) : (
                <div style={{ cursor: 'default' }}>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "numeric", "text", "text", "text"]}
                    headings={["Bundle Name", "Type", "Status", "Steps", "Discount", "Created", "Actions"]}
                    rows={bundleRows.map((row, index) => 
                      row.map((cell, cellIndex) => {
                        if (cellIndex === row.length - 1) {
                          // Actions column - keep as is
                          return cell;
                        }
                        return (
                          <div
                            key={`${index}-${cellIndex}`}
                            style={{ 
                              cursor: 'pointer',
                              width: '100%',
                              padding: '8px 0'
                            }}
                            onClick={() => handleBundleRowClick(bundles[index])}
                          >
                            {cell}
                          </div>
                        );
                      })
                    )}
                  />
                </div>
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
                      <Text variant="bodyLg" fontWeight="semibold" tone="text-inverse">
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
                          <Text variant="bodyMd" tone="subdued">Active Bundles</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.status === 'draft').length}
                          </Text>
                          <Text variant="bodyMd" tone="subdued">Draft Bundles</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.bundleType === 'cart_transform').length}
                          </Text>
                          <Text variant="bodyMd" tone="subdued">Cart Transform</Text>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <Text variant="headingLg" as="p" fontWeight="bold">
                            {bundles.filter(b => b.bundleType === 'discount_function').length}
                          </Text>
                          <Text variant="bodyMd" tone="subdued">Discount Function</Text>
                        </div>
                      </div>
                      
                      {bundles.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <Text variant="bodyLg" tone="subdued">
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
                    <InlineStack gap="400" align="start" blockAlignment="start">
                      <div style={{ position: 'relative', minWidth: '120px' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src="/Yash.jpg"
                            alt="Yash (Founder)"
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
                          <Text variant="bodyLg" fontWeight="semibold">
                            Yash Chaudhari
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            Founder
                          </Text>
                        </BlockStack>
                        
                        {/* Services offered with icons */}
                        <BlockStack gap="150">
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text variant="bodySm">
                              Bundle setup & publishing
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text variant="bodySm">
                              Custom design & styling
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" align="start">
                            <div style={{ width: '16px', height: '16px', backgroundColor: '#006fbb', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }} />
                            <Text variant="bodySm">
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
                        <Text variant="bodySm" tone="subdued">
                          Available Mon-Fri • Responds within 1hr
                        </Text>
                      </div>
                    </InlineStack>
                    <div style={{ marginTop: '12px' }}>
                      <Button variant="primary" fullWidth onClick={handleScheduleMeeting}>
                        Schedule Call
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