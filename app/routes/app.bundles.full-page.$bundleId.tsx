import { useState, useCallback, useEffect } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useActionData, useNavigation } from "@remix-run/react";
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
  Badge,
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  DragHandleIcon,
  DuplicateIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { updateBundleParentProduct, deleteBundleParentProduct } from "../services/fullPageBundleProduct.server";
import { saveBundleToMetafield, deleteBundleFromMetafield, formatBundleForMetafield } from "../services/fullPageBundleMetafield.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { bundleId } = params;

  if (!bundleId) {
    throw new Response("Bundle ID is required", { status: 400 });
  }

  // Fetch the bundle with all related data
  const bundle = await db.bundle.findUnique({
    where: {
      id: bundleId,
      shopId: session.shop,
      bundleType: "full_page",
    },
    include: {
      steps: true,
      pricing: true,
    },
  });

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  return json({ bundle });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const { bundleId } = params;

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "update") {
    try {
      // Parse form data
      const bundleName = formData.get("bundleName") as string;
      const description = formData.get("description") as string;
      const status = formData.get("status") as string;
      const parentVisible = formData.get("parentVisible") === "true";
      const tabsData = JSON.parse(formData.get("tabs") as string);
      const discountEnabled = formData.get("discountEnabled") === "true";
      const discountMethod = formData.get("discountMethod") as string;
      const discountRules = JSON.parse(formData.get("discountRules") as string || "[]");
      const settings = JSON.parse(formData.get("settings") as string);

      // Fetch existing bundle
      const existingBundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
        include: { steps: true, pricing: true },
      });

      if (!existingBundle) {
        return json({ error: "Bundle not found" }, { status: 404 });
      }

      // Update parent product title and visibility
      if (existingBundle.shopifyProductId) {
        await updateBundleParentProduct(admin, existingBundle.shopifyProductId, {
          title: `EasyBundleId : ${existingBundle.templateName}`,
          visible: parentVisible,
          description: description || `Bundle: ${bundleName}`,
        });
      }

      // Update bundle in database
      await db.bundle.update({
        where: { id: bundleId },
        data: {
          name: bundleName,
          description: description || null,
          status: status as any,
          active: status === "active",
          settings: settings,
        },
      });

      // Delete existing steps
      await db.bundleStep.deleteMany({
        where: { bundleId: bundleId! },
      });

      // Create new tabs
      for (let i = 0; i < tabsData.length; i++) {
        const tab = tabsData[i];

        await db.bundleStep.create({
          data: {
            bundleId: bundleId!,
            name: tab.name,
            icon: tab.icon || "box",
            position: i,
            minQuantity: parseInt(tab.minQuantity) || 1,
            maxQuantity: parseInt(tab.maxQuantity) || 10,
            requireSelection: tab.requireSelection || false,
            allowMultiple: tab.allowMultiple !== false,
            displayVariantsAsIndividual: tab.displayVariantsAsIndividual || false,
            products: tab.products || [],
            enabled: true,
          },
        });
      }

      // Update pricing
      if (existingBundle.pricing) {
        await db.bundlePricing.update({
          where: { bundleId: bundleId! },
          data: {
            enableDiscount: discountEnabled,
            discountMethod: discountMethod as any,
            rules: discountRules,
          },
        });
      } else {
        await db.bundlePricing.create({
          data: {
            bundleId: bundleId!,
            enableDiscount: discountEnabled,
            discountMethod: discountMethod as any,
            rules: discountRules,
          },
        });
      }

      // Update metafield
      const completeBundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { steps: true, pricing: true },
      });

      if (completeBundle) {
        const bundleConfig = formatBundleForMetafield(completeBundle);
        await saveBundleToMetafield(admin, shop, completeBundle.templateName!, bundleConfig);
      }

      return json({ success: true, message: "Bundle updated successfully" });
    } catch (error) {
      console.error("Error updating bundle:", error);
      return json({
        error: error instanceof Error ? error.message : "Failed to update bundle"
      }, { status: 500 });
    }
  }

  if (actionType === "delete") {
    try {
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId, shopId: shop },
      });

      if (!bundle) {
        return json({ error: "Bundle not found" }, { status: 404 });
      }

      // Delete parent product
      if (bundle.shopifyProductId) {
        await deleteBundleParentProduct(admin, bundle.shopifyProductId);
      }

      // Delete metafield
      if (bundle.templateName) {
        await deleteBundleFromMetafield(admin, bundle.templateName);
      }

      // Delete bundle from database
      await db.bundle.delete({
        where: { id: bundleId },
      });

      return redirect("/app/bundles/full-page");
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({
        error: error instanceof Error ? error.message : "Failed to delete bundle"
      }, { status: 500 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function EditFullPageBundle() {
  const { bundle } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Initialize state from loaded bundle
  const [bundleName, setBundleName] = useState(bundle.name);
  const [description, setDescription] = useState(bundle.description || "");
  const [status, setStatus] = useState(bundle.status);
  const [parentVisible, setParentVisible] = useState(bundle.status === "active");

  // Initialize tabs from bundle steps
  const [tabs, setTabs] = useState(
    bundle.steps.map((step, index) => ({
      id: step.id,
      name: step.name,
      icon: step.icon || "box",
      products: step.products || [],
      minQuantity: step.minQuantity,
      maxQuantity: step.maxQuantity,
      requireSelection: step.requireSelection,
      allowMultiple: step.allowMultiple,
      displayVariantsAsIndividual: step.displayVariantsAsIndividual,
    }))
  );

  // Initialize discount settings
  const [discountEnabled, setDiscountEnabled] = useState(bundle.pricing?.enableDiscount || false);
  const [discountMethod, setDiscountMethod] = useState(bundle.pricing?.discountMethod || "fixed_amount_off");
  const [discountRules, setDiscountRules] = useState(
    bundle.pricing?.rules
      ? (typeof bundle.pricing.rules === "string"
        ? JSON.parse(bundle.pricing.rules)
        : bundle.pricing.rules)
      : [{ minItems: 1, value: 10 }]
  );

  // Initialize display settings
  const [settings, setSettings] = useState(
    bundle.settings
      ? (typeof bundle.settings === "string" ? JSON.parse(bundle.settings) : bundle.settings)
      : {
        layout: "sidebar-right",
        preview_sticky: true,
        button_text: "Add To Cart",
        success_message: "Success! Your ₹{discount} discount has been applied!",
        grid_columns: 3,
        enable_loading_animation: true,
      }
  );

  // Tab Handlers (same as create page)
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
    setDiscountRules([...discountRules, { minItems: 1, value: 10 }]);
  }, [discountRules]);

  const handleRemoveDiscountRule = useCallback((index: number) => {
    setDiscountRules(discountRules.filter((_, i) => i !== index));
  }, [discountRules]);

  const handleUpdateDiscountRule = useCallback((index: number, field: string, value: any) => {
    setDiscountRules(discountRules.map((rule, i) =>
      i === index ? { ...rule, [field]: value } : rule
    ));
  }, [discountRules]);

  // Product Selection Handler
  const handleSelectProducts = async (tabId: string) => {
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

  // Copy Bundle ID
  const handleCopyBundleId = () => {
    navigator.clipboard.writeText(bundle.templateName || "");
    alert(`Bundle ID "${bundle.templateName}" copied to clipboard!`);
  };

  // Delete Bundle
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${bundle.name}"? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append("actionType", "delete");

      const form = document.createElement("form");
      form.method = "post";
      form.appendChild(formData as any);
      form.requestSubmit();
    }
  };

  // Form Submit Handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("actionType", "update");
    formData.append("bundleName", bundleName);
    formData.append("description", description);
    formData.append("status", status);
    formData.append("parentVisible", String(parentVisible));
    formData.append("tabs", JSON.stringify(tabs));
    formData.append("discountEnabled", String(discountEnabled));
    formData.append("discountMethod", discountMethod);
    formData.append("discountRules", JSON.stringify(discountRules));
    formData.append("settings", JSON.stringify(settings));

    const form = e.target as HTMLFormElement;
    form.requestSubmit();
  }, [bundleName, description, status, parentVisible, tabs, discountEnabled, discountMethod, discountRules, settings]);

  return (
    <Page
      title={`Edit: ${bundle.name}`}
      backAction={{ onAction: () => navigate("/app/bundles/full-page") }}
      secondaryActions={[
        {
          content: "Delete Bundle",
          destructive: true,
          onAction: handleDelete,
        },
      ]}
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

          {actionData?.success && (
            <Layout.Section>
              <Banner tone="success">
                <p>{actionData.message}</p>
              </Banner>
            </Layout.Section>
          )}

          {/* Bundle ID Display */}
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Bundle ID
                </Text>
                <InlineStack gap="200" align="start">
                  <Badge tone="info">{bundle.templateName}</Badge>
                  <Button size="micro" onClick={handleCopyBundleId}>
                    Copy Bundle ID
                  </Button>
                </InlineStack>
                <Text tone="subdued" as="p" variant="bodySm">
                  Use this Bundle ID when adding the Full Page Bundle Builder block to your theme.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Rest of the form - same as create page */}
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
                <Checkbox
                  label="Make parent product visible in catalog"
                  checked={parentVisible}
                  onChange={setParentVisible}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Tab Configuration - same structure as create page */}
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
                          autoComplete="off"
                        />

                        <Select
                          label="Icon"
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
                            Products
                          </Text>
                          <div style={{ marginTop: "8px" }}>
                            <Button onClick={() => handleSelectProducts(tab.id)}>
                              {tab.products.length > 0
                                ? `${tab.products.length} products selected`
                                : "Select Products"}
                            </Button>
                          </div>
                        </div>

                        <Divider />

                        <Checkbox
                          label="Require selection from this tab"
                          checked={tab.requireSelection}
                          onChange={(value) => handleUpdateTab(tab.id, "requireSelection", value)}
                        />

                        <TextField
                          label="Minimum products"
                          type="number"
                          value={String(tab.minQuantity)}
                          onChange={(value) => handleUpdateTab(tab.id, "minQuantity", value)}
                          autoComplete="off"
                        />

                        <TextField
                          label="Maximum products"
                          type="number"
                          value={String(tab.maxQuantity)}
                          onChange={(value) => handleUpdateTab(tab.id, "maxQuantity", value)}
                          autoComplete="off"
                        />
                      </FormLayout>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Discount Configuration - same as create page */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Discount Settings
                </Text>

                <Checkbox
                  label="Enable discount"
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
                          Rules
                        </Text>
                        <Button size="micro" icon={PlusIcon} onClick={handleAddDiscountRule}>
                          Add Rule
                        </Button>
                      </InlineStack>

                      {discountRules.map((rule, index) => (
                        <InlineStack key={index} gap="200">
                          <TextField
                            label="Min Items"
                            type="number"
                            value={String(rule.minItems)}
                            onChange={(value) => handleUpdateDiscountRule(index, "minItems", parseInt(value) || 1)}
                            autoComplete="off"
                          />
                          <TextField
                            label="Discount"
                            type="number"
                            value={String(rule.value)}
                            onChange={(value) => handleUpdateDiscountRule(index, "value", parseFloat(value) || 0)}
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

          {/* Display Settings - same as create page */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Display Settings
                </Text>

                <FormLayout>
                  <Select
                    label="Layout"
                    options={[
                      { label: "Right Sidebar", value: "sidebar-right" },
                      { label: "Left Sidebar", value: "sidebar-left" },
                    ]}
                    value={settings.layout}
                    onChange={(value) => setSettings({ ...settings, layout: value })}
                  />

                  <TextField
                    label="Button Text"
                    value={settings.button_text}
                    onChange={(value) => setSettings({ ...settings, button_text: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Success Message"
                    value={settings.success_message}
                    onChange={(value) => setSettings({ ...settings, success_message: value })}
                    autoComplete="off"
                  />

                  <Select
                    label="Grid Columns"
                    options={[
                      { label: "2 Columns", value: "2" },
                      { label: "3 Columns", value: "3" },
                      { label: "4 Columns", value: "4" },
                    ]}
                    value={String(settings.grid_columns)}
                    onChange={(value) => setSettings({ ...settings, grid_columns: parseInt(value) })}
                  />
                </FormLayout>
              </BlockStack>
            </Card>
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
                Save Changes
              </Button>
            </InlineStack>
          </Layout.Section>
        </Layout>
      </form>
    </Page>
  );
}
