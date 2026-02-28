/**
 * useBundleForm Hook
 *
 * Manages basic bundle form state including:
 * - Bundle name, description, status
 * - Template selection
 * - Active section navigation
 * - Save bar state
 */

import { useState, useCallback } from "react";
import type { BundleStatus } from "../constants/bundle";

interface BundleFormData {
  name: string;
  description: string;
  status: BundleStatus;
  templateName: string;
  fullPageLayout: string;
}

interface UseBundleFormProps {
  initialData: BundleFormData;
  onStateChange?: () => void;
}

export function useBundleForm({ initialData, onStateChange }: UseBundleFormProps) {
  // Basic form state
  const [bundleName, setBundleNameRaw] = useState(initialData.name);
  const [bundleDescription, setBundleDescriptionRaw] = useState(initialData.description);
  const [bundleStatus, setBundleStatusRaw] = useState<BundleStatus>(initialData.status);
  const [templateName, setTemplateNameRaw] = useState(initialData.templateName);
  const [fullPageLayout, setFullPageLayoutRaw] = useState(initialData.fullPageLayout);

  // UI state (doesn't trigger dirty flag)
  const [activeSection, setActiveSection] = useState("step_setup");

  // Wrapped setters that trigger dirty flag
  const setBundleName = useCallback((value: string | ((prev: string) => string)) => {
    setBundleNameRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setBundleDescription = useCallback((value: string | ((prev: string) => string)) => {
    setBundleDescriptionRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setBundleStatus = useCallback((value: BundleStatus | ((prev: BundleStatus) => BundleStatus)) => {
    setBundleStatusRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setTemplateName = useCallback((value: string | ((prev: string) => string)) => {
    setTemplateNameRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  const setFullPageLayout = useCallback((value: string | ((prev: string) => string)) => {
    setFullPageLayoutRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  return {
    // State
    bundleName,
    bundleDescription,
    bundleStatus,
    templateName,
    fullPageLayout,
    activeSection,

    // Setters
    setBundleName,
    setBundleDescription,
    setBundleStatus,
    setTemplateName,
    setFullPageLayout,
    setActiveSection,
  };
}
