import { useEffect, useState } from "react";
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
  Avatar,
  Thumbnail,
  ProgressBar,
  Checkbox,
  Icon,
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

// Bundle setup steps for progress tracking
interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const BUNDLE_SETUP_STEPS: SetupStep[] = [
  {
    id: "create_bundle",
    title: "Click on Create New Bundle",
    description: "Start by creating your first bundle",
    completed: false,
  },
  {
    id: "name_description",
    title: "Name and Description",
    description: "Give your bundle a name and description",
    completed: false,
  },
  {
    id: "create_bundle_config",
    title: "Click on Create Bundle",
    description: "Configure your bundle settings",
    completed: false,
  },
  {
    id: "add_step",
    title: "Click on Add Step",
    description: "Add steps to your bundle",
    completed: false,
  },
  {
    id: "add_products",
    title: "Add the Products or Collection you want to display in that step",
    description: "Select products or collections for your bundle",
    completed: false,
  },
  {
    id: "publish",
    title: "Click Publish",
    description: "Publish your bundle to make it live",
    completed: false,
  },
  {
    id: "preview",
    title: "Preview the bundle",
    description: "Test your bundle before going live",
    completed: false,
  },
];

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
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>(BUNDLE_SETUP_STEPS);

  // Calculate progress based on completed steps
  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  // Update setup progress based on existing bundles
  useEffect(() => {
    if (bundles.length > 0) {
      const updatedSteps = setupSteps.map(step => {
        switch (step.id) {
          case "create_bundle":
          case "name_description":
          case "create_bundle_config":
            return { ...step, completed: true };
          case "add_step":
            return { ...step, completed: bundles.some(b => b.steps && b.steps.length > 0) };
          case "add_products":
            return { ...step, completed: bundles.some(b => b.steps && b.steps.some((s: any) => s.products && s.products.length > 0)) };
          case "publish":
            return { ...step, completed: bundles.some(b => b.status === "active") };
          case "preview":
            return { ...step, completed: bundles.some(b => b.status === "active") };
          default:
            return step;
        }
      });
      setSetupSteps(updatedSteps);
    }
  }, [bundles]);

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
    } else {
      navigate(`/app/bundles/${bundle.id}`);
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
      <Button size="micro" onClick={() => handleEditBundle(bundle)}>
        Edit
      </Button>
      <Button 
        size="micro" 
        tone="critical" 
        onClick={() => handleDeleteBundle(bundle.id)}
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
                <DataTable
                  columnContentTypes={["text", "text", "text", "numeric", "text", "text", "text"]}
                  headings={["Bundle Name", "Type", "Status", "Steps", "Discount", "Created", "Actions"]}
                  rows={bundleRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Bundle Setup Instructions and Account Manager cards - Always visible */}
        <Layout.Section>
          <InlineStack gap="400" align="start" blockAlign="start">
            {/* Bundle Setup Instructions Card - Equal width, natural height */}
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    Bundle Setup Instructions
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Follow these steps to set up the best bundle experience for your users
                  </Text>
                  
                  {/* Progress Bar */}
                  <BlockStack gap="150">
                    <InlineStack gap="200" align="space-between">
                      <Text variant="bodyXs" tone="subdued">
                        Progress: {completedSteps}/{setupSteps.length} completed
                      </Text>
                      <Text variant="bodyXs" tone="subdued">
                        {Math.round(progressPercentage)}%
                      </Text>
                    </InlineStack>
                    <ProgressBar progress={progressPercentage} />
                  </BlockStack>

                  {/* Setup Steps with Checkboxes */}
                  <BlockStack gap="200">
                    {setupSteps.map((step) => (
                      <InlineStack key={step.id} gap="200" align="start">
                        <Checkbox
                          label=""
                          checked={step.completed}
                          disabled
                        />
                        <BlockStack gap="050">
                          <Text variant="bodySm" fontWeight={step.completed ? "regular" : "medium"}>
                            {step.title}
                          </Text>
                          <Text variant="bodyXs" tone="subdued">
                            {step.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </div>

            {/* Your Account Manager Card - Equal width, natural height */}
            <div style={{ flex: '1' }}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Your account manager
                  </Text>
                  
                  <InlineStack gap="300" align="start">
                    <Thumbnail 
                      size="large"
                      source="/Yash.jpg"
                      alt="Yash (Founder)"
                    />
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="medium">
                        Yash (Founder)
                      </Text>
                      <BlockStack gap="100">
                        <Text variant="bodySm" tone="subdued">
                          • For setting up and publishing bundle
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          • For customizing the design of the bundle
                        </Text>
                      </BlockStack>
                    </BlockStack>
                  </InlineStack>

                  <Button variant="primary" fullWidth onClick={handleScheduleMeeting}>
                    Schedule Meeting
                  </Button>
                </BlockStack>
              </Card>
            </div>
          </InlineStack>
        </Layout.Section>
        
        {bundles.length > 0 && (
          <Layout.Section>
            <InlineStack gap="400" align="start">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h4">
                    Bundle Types
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      <Badge tone="info">Cart Transform</Badge>
                      <Text variant="bodyMd">Real-time cart updates (Shopify Plus)</Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Badge tone="success">Discount Function</Badge>
                      <Text variant="bodyMd">Automatic discounts (All plans)</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h4">
                    Bundle Status
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      <Badge tone="success">Active</Badge>
                      <Text variant="bodyMd">Published and live</Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Badge tone="subdued">Draft</Badge>
                      <Text variant="bodyMd">Not yet published</Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Badge tone="critical">Archived</Badge>
                      <Text variant="bodyMd">Disabled bundle</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </InlineStack>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}