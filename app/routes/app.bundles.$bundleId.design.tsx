import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Modal,
  Badge,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  Form,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import db from "../db.server";
import { authenticate } from "../shopify.server";

interface DesignOption {
  id: string;
  title: string;
  isActive: boolean;
  isComingSoon: boolean;
  description?: string;
  features?: string[];
}

const designOptions: DesignOption[] = [
  {
    id: "inline-product-page",
    title: "Inline Product Page",
    isActive: false,
    isComingSoon: true,
  },
  {
    id: "expandable-product-page",
    title: "Expandable Product Page",
    isActive: true,
    isComingSoon: false,
    description:
      "A bundle builder on the product page that opens a drawer or pop-up to pick items. Uses Shopify's cart transformation. It's a middle ground between fully embedded and separate page.",
    features: ["Compact Design", "Quick Selection", "No Page Redirects"],
  },
  {
    id: "full-page",
    title: "Full Page",
    isActive: false,
    isComingSoon: true,
  },
  {
    id: "full-page-discounts",
    title: "Full Page (Discounts)",
    isActive: false,
    isComingSoon: true,
  },
  {
    id: "subscription-page",
    title: "Subscription Page",
    isActive: false,
    isComingSoon: true,
  },
];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const bundleId = params.bundleId;

  if (!bundleId) {
    throw new Response("Bundle ID is required", { status: 400 });
  }

  // Get bundle details to show bundle name
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  // Check if design is already selected
  let existingDesign = null;
  if (bundle.settings) {
    try {
      const settings = JSON.parse(bundle.settings);
      existingDesign = settings.designType;
    } catch (e) {
      console.error("Error parsing bundle settings:", e);
    }
  }

  return json({ bundle, existingDesign });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const bundleId = params.bundleId;

  if (!bundleId) {
    return json({ error: "Bundle ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const selectedDesign = formData.get("selectedDesign");

  console.log("Design selection action:", { bundleId, selectedDesign });

  if (typeof selectedDesign !== "string" || selectedDesign.length === 0) {
    return json({ error: "Design selection is required" }, { status: 400 });
  }

  try {
    // Verify bundle exists
    const existingBundle = await db.bundle.findUnique({
      where: {
        id: bundleId,
        shopId: session.shop,
      },
    });

    if (!existingBundle) {
      return json({ error: "Bundle not found" }, { status: 404 });
    }

    // Update the bundle with the selected design
    await db.bundle.update({
      where: {
        id: bundleId,
        shopId: session.shop,
      },
      data: {
        settings: JSON.stringify({ designType: selectedDesign }),
      },
    });

    console.log("Bundle updated successfully, redirecting to builder");
    return redirect(`/app/bundles/${bundleId}`);
  } catch (error) {
    console.error("Error updating bundle design:", error);
    return json(
      {
        error: "Failed to update bundle design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};

export default function BundleDesignSelectionPage() {
  const { bundle, existingDesign } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [selectedDesign, setSelectedDesign] = useState<string | null>(
    existingDesign || null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDesign, setModalDesign] = useState<DesignOption | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // Show error toast if action returned an error
  useEffect(() => {
    if (actionData && "error" in actionData) {
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify]);

  const handleDesignClick = (design: DesignOption) => {
    if (design.isActive) {
      setModalDesign(design);
      setSelectedDesign(design.id);
      setIsModalOpen(true);
    }
  };

  const handleRequestDesign = () => {
    window.open("https://tidycal.com/yashwolfpack/15-minute-meeting", "_blank");
  };

  // If design is already selected, show continue button
  const handleContinueToBuilder = () => {
    navigate(`/app/bundles/${bundle.id}`);
  };

  return (
    <Page>
      <TitleBar title={`Select design - ${bundle.name}`} />
      <Layout>
        <Layout.Section>
          <Button
            onClick={() => navigate("/app")}
            icon={ArrowLeftIcon}
            variant="plain"
          >
            Back
          </Button>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Select a design from below
                </Text>
                <Text as="h3" variant="bodyMd" tone="subdued">
                  Choose a design template for "{bundle.name}" bundle
                </Text>
                {existingDesign && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="bodyMd" tone="success">
                      Current design:{" "}
                      {designOptions.find((d) => d.id === existingDesign)
                        ?.title || existingDesign}
                    </Text>
                    <Button variant="primary" onClick={handleContinueToBuilder}>
                      Continue to Bundle Builder
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {designOptions.map((design) => (
                  <Card
                    key={design.id}
                    background={
                      design.isActive ? "bg-surface" : "bg-surface-disabled"
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "300px",
                        cursor: design.isActive ? "pointer" : "not-allowed",
                        opacity: design.isActive ? 1 : 0.6,
                      }}
                      onClick={() => handleDesignClick(design)}
                    >
                      {/* Design Preview Area */}
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: "#f6f6f7",
                          borderRadius: "8px",
                          marginBottom: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "200px",
                        }}
                      >
                        <Text as="h2" variant="bodyMd" tone="subdued">
                          Design Preview
                        </Text>
                      </div>

                      {/* Design Info */}
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="h3" variant="headingMd">
                            {design.title}
                          </Text>
                          {design.isComingSoon && (
                            <Badge tone="info" size="small">
                              Coming Soon
                            </Badge>
                          )}
                          {design.isActive && !design.isComingSoon && (
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: "2px solid #008060",
                                backgroundColor:
                                  selectedDesign === design.id
                                    ? "#008060"
                                    : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {selectedDesign === design.id && (
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: "white",
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </InlineStack>
                      </BlockStack>
                    </div>
                  </Card>
                ))}

                {/* Request a Design Card */}
                <Card>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "300px",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={handleRequestDesign}
                  >
                    <BlockStack gap="300" inlineAlign="center">
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          backgroundColor: "#f6f6f7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                        }}
                      >
                        ✏️
                      </div>
                      <BlockStack gap="100" inlineAlign="center">
                        <Text as="h3" variant="headingMd">
                          Request a Design
                        </Text>
                        <Text
                          as="h3"
                          variant="bodyMd"
                          tone="subdued"
                          alignment="center"
                        >
                          Select a builder design that best suits your use case
                        </Text>
                      </BlockStack>
                      <Button variant="secondary">Ask for a design</Button>
                    </BlockStack>
                  </div>
                </Card>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Design Details Modal with Form */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalDesign?.title || ""}
        primaryAction={{
          content: isSubmitting ? "Selecting..." : "Select Design",
          onAction: () => {
            // Find the form and submit it
            const form = document.getElementById(
              "design-selection-form",
            ) as HTMLFormElement;
            if (form) {
              form.requestSubmit();
            }
          },
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Hidden form for design selection */}
            <Form
              method="post"
              id="design-selection-form"
              style={{ display: "none" }}
            >
              <input
                type="hidden"
                name="selectedDesign"
                value={selectedDesign || ""}
              />
            </Form>

            {/* Design Preview Area */}
            <div
              style={{
                height: "300px",
                backgroundColor: "#f6f6f7",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text as="h2" variant="bodyLg" tone="subdued">
                Design Preview
              </Text>
            </div>

            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                {modalDesign?.title}
              </Text>

              {modalDesign?.features && (
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">
                    Suited For:
                  </Text>
                  <InlineStack gap="200">
                    {modalDesign.features.map((feature, index) => (
                      <Badge key={index} tone="success">
                        {feature}
                      </Badge>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}

              {modalDesign?.description && (
                <Text as="p" variant="bodyMd">
                  {modalDesign.description}
                </Text>
              )}

              <InlineStack gap="200">
                <Button variant="secondary" size="slim">
                  👁️ View Demo
                </Button>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
