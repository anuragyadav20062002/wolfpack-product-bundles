import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Frame,
  Toast,
} from "@shopify/polaris";
import { Modal, SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../../../shopify.server";
import { useCallback, useEffect, useRef } from "react";
import { prisma } from "../../../db.server";

// Import centralized state hook
import { useDesignControlPanelState } from "../../../hooks/useDesignControlPanelState";

// Import extracted components
import { SettingsPanel } from "../../../components/design-control-panel/settings";
import { PreviewPanel } from "../../../components/design-control-panel/preview";
import { NavigationSidebar } from "../../../components/design-control-panel/NavigationSidebar";
import { CustomCssCard } from "../../../components/design-control-panel/CustomCssCard";

// Import configuration
import { DEFAULT_SETTINGS, mergeSettings } from "../../../components/design-control-panel/config";

// Import action handler
import { handleSaveSettings } from "./handlers.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const productPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "product_page" } }
  });

  const fullPageSettings = await prisma.designSettings.findUnique({
    where: { shopId_bundleType: { shopId, bundleType: "full_page" } }
  });

  // Use imported default settings and merge function
  const settings = {
    product_page: mergeSettings(productPageSettings, DEFAULT_SETTINGS.product_page),
    full_page: mergeSettings(fullPageSettings, DEFAULT_SETTINGS.full_page),
  };

  return json({
    shopId,
    settings,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const shopId = session.shop;
    const formData = await request.json();

    return handleSaveSettings(shopId, formData);
  } catch (error) {
    console.error("Error saving design settings:", error);
    return json({ success: false, message: "Failed to save design settings" }, { status: 500 });
  }
}

export default function DesignControlPanel() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const shopify = useAppBridge();

  // Use centralized state hook for all design settings
  const dcpState = useDesignControlPanelState(settings);

  // Destructure all values and state management functions from the hook
  const {
    // Bundle type
    selectedBundleType,

    // All current settings values
    settings: currentSettings,

    // Navigation
    expandedSection,
    activeSubSection,
    toggleSection,
    handleSubSectionClick,

    // State management
    hasUnsavedChanges,
    handleDiscard,
    getSettingsForSave,
    markAsSaved,

    // Toast state
    toastActive,
    toastMessage,
    toastError,
    setToastActive,
    setToastMessage,
    setToastError,

    // Custom CSS help
    customCssHelpOpen,
    setCustomCssHelpOpen,

    // Update functions
    updateSetting,
    updateSettings,
  } = dcpState;

  // Extract only the values needed in this component
  const { customCss } = currentSettings;

  // Create setter for customCss
  const setCustomCss = (value: string) => updateSetting("customCss", value);

  // Ref for debouncing save bar visibility
  const saveBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether save bar is currently shown
  const saveBarVisibleRef = useRef(false);

  // Show/hide save bar based on unsaved changes with debouncing
  useEffect(() => {
    if (saveBarTimeoutRef.current) {
      clearTimeout(saveBarTimeoutRef.current);
      saveBarTimeoutRef.current = null;
    }

    if (hasUnsavedChanges) {
      if (!saveBarVisibleRef.current) {
        shopify.saveBar.show('dcp-save-bar');
        saveBarVisibleRef.current = true;
      }
    } else {
      saveBarTimeoutRef.current = setTimeout(() => {
        if (!hasUnsavedChanges && saveBarVisibleRef.current) {
          shopify.saveBar.hide('dcp-save-bar');
          saveBarVisibleRef.current = false;
        }
      }, 100);
    }

    return () => {
      if (saveBarTimeoutRef.current) {
        clearTimeout(saveBarTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, shopify]);

  // Modal handlers
  const handleOpenModal = useCallback(() => {
    shopify.modal.show('dcp-customization-modal');
  }, [shopify]);

  // Handle action data (form submission response)
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  useEffect(() => {
    if (actionData) {
      setToastActive(true);
      setToastMessage(actionData.message);
      setToastError(!actionData.success);

      if (actionData.success) {
        shopify.saveBar.hide('dcp-save-bar');
        saveBarVisibleRef.current = false;
        markAsSaved();
      }
    }
  }, [actionData, shopify, markAsSaved, setToastActive, setToastMessage, setToastError]);

  // Save settings using hook's getSettingsForSave
  const handleSaveSettingsClick = useCallback(() => {
    const settingsToSave = getSettingsForSave();

    submit(
      {
        bundleType: selectedBundleType,
        settings: settingsToSave,
      },
      {
        method: "post",
        encType: "application/json",
      }
    );
  }, [selectedBundleType, getSettingsForSave, submit]);

  return (
    <Frame>
      <Page
        title="Design Control Panel"
        subtitle="Customize the appearance of your bundles"
        backAction={{
          content: "Go to Bundles",
          url: "/app/dashboard",
        }}
        primaryAction={{
          content: "Open Customisations",
          onAction: handleOpenModal,
        }}
      >
        {/* App Bridge Modal with max variant for full-screen */}
        <Modal id="dcp-customization-modal" variant="max">
          <div style={{ display: "flex", height: "100vh", maxWidth: "100%", overflowX: "hidden" }}>
            {/* Left Sidebar - Navigation */}
            <NavigationSidebar
              expandedSection={expandedSection}
              activeSubSection={activeSubSection}
              onToggleSection={toggleSection}
              onSubSectionClick={handleSubSectionClick}
            />

            {/* Right Side - Visual Preview + Settings */}
            <div style={{ flex: 1, display: "flex", overflowY: "auto", minWidth: 0 }}>
              {/* Center - Visual Preview */}
              <div
                style={{
                  flex: 1,
                  padding: "20px",
                  backgroundColor: "#F4F4F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 0,
                  overflowX: "hidden",
                }}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <PreviewPanel activeSubSection={activeSubSection} settings={currentSettings} />
                </div>
              </div>

              {/* Right Panel - Settings Controls */}
              <div
                style={{
                  width: "240px",
                  minWidth: "240px",
                  borderLeft: "1px solid #D9D9D9",
                  padding: "20px",
                  backgroundColor: "#FFFFFF",
                  overflowY: "auto",
                }}
              >
                <SettingsPanel
                  activeSubSection={activeSubSection}
                  settings={currentSettings}
                  onUpdate={updateSetting}
                  onBatchUpdate={updateSettings}
                  customCssHelpOpen={customCssHelpOpen}
                  setCustomCssHelpOpen={setCustomCssHelpOpen}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* Custom CSS Section - Outside Modal for Power Users */}
        <CustomCssCard
          customCss={customCss}
          onCustomCssChange={setCustomCss}
          customCssHelpOpen={customCssHelpOpen}
          onToggleHelp={() => setCustomCssHelpOpen(!customCssHelpOpen)}
          onSave={handleSaveSettingsClick}
          isLoading={isLoading}
        />

        {/* App Bridge Save Bar */}
        <SaveBar id="dcp-save-bar">
          <button
            variant="primary"
            onClick={handleSaveSettingsClick}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDiscard}
            disabled={isLoading}
          >
            Discard
          </button>
        </SaveBar>
      </Page>
      {toastActive && (
        <Toast
          content={toastMessage}
          onDismiss={() => setToastActive(false)}
          error={toastError}
        />
      )}
    </Frame>
  );
}
