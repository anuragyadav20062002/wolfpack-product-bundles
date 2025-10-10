import { useState, useCallback } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Checkbox,
  Banner,
  FormLayout,
  Icon,
  ButtonGroup,
  Divider,
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  DragHandleIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { generateBundleId } from "../services/bundleIdGenerator.server";
import { createBundleParentProduct, publishParentProduct } from "../services/fullPageBundleProduct.server";
import { saveBundleToMetafield, formatBundleForMetafield } from "../services/fullPageBundleMetafield.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "create") {
    try {
      // Parse form data
      const bundleName = formData.get("bundleName") as string;
      const description = formData.get("description") as string;
      const status = formData.get("status") as string;
      const parentVisible = formData.get("parentVisible") === "true";

      // Tabs data
      const tabsData = JSON.parse(formData.get("tabs") as string);

      // Discount data
      const discountEnabled = formData.get("discountEnabled") === "true";
      const discountMethod = formData.get("discountMethod") as string;
      const discountRules = JSON.parse(formData.get("discountRules") as string || "[]");

      // Display settings
      const settings = JSON.parse(formData.get("settings") as string);

      // Validation
      if (!bundleName || bundleName.trim() === "") {
        return json({ error: "Bundle name is required" }, { status: 400 });
      }

      if (!tabsData || tabsData.length === 0) {
        return json({ error: "At least one tab is required" }, { status: 400 });
      }

      // Generate Bundle ID
      const bundleId = await generateBundleId(db, shop);

      // Create parent product in Shopify
      const parentProduct = await createBundleParentProduct(
        admin,
        bundleId,
        bundleName,
        parentVisible
      );

      // Publish parent product if visible (non-critical, wrapped in try-catch)
      if (parentVisible) {
        try {
          await publishParentProduct(admin, parentProduct.id);
        } catch (error) {
          console.log("⚠️ Publishing skipped (missing read_publications scope):", error);
        }
      }

      // Create bundle in database
      const bundle = await db.bundle.create({
        data: {
          name: bundleName,
          description: description || null,
          shopId: shop,
          shopifyProductId: parentProduct.id,
          templateName: bundleId, // Store Bundle ID in templateName field
          bundleType: "full_page",
          status: status as any,
          active: status === "active",
          settings: settings,
        },
      });

      // Create tabs (stored as BundleStep)
      for (let i = 0; i < tabsData.length; i++) {
        const tab = tabsData[i];

        await db.bundleStep.create({
          data: {
            bundleId: bundle.id,
            name: tab.name,
            icon: tab.icon || "box",
            position: i,
            minQuantity: parseInt(tab.minQuantity) || 1,
            maxQuantity: parseInt(tab.maxQuantity) || 10,
            requireSelection: tab.requireSelection || false,
            allowMultiple: tab.allowMultiple !== false, // default true
            displayVariantsAsIndividual: tab.displayVariantsAsIndividual || false,
            products: tab.products || [], // Store selected products as JSON
            enabled: true,
          },
        });
      }

      // Create pricing/discount configuration
      await db.bundlePricing.create({
        data: {
          bundleId: bundle.id,
          enableDiscount: discountEnabled,
          discountMethod: discountMethod as any || "fixed_amount_off",
          rules: discountRules,
        },
      });

      // Fetch the complete bundle with relations for metafield
      const completeBundle = await db.bundle.findUnique({
        where: { id: bundle.id },
        include: {
          steps: true,
          pricing: true,
        },
      });

      // Format and save bundle config to metafield for liquid block access
      const bundleConfig = formatBundleForMetafield(completeBundle);
      await saveBundleToMetafield(admin, shop, bundleId, bundleConfig);

      return redirect(`/app/bundles/full-page/${bundle.id}`);
    } catch (error) {
      console.error("Error creating bundle:", error);
      return json({
        error: error instanceof Error ? error.message : "Failed to create bundle"
      }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function CreateFullPageBundle() {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  // Basic Info State
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [parentVisible, setParentVisible] = useState(true);

  // Tabs State
  const [tabs, setTabs] = useState([
    {
      id: "tab-1",
      name: "Category 1",
      icon: "box",
      products: [],
      minQuantity: 1,
      maxQuantity: 10,
      requireSelection: false,
      allowMultiple: true,
      displayVariantsAsIndividual: false,
    },
  ]);

  // Discount State
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountMethod, setDiscountMethod] = useState("fixed_amount_off");
  const [discountRules, setDiscountRules] = useState([
    { minItems: 1, value: 10 },
  ]);

  // Display Settings State
  const [settings, setSettings] = useState({
    layout: "sidebar-right",
    preview_sticky: true,
    button_text: "Add To Cart",
    success_message: "Success! Your ₹{discount} discount has been applied!",
    grid_columns: 3,
    enable_loading_animation: true,
  });

  // Tab Handlers
  const handleAddTab = useCallback(() => {
    setTabs([
      ...tabs,
      {
        id: `tab-${Date.now()}`,
        name: `Category ${tabs.length + 1}`,
        icon: "box",
        products: [],
        minQuantity: 1,
        maxQuantity: 10,
        requireSelection: false,
        allowMultiple: true,
        displayVariantsAsIndividual: false,
      },
    ]);
  }, [tabs]);

  const handleRemoveTab = useCallback((tabId: string) => {
    if (tabs.length <= 1) {
      alert("At least one tab is required");
      return;
    }
    setTabs(tabs.filter(tab => tab.id !== tabId));
  }, [tabs]);

  const handleUpdateTab = useCallback((tabId: string, field: string, value: any) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, [field]: value } : tab
    ));
  }, [tabs]);

  const handleMoveTab = useCallback((index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === tabs.length - 1)
    ) {
      return;
    }

    const newTabs = [...tabs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    setTabs(newTabs);
  }, [tabs]);

  // Discount Rule Handlers
  const handleAddDiscountRule = useCallback(() => {
    setDiscountRules([
      ...discountRules,
      { minItems: 1, value: 10 },
    ]);
  }, [discountRules]);

  const handleRemoveDiscountRule = useCallback((index: number) => {
    setDiscountRules(discountRules.filter((_, i) => i !== index));
  }, [discountRules]);

  const handleUpdateDiscountRule = useCallback((index: number, field: string, value: any) => {
    setDiscountRules(discountRules.map((rule, i) =>
      i === index ? { ...rule, [field]: value } : rule
    ));
  }, [discountRules]);

  // Product Selection Handler (will open Shopify resource picker)
  const handleSelectProducts = async (tabId: string) => {
    // Use Shopify App Bridge resource picker
    const shopify = (window as any).shopify;
    if (!shopify) return;

    try {
      const selection = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (selection) {
        const selectedProducts = selection.map((product: any) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          image: product.images?.[0]?.originalSrc || null,
          variants: product.variants || [],
        }));

        handleUpdateTab(tabId, "products", selectedProducts);
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  };

  // Form Submit Handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!bundleName.trim()) {
      alert("Bundle name is required");
      return;
    }

    if (tabs.length === 0) {
      alert("At least one tab is required");
      return;
    }

    // Create FormData and submit using Remix's submit
    const formData = new FormData();
    formData.append("actionType", "create");
    formData.append("bundleName", bundleName);
    formData.append("description", description);
    formData.append("status", status);
    formData.append("parentVisible", String(parentVisible));
    formData.append("tabs", JSON.stringify(tabs));
    formData.append("discountEnabled", String(discountEnabled));
    formData.append("discountMethod", discountMethod);
    formData.append("discountRules", JSON.stringify(discountRules));
    formData.append("settings", JSON.stringify(settings));
    
    submit(formData, { method: "post" });
  }, [bundleName, description, status, parentVisible, tabs, discountEnabled, discountMethod, discountRules, settings, submit]);

  return (
    <Page
      title="Create Full-Page Bundle"
      backAction={{ onAction: () => navigate("/app/bundles/full-page") }}
    >
      <form method="post" onSubmit={handleSubmit}>

        <Layout>
          {actionData?.error && (
            <Layout.Section>
              <Banner tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            </Layout.Section>
          )}

          {/* Basic Information */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Basic Information
                </Text>
                <FormLayout>
                  <TextField
                    label="Bundle Name"
                    value={bundleName}
                    onChange={setBundleName}
                    placeholder="e.g., Build Your Gift Box"
                    helpText="Internal name for this bundle"
                    autoComplete="off"
                    requiredIndicator
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    multiline={4}
                    placeholder="Describe this bundle..."
                    autoComplete="off"
                  />
                  <Select
                    label="Status"
                    options={[
                      { label: "Draft", value: "draft" },
                      { label: "Active", value: "active" },
                    ]}
                    value={status}
                    onChange={setStatus}
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Parent Product */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Parent Product
                </Text>
                <Banner tone="info">
                  A parent product will be automatically created for this bundle.
                  This product represents the bundle in the cart and checkout.
                </Banner>
                <Checkbox
                  label="Make parent product visible in catalog"
                  checked={parentVisible}
                  onChange={setParentVisible}
                  helpText="If enabled, the bundle container product will be visible in your store's product catalog"
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Tab Configuration */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    Category Tabs
                  </Text>
                  <Button icon={PlusIcon} onClick={handleAddTab}>
                    Add Tab
                  </Button>
                </InlineStack>
                <Text tone="subdued" as="p">
                  Create category tabs for your bundle builder page. Customers will navigate between tabs to select products.
                </Text>

                {tabs.map((tab, index) => (
                  <Card key={tab.id}>
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <InlineStack gap="200">
                          <Icon source={DragHandleIcon} tone="base" />
                          <Text variant="headingSm" as="h3">
                            Tab {index + 1}
                          </Text>
                        </InlineStack>
                        <ButtonGroup>
                          <Button
                            size="micro"
                            onClick={() => handleMoveTab(index, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="micro"
                            onClick={() => handleMoveTab(index, "down")}
                            disabled={index === tabs.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            size="micro"
                            tone="critical"
                            icon={DeleteIcon}
                            onClick={() => handleRemoveTab(tab.id)}
                            disabled={tabs.length === 1}
                          >
                            Remove
                          </Button>
                        </ButtonGroup>
                      </InlineStack>

                      <FormLayout>
                        <TextField
                          label="Tab Name"
                          value={tab.name}
                          onChange={(value) => handleUpdateTab(tab.id, "name", value)}
                          placeholder="e.g., Gifts, Wrapping, Accessories"
                          autoComplete="off"
                        />

                        <Select
                          label="Icon (optional)"
                          options={[
                            { label: "Box", value: "box" },
                            { label: "Gift", value: "gift" },
                            { label: "Star", value: "star" },
                            { label: "Heart", value: "heart" },
                            { label: "Tag", value: "tag" },
                          ]}
                          value={tab.icon}
                          onChange={(value) => handleUpdateTab(tab.id, "icon", value)}
                        />

                        <div>
                          <Text variant="bodyMd" as="p" fontWeight="medium">
                            Products in this tab
                          </Text>
                          <div style={{ marginTop: "8px" }}>
                            <Button onClick={() => handleSelectProducts(tab.id)}>
                              {tab.products.length > 0
                                ? `${tab.products.length} products selected`
                                : "Select Products"}
                            </Button>
                          </div>
                          {tab.products.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                              <Text variant="bodySm" tone="subdued" as="p">
                                Selected: {tab.products.map((p: any) => p.title).join(", ")}
                              </Text>
                            </div>
                          )}
                        </div>

                        <Divider />

                        <Text variant="headingSm" as="h4">
                          Selection Rules
                        </Text>

                        <Checkbox
                          label="Require at least one product from this tab"
                          checked={tab.requireSelection}
                          onChange={(value) => handleUpdateTab(tab.id, "requireSelection", value)}
                          helpText="Customer must select at least 1 product from this tab"
                        />

                        <TextField
                          label="Minimum products to select"
                          type="number"
                          value={String(tab.minQuantity)}
                          onChange={(value) => handleUpdateTab(tab.id, "minQuantity", value)}
                          min={0}
                          max={50}
                          autoComplete="off"
                        />

                        <TextField
                          label="Maximum products to select"
                          type="number"
                          value={String(tab.maxQuantity)}
                          onChange={(value) => handleUpdateTab(tab.id, "maxQuantity", value)}
                          min={1}
                          max={50}
                          autoComplete="off"
                        />

                        <Checkbox
                          label="Display variants as individual products"
                          checked={tab.displayVariantsAsIndividual}
                          onChange={(value) => handleUpdateTab(tab.id, "displayVariantsAsIndividual", value)}
                        />
                      </FormLayout>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Discount Configuration */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Discount Settings
                </Text>

                <Checkbox
                  label="Enable discount for this bundle"
                  checked={discountEnabled}
                  onChange={setDiscountEnabled}
                />

                {discountEnabled && (
                  <>
                    <Select
                      label="Discount Type"
                      options={[
                        { label: "Fixed Amount Off", value: "fixed_amount_off" },
                        { label: "Percentage Off", value: "percentage_off" },
                        { label: "Fixed Bundle Price", value: "fixed_bundle_price" },
                      ]}
                      value={discountMethod}
                      onChange={setDiscountMethod}
                    />

                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text variant="headingSm" as="h3">
                          Discount Rules
                        </Text>
                        <Button size="micro" icon={PlusIcon} onClick={handleAddDiscountRule}>
                          Add Rule
                        </Button>
                      </InlineStack>

                      {discountRules.map((rule, index) => (
                        <InlineStack key={index} gap="200" align="start">
                          <TextField
                            label="Min Items"
                            type="number"
                            value={String(rule.minItems)}
                            onChange={(value) => handleUpdateDiscountRule(index, "minItems", parseInt(value) || 1)}
                            min={1}
                            autoComplete="off"
                          />
                          <TextField
                            label={`Discount ${discountMethod === "percentage_off" ? "%" : "Amount"}`}
                            type="number"
                            value={String(rule.value)}
                            onChange={(value) => handleUpdateDiscountRule(index, "value", parseFloat(value) || 0)}
                            min={0}
                            prefix={discountMethod === "percentage_off" ? "%" : "₹"}
                            autoComplete="off"
                          />
                          <div style={{ paddingTop: "28px" }}>
                            <Button
                              size="micro"
                              tone="critical"
                              icon={DeleteIcon}
                              onClick={() => handleRemoveDiscountRule(index)}
                              disabled={discountRules.length === 1}
                            />
                          </div>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Display Settings */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Display Settings
                </Text>

                <FormLayout>
                  <Select
                    label="Bundle Preview Position"
                    options={[
                      { label: "Right Sidebar", value: "sidebar-right" },
                      { label: "Left Sidebar", value: "sidebar-left" },
                    ]}
                    value={settings.layout}
                    onChange={(value) => setSettings({ ...settings, layout: value })}
                  />

                  <Checkbox
                    label="Make preview sticky (scrolls with page)"
                    checked={settings.preview_sticky}
                    onChange={(value) => setSettings({ ...settings, preview_sticky: value })}
                  />

                  <TextField
                    label="Add to Cart Button Text"
                    value={settings.button_text}
                    onChange={(value) => setSettings({ ...settings, button_text: value })}
                    placeholder="Add To Cart"
                    autoComplete="off"
                  />

                  <TextField
                    label="Success Message"
                    value={settings.success_message}
                    onChange={(value) => setSettings({ ...settings, success_message: value })}
                    placeholder="Success! Your {discount} discount has been applied!"
                    helpText="Use {discount} to show the discount amount"
                    autoComplete="off"
                  />

                  <Select
                    label="Product Grid Columns"
                    options={[
                      { label: "2 Columns", value: "2" },
                      { label: "3 Columns", value: "3" },
                      { label: "4 Columns", value: "4" },
                    ]}
                    value={String(settings.grid_columns)}
                    onChange={(value) => setSettings({ ...settings, grid_columns: parseInt(value) })}
                  />

                  <Checkbox
                    label="Enable loading animation when adding to cart"
                    checked={settings.enable_loading_animation}
                    onChange={(value) => setSettings({ ...settings, enable_loading_animation: value })}
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Installation Instructions */}
          <Layout.Section>
            <Banner title="Installation Instructions" tone="info">
              <BlockStack gap="200">
                <Text as="p">After creating this bundle, follow these steps to display it on your store:</Text>
                <ol style={{ paddingLeft: "20px", margin: 0 }}>
                  <li>Go to <strong>Online Store → Themes → Customize</strong></li>
                  <li>Navigate to <strong>Pages</strong> and create or edit a page template</li>
                  <li>Click <strong>Add Section</strong> and select <strong>"Full Page Bundle Builder"</strong></li>
                  <li>Enter the Bundle ID that will be generated after creating this bundle</li>
                  <li>Save the template and assign it to a page</li>
                </ol>
              </BlockStack>
            </Banner>
          </Layout.Section>

          {/* Form Actions */}
          <Layout.Section>
            <InlineStack align="end" gap="200">
              <Button onClick={() => navigate("/app/bundles/full-page")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                submit
                loading={isSubmitting}
              >
                Create Bundle
              </Button>
            </InlineStack>
          </Layout.Section>
        </Layout>
      </form>
    </Page>
  );
}
