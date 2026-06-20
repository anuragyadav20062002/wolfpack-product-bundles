import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Form, Outlet, useActionData, useFetcher, useLoaderData, useLocation, useNavigate, useNavigation } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  DataTable,
  EmptyState,
  FormLayout,
  Icon,
  InlineStack,
  Layout,
  Modal,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { CheckCircleIcon, DeleteIcon, DuplicateIcon, EditIcon, PlusIcon } from "@shopify/polaris-icons";
import { BundleSetupInstructions } from "../../../components/BundleSetupInstructions";
import { BundleStatus } from "../../../constants/bundle";
import { useCartTransformState } from "../../../hooks/useCartTransformState";
import cartTransformStyles from "../../../styles/routes/cart-transform.module.css";
import type { action } from "../app.bundles.cart-transform/action.server";
import type { loader } from "../app.bundles.cart-transform";
import { formatCartTransformDate } from "./date-format";

export function CartTransformBundles() {
  const { bundles } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const fetcher = useFetcher();
  const isNestedRoute = location.pathname.includes("/configure/");
  const cartTransformState = useCartTransformState();
  const {
    modalOpen,
    openModal,
    closeModal,
    bundleName,
    setBundleName,
    description,
    setDescription,
  } = cartTransformState;

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success && "redirectTo" in actionData && actionData.redirectTo) {
      closeModal();
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate, closeModal]);

  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success && "message" in actionData && actionData.message) {
      // Success responses for clone/delete are intentionally handled without extra UI here.
    }
  }, [actionData]);

  const handleCreateBundle = useCallback(() => {
    openModal();
  }, [openModal]);

  const handleCloseModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleSubmit = useCallback(() => {
    submitButtonRef.current?.click();
  }, []);

  const handleEditBundle = (bundleId: string) => {
    navigate(`/app/bundles/cart-transform/configure/${bundleId}`);
  };

  const handleCloneBundle = useCallback((bundleId: string) => {
    if (confirm("Are you sure you want to clone this bundle?")) {
      const formData = new FormData();
      formData.append("intent", "cloneBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const handleDeleteBundle = useCallback((bundleId: string) => {
    if (confirm("⚠️ PERMANENTLY DELETE this bundle?\n\nThis action CANNOT be undone!\n\nThis will delete:\n• Bundle configuration & all steps\n• All discount rules\n• Component associations\n\nThis will NOT delete:\n• The Shopify product (delete manually if needed)\n• Analytics data")) {
      const formData = new FormData();
      formData.append("intent", "deleteBundle");
      formData.append("bundleId", bundleId);
      fetcher.submit(formData, { method: "post" });
    }
  }, [fetcher]);

  const bundleRows = bundles.map((bundle) => [
    bundle.name,
    <Badge tone={bundle.status === BundleStatus.ACTIVE ? "success" : "info"} key={`status-${bundle.id}`}>
      {bundle.status}
    </Badge>,
    bundle.steps.length,
    bundle.pricing?.enabled ? "Enabled" : "Disabled",
    formatCartTransformDate(bundle.createdAt),
    <ButtonGroup key={`actions-${bundle.id}`}>
      <Button size="micro" icon={EditIcon} onClick={() => handleEditBundle(bundle.id)} accessibilityLabel={`Edit ${bundle.name}`}>
        Edit
      </Button>
      <Button size="micro" icon={DuplicateIcon} onClick={() => handleCloneBundle(bundle.id)} accessibilityLabel={`Clone ${bundle.name}`}>
        Clone
      </Button>
      <Button size="micro" tone="critical" icon={DeleteIcon} onClick={() => handleDeleteBundle(bundle.id)} accessibilityLabel={`Delete ${bundle.name}`}>
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  if (isNestedRoute) {
    return <Outlet />;
  }

  return (
    <>
      <CreateBundleModal
        actionData={actionData}
        bundleName={bundleName}
        description={description}
        isSubmitting={isSubmitting}
        modalOpen={modalOpen}
        setBundleName={setBundleName}
        setDescription={setDescription}
        submitButtonRef={submitButtonRef}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <Page
        title="Cart Transform Bundles"
        subtitle="Manage bundles that use real-time cart transformation"
        primaryAction={{
          content: "Create Cart Transform Bundle",
          icon: PlusIcon,
          onAction: handleCreateBundle,
        }}
        secondaryActions={[
          {
            content: "Back to Dashboard",
            onAction: () => navigate("/app/dashboard"),
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="space-between">
                  <Text variant="headingSm" as="h3">
                    Active Cart Transform Bundles
                  </Text>
                  <Badge tone="info">Cart Transform Mode</Badge>
                </InlineStack>

                {bundles.length === 0 ? (
                  <EmptyState
                    heading="Create your first cart transform bundle"
                    action={{
                      content: "Create Cart Transform Bundle",
                      onAction: handleCreateBundle,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Cart transform bundles provide real-time cart updates and merge bundle items into a single cart line with automatic pricing.
                    </Text>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={["text", "text", "numeric", "text", "text", "text"]}
                    headings={["Bundle Name", "Status", "Steps", "Discount", "Created", "Actions"]}
                    rows={bundleRows}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <CartTransformInfo
              bundlesExist={bundles.length > 0}
              firstBundleId={bundles[0]?.id}
              navigate={navigate}
              onCreateBundle={handleCreateBundle}
            />
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}

type CreateBundleModalProps = {
  actionData: ReturnType<typeof useActionData<typeof action>>;
  bundleName: string;
  description: string;
  isSubmitting: boolean;
  modalOpen: boolean;
  setBundleName: (value: string) => void;
  setDescription: (value: string) => void;
  submitButtonRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onSubmit: () => void;
};

function CreateBundleModal({
  actionData,
  bundleName,
  description,
  isSubmitting,
  modalOpen,
  setBundleName,
  setDescription,
  submitButtonRef,
  onClose,
  onSubmit,
}: CreateBundleModalProps) {
  return (
    <Modal
      open={modalOpen}
      onClose={onClose}
      title="Create Cart Transform Bundle"
      primaryAction={{
        content: "Create Bundle",
        onAction: onSubmit,
        loading: isSubmitting,
        disabled: !bundleName.trim(),
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <Form method="post">
          <FormLayout>
            <TextField
              label="Bundle name"
              value={bundleName}
              onChange={setBundleName}
              name="bundleName"
              autoComplete="off"
              error={actionData && "error" in actionData ? actionData.error : undefined}
              helpText="Choose a descriptive name for your bundle"
              requiredIndicator
            />
            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
              name="description"
              multiline={3}
              autoComplete="off"
              helpText="Optional: Add more details about what this bundle offers"
            />
            <button
              ref={submitButtonRef}
              type="submit"
              className={cartTransformStyles.hiddenSubmit}
              aria-hidden="true"
            />
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
}

type CartTransformInfoProps = {
  bundlesExist: boolean;
  firstBundleId?: string;
  navigate: (path: string) => void;
  onCreateBundle: () => void;
};

function CartTransformInfo({ bundlesExist, firstBundleId, navigate, onCreateBundle }: CartTransformInfoProps) {
  const configureFirstBundle = () => {
    if (bundlesExist && firstBundleId) {
      navigate(`/app/bundles/cart-transform/configure/${firstBundleId}`);
    }
  };

  return (
    <InlineStack gap="400" align="start" blockAlign="start">
      <div className={cartTransformStyles.flexContainer}>
        <BundleSetupInstructions
          title="Cart Transform Bundle Setup"
          subtitle="Follow these steps to create your cart transform bundle"
          bundlesExist={bundlesExist}
          steps={[
            { id: "create_bundle", title: "Click \"Create Cart Transform Bundle\"", description: "Click the \"Create\" button to start making your bundle.", isClickable: true, onClick: onCreateBundle },
            { id: "name_description", title: "Enter bundle name and description", description: "Type a clear name and an optional description for your bundle.", onClick: () => {} },
            { id: "create_bundle_modal", title: "Click \"Create Bundle\" in the popup", description: "This will create your bundle and take you to the setup page.", onClick: () => {} },
            { id: "add_steps", title: "Add bundle steps and choose products", description: "Add steps to your bundle, select products/collections you want.", isClickable: bundlesExist, onClick: configureFirstBundle },
            { id: "setup_pricing", title: "Set discount rules and pricing", description: "Choose how discounts and pricing should work for your bundle.", isClickable: bundlesExist, onClick: configureFirstBundle },
            { id: "publish", title: "Save and publish your bundle", description: "Save your settings to make your bundle live on your store.", isClickable: bundlesExist, onClick: configureFirstBundle },
          ]}
        />
      </div>

      <div className={cartTransformStyles.flexContainer}>
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text variant="headingSm" fontWeight="semibold" as="h4">
                How Cart Transform works
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Creates a parent bundle in your Shopify catalog while pulling real-time stock from your existing component products at checkout — no duplicate inventory tracking needed.
              </Text>
            </BlockStack>
            <BlockStack gap="200">
              {[
                "One parent bundle product in your Shopify catalog",
                "Stock pulled from component products at checkout",
                "No duplicate inventory tracking required",
                "Discounts applied automatically at cart level",
                "Cart transform merges components into the bundle",
              ].map((feature) => (
                <InlineStack key={feature} gap="200" blockAlign="center">
                  <Box>
                    <Icon source={CheckCircleIcon} tone="success" />
                  </Box>
                  <Text variant="bodySm" as="span">{feature}</Text>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </div>
    </InlineStack>
  );
}
