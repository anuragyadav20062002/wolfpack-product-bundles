import { useState } from "react";
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
import { TitleBar } from "@shopify/app-bridge-react";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
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

  return json({ bundle });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const bundleId = params.bundleId;
  const formData = await request.formData();
  const selectedDesign = formData.get("selectedDesign");

  if (typeof selectedDesign !== "string" || selectedDesign.length === 0) {
    return json({ error: "Design selection is required" }, { status: 400 });
  }

  try {
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

    // Redirect to the bundle builder page
    return redirect(`/app/bundles/${bundleId}`);
  } catch (error) {
    console.error("Error updating bundle design:", error);
    return json({ error: "Failed to update bundle design" }, { status: 500 });
  }
};

export default function BundleDesignSelectionPage() {
  const { bundle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDesign, setModalDesign] = useState<DesignOption | null>(null);

  const handleDesignClick = (design: DesignOption) => {
    if (design.isActive) {
      setModalDesign(design);
      setSelectedDesign(design.id);
      setIsModalOpen(true);
    }
  };

  const handleSelectDesign = () => {
    if (selectedDesign) {
      const formData = new FormData();
      formData.append("selectedDesign", selectedDesign);
      fetcher.submit(formData, { method: "post" });
      setIsModalOpen(false);
    }
  };

  const handleRequestDesign = () => {
    // Open the meeting scheduler in a new window
    window.open("https://tidycal.com/yashwolfpack/15-minute-meeting", "_blank");
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

      {/* Design Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalDesign?.title || ""}
        primaryAction={{
          content: "Select Design",
          onAction: handleSelectDesign,
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
