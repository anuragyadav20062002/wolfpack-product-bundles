/**
 * useBundleForm Hook
 *
 * Manages basic bundle form state including:
 * - Bundle name, description, status
 * - Template selection
 * - Active section navigation
 * - Save bar state
 */

import { useState } from "react";

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

  return {
    // State
    bundleName,
    bundleDescription,
    bundleStatus,
    templateName,
    activeSection,

    // Setters
    setBundleName,
    setBundleDescription,
    setBundleStatus,
    setTemplateName,
    setActiveSection,
  };
}
