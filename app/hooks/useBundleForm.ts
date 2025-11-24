/**
 * useBundleForm Hook
 *
 * Manages basic bundle form state including:
 * - Bundle name, description, status
 * - Template selection
 * - Active section navigation
 * - Save bar state
 */

import { useState, useCallback, useEffect } from "react";

interface BundleFormData {
  name: string;
  description: string;
  status: string;
  templateName: string;
}

interface UseBundleFormProps {
  initialData: BundleFormData;
}

export function useBundleForm({ initialData }: UseBundleFormProps) {
  // Basic form state
  const [bundleName, setBundleName] = useState(initialData.name);
  const [bundleDescription, setBundleDescription] = useState(initialData.description);
  const [bundleStatus, setBundleStatus] = useState(initialData.status);
  const [templateName, setTemplateName] = useState(initialData.templateName);

  // UI state
  const [activeSection, setActiveSection] = useState("step_setup");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track section-level changes
  const [sectionChanges, setSectionChanges] = useState<Record<string, boolean>>({
    step_setup: false,
    discount: false,
    bundle_product: false,
    theme_integration: false
  });

  // Store original values for change detection
  const [originalValues] = useState({
    bundleName: initialData.name,
    bundleDescription: initialData.description,
    bundleStatus: initialData.status,
    templateName: initialData.templateName
  });

  // Trigger save bar visibility
  const triggerSaveBar = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Dismiss save bar
  const dismissSaveBar = useCallback(() => {
    setHasUnsavedChanges(false);
    setSectionChanges({
      step_setup: false,
      discount: false,
      bundle_product: false,
      theme_integration: false
    });
  }, []);

  // Mark a section as changed
  const markSectionChanged = useCallback((section: string) => {
    setSectionChanges(prev => ({ ...prev, [section]: true }));
    triggerSaveBar();
  }, [triggerSaveBar]);

  // Check if form has unsaved changes
  const hasFormChanges = useCallback((): boolean => {
    return (
      bundleName !== originalValues.bundleName ||
      bundleDescription !== originalValues.bundleDescription ||
      bundleStatus !== originalValues.bundleStatus ||
      templateName !== originalValues.templateName
    );
  }, [bundleName, bundleDescription, bundleStatus, templateName, originalValues]);

  // Get current value for a specific field
  const getCurrentValueForField = useCallback((fieldName: string): string => {
    switch (fieldName) {
      case 'bundleName':
        return bundleName;
      case 'bundleDescription':
        return bundleDescription;
      case 'bundleStatus':
        return bundleStatus;
      case 'templateName':
        return templateName;
      default:
        return '';
    }
  }, [bundleName, bundleDescription, bundleStatus, templateName]);

  // Auto-detect changes and trigger save bar
  useEffect(() => {
    const hasChanges = (
      bundleName !== originalValues.bundleName ||
      bundleDescription !== originalValues.bundleDescription ||
      bundleStatus !== originalValues.bundleStatus ||
      templateName !== originalValues.templateName
    );

    if (hasChanges) {
      setHasUnsavedChanges(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleName, bundleDescription, bundleStatus, templateName]);

  return {
    // State
    bundleName,
    bundleDescription,
    bundleStatus,
    templateName,
    activeSection,
    hasUnsavedChanges,
    sectionChanges,

    // Setters
    setBundleName,
    setBundleDescription,
    setBundleStatus,
    setTemplateName,
    setActiveSection,

    // Methods
    triggerSaveBar,
    dismissSaveBar,
    markSectionChanged,
    hasFormChanges,
    getCurrentValueForField,
  };
}
