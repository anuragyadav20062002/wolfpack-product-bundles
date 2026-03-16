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
import type { BundleStatus } from "../constants/bundle";
import { slugify } from "../lib/slug-utils";

interface BundleFormData {
  name: string;
  description: string;
  status: BundleStatus;
  templateName: string;
  fullPageLayout: string;
  pageSlug: string;
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

  // Slug state — pre-filled from stored handle or slugified name
  const [pageSlug, setPageSlugRaw] = useState(initialData.pageSlug || slugify(initialData.name));
  // True if merchant has manually edited the slug (or if stored handle differs from auto-generated)
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(
    !!initialData.pageSlug && initialData.pageSlug !== slugify(initialData.name)
  );

  // UI state (doesn't trigger dirty flag)
  const [activeSection, setActiveSection] = useState("step_setup");

  // Wrapped setters that trigger dirty flag
  const setBundleName = useCallback((value: string | ((prev: string) => string)) => {
    setBundleNameRaw(value);
    onStateChange?.();
  }, [onStateChange]);

  // Auto-update slug from bundle name unless merchant has manually edited it
  useEffect(() => {
    if (!hasManuallyEditedSlug) {
      const auto = slugify(typeof bundleName === 'string' ? bundleName : '');
      setPageSlugRaw(auto);
    }
  }, [bundleName, hasManuallyEditedSlug]);

  const setPageSlug = useCallback((value: string) => {
    setPageSlugRaw(value);
    setHasManuallyEditedSlug(true);
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
    pageSlug,
    hasManuallyEditedSlug,
    activeSection,

    // Setters
    setBundleName,
    setBundleDescription,
    setBundleStatus,
    setTemplateName,
    setFullPageLayout,
    setPageSlug,
    setActiveSection,
  };
}
