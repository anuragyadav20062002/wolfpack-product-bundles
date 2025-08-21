import { useState, useCallback } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  RadioButton,
  Banner,
  Toast,
  Frame,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

interface LoaderData {
  shopSettings: {
    discountImplementation: "discount_function" | "cart_transformation";
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get or create shop settings
  let shopSettings = await db.shopSettings.findUnique({
    where: { shopId: shop },
  });

  if (!shopSettings) {
    shopSettings = await db.shopSettings.create({
      data: {
        shopId: shop,
        discountImplementation: "discount_function",
      },
    });
  }

  return json({
    shopSettings: {
      discountImplementation: shopSettings.discountImplementation,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const discountImplementation = formData.get("discountImplementation") as "discount_function" | "cart_transformation";

  if (!discountImplementation || !["discount_function", "cart_transformation"].includes(discountImplementation)) {
    return json({ error: "Invalid discount implementation type" }, { status: 400 });
  }

  // Update shop settings
  await db.shopSettings.upsert({
    where: { shopId: shop },
    update: { discountImplementation },
    create: {
      shopId: shop,
      discountImplementation,
    },
  });

  return json({ success: true });
};

export default function Settings() {
  const { shopSettings } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  
  const [discountImplementation, setDiscountImplementation] = useState<"discount_function" | "cart_transformation">(
    shopSettings.discountImplementation
  );
  const [showToast, setShowToast] = useState(false);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("discountImplementation", discountImplementation);
    fetcher.submit(formData, { method: "post" });
    setShowToast(true);
  }, [discountImplementation, fetcher]);

  const handleDiscountImplementationChange = useCallback(
    (checked: boolean, newValue: string) => {
      if (checked) {
        setDiscountImplementation(newValue as "discount_function" | "cart_transformation");
      }
    },
    []
  );

  const toastMarkup = showToast ? (
    <Toast
      content="Settings saved successfully"
      onDismiss={() => setShowToast(false)}
    />
  ) : null;

  return (
    <Frame>
      <Page
        title="Bundle Settings"
        backAction={{ content: "Back", url: "/app" }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Discount Implementation
                </Text>
                
                <Text as="p" color="subdued">
                  Choose how bundle discounts are applied in your store. This setting affects all bundles store-wide.
                </Text>

                <BlockStack gap="300">
                  <RadioButton
                    label="Discount Functions (Recommended)"
                    helpText="Traditional discount system - works with all Shopify stores. Discounts appear at checkout."
                    checked={discountImplementation === "discount_function"}
                    id="discount_function"
                    name="discountImplementation"
                    onChange={handleDiscountImplementationChange}
                  />
                  
                  <RadioButton
                    label="Cart Transformation (Shopify Plus Only)"
                    helpText="Real-time cart updates with bundle visualization. Requires Shopify Plus subscription."
                    checked={discountImplementation === "cart_transformation"}
                    id="cart_transformation"
                    name="discountImplementation"
                    onChange={handleDiscountImplementationChange}
                  />
                </BlockStack>

                {discountImplementation === "cart_transformation" && (
                  <Banner status="info">
                    <p>
                      <strong>Cart Transformation Features:</strong>
                    </p>
                    <ul>
                      <li>Real-time bundle pricing in cart</li>
                      <li>Bundle displayed as single item</li>
                      <li>Immediate discount visibility</li>
                      <li>Enhanced shopping experience</li>
                    </ul>
                    <p>
                      <strong>Note:</strong> This feature requires Shopify Plus and may not be compatible with all themes and checkout customizations.
                    </p>
                  </Banner>
                )}

                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={fetcher.state === "submitting"}
                >
                  Save Settings
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  Implementation Comparison
                </Text>
                
                <BlockStack gap="200">
                  <div>
                    <Text variant="headingSm" as="h4">Discount Functions</Text>
                    <Text as="p" color="subdued">
                      ✓ Works on all Shopify plans<br/>
                      ✓ Compatible with all themes<br/>
                      ✓ Standard checkout flow<br/>
                      • Discounts shown at checkout
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="headingSm" as="h4">Cart Transformation</Text>
                    <Text as="p" color="subdued">
                      ✓ Real-time pricing updates<br/>
                      ✓ Bundle as single cart item<br/>
                      ✓ Enhanced user experience<br/>
                      • Requires Shopify Plus
                    </Text>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastMarkup}
    </Frame>
  );
}