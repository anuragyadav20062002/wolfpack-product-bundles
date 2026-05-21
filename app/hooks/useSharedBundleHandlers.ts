/**
 * Shared client-side handler callbacks for FPB and PPB bundle configure pages.
 *
 * Both routes had identical implementations of 18 handler callbacks. This hook
 * extracts them so each route only needs to supply its local state as parameters.
 *
 * NOTE: navigateToStep is the only handler with a behavioral difference:
 * FPB additionally calls setShowIconPickerForStep(null) on navigation. Pass
 * that setter as the optional `setShowIconPickerForStep` param to enable it.
 */

import { useState, useCallback } from "react";
import { AppLogger } from "../lib/logger";
import { ERROR_MESSAGES } from "../constants/errors";

export interface SharedBundleHandlersParams {
  // From useBundleConfigurationState
  stepsState: {
    steps: any[];
    setSteps: (fn: any) => void;
    removeStep: (id: string) => void;
    updateStepField: (stepId: string, field: string, value: any) => void;
  };
  formState: { templateName: string };
  selectedCollections: Record<string, any[]>;
  setSelectedCollections: (fn: (prev: Record<string, any[]>) => Record<string, any[]>) => void;
  setRuleMessages: (fn: (prev: any) => any) => void;
  setBundleProduct: (v: any) => void;
  setProductTitle: (v: string) => void;
  setProductImageUrl: (v: string) => void;
  markAsDirty: () => void;
  activeTabIndex: number;
  setActiveTabIndex: (v: number) => void;

  // External objects
  shopify: any;
  fetcher: { submit: (data: FormData, options: { method: string }) => void };

  // Local state setters from the route (not in useBundleConfigurationState)
  setIsSyncModalOpen: (v: boolean) => void;
  setSlideDir: (v: string) => void;
  setSlideKey: (fn: (prev: number) => number) => void;

  // FPB-only: close the icon picker when navigating between steps
  setShowIconPickerForStep?: ((v: string | null) => void) | null;
}

export function useSharedBundleHandlers(params: SharedBundleHandlersParams) {
  const {
    stepsState,
    formState,
    selectedCollections,
    setSelectedCollections,
    setRuleMessages,
    setBundleProduct,
    setProductTitle,
    setProductImageUrl,
    markAsDirty,
    activeTabIndex,
    setActiveTabIndex,
    shopify,
    fetcher,
    setIsSyncModalOpen,
    setSlideDir,
    setSlideKey,
    setShowIconPickerForStep,
  } = params;

  // ── Drag-and-drop state (owned by this hook, returned to the route) ──────────
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedCatKey, setDraggedCatKey] = useState<string | null>(null);
  const [dragOverCatKey, setDragOverCatKey] = useState<string | null>(null);

  // ── Template list enhancement ────────────────────────────────────────────────
  const enhanceTemplateListWithUserSelection = useCallback((templates: any[]) => {
    if (!formState.templateName || formState.templateName.trim() === '') {
      return templates;
    }

    const userTemplateHandle = formState.templateName.startsWith('product.') ? formState.templateName : `product.${formState.templateName}`;

    const templateExists = templates.some(t => t.handle === userTemplateHandle || t.handle === formState.templateName);

    if (!templateExists) {
      const userTemplate = {
        id: userTemplateHandle,
        title: `🎯 ${formState.templateName} (Your Selection)`,
        handle: userTemplateHandle,
        description: `Custom template "${formState.templateName}" - your selected bundle container template`,
        recommended: true,
        bundleRelevant: true,
        fileType: 'User Selected',
        fullKey: `templates/${userTemplateHandle}.liquid`,
        isBundleContainer: true,
        isUserSelected: true
      };

      return [userTemplate, ...templates];
    }

    return templates.map(t => {
      if (t.handle === userTemplateHandle || t.handle === formState.templateName) {
        return {
          ...t,
          title: `🎯 ${t.title} (Your Selection)`,
          recommended: true,
          isUserSelected: true
        };
      }
      return t;
    });
  }, [formState.templateName]);

  // ── Product selection ────────────────────────────────────────────────────────
  const handleProductSelection = useCallback(async (stepId: string) => {
    try {
      const step = stepsState.steps.find(s => s.id === stepId);
      const currentProducts = step?.StepProduct || [];

      // Build selectionIds from StepProduct
      // When loaded from DB: use productId field
      // When from resource picker: use id field
      // If variants exist and are selected, include them in the format needed by resource picker
      const selectionIds = currentProducts.map((p: any) => {
        const productGid = p.productId || p.id; // productId from DB, id from picker

        // Check if this product has specific variants selected
        // If variants array exists and has items, include them in selectionIds
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const variantIds = p.variants.map((v: any) => ({ id: v.id }));
          return {
            id: productGid,
            variants: variantIds
          };
        }

        return { id: productGid };
      });



      const products = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectionIds,
      });


      if (products && products.selection) {

        // Transform products to include imageUrl from images array
        const transformedProducts = products.selection.map((product: any) => {
          const imageUrl = product.images?.[0]?.originalSrc || product.images?.[0]?.url || product.image?.url || null;
          return {
            ...product,
            imageUrl: imageUrl
          };
        });


        // Update the step with selected products (this replaces the entire selection)
        // Deselected products will not be in the selection array, so they're automatically removed
        stepsState.setSteps(stepsState.steps.map(step =>
          step.id === stepId
            ? { ...step, StepProduct: transformedProducts }
            : step
        ) as any);

        const addedCount = transformedProducts.length - currentProducts.length;
        const message = addedCount > 0
          ? `Added ${addedCount} product${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} product${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : transformedProducts.length === 0
              ? "All products removed"
              : "Products updated successfully!";

        shopify.toast.show(message);
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_PRODUCTS, { isError: true, duration: 5000 });
      }
    }
  }, [stepsState.steps, stepsState.setSteps, shopify]);

  // ── Sync product ─────────────────────────────────────────────────────────────
  const handleSyncProduct = useCallback(() => {
    try {

      // Show loading toast
      shopify.toast.show("Syncing bundle product with Shopify...", { isError: false });

      // Prepare form data for sync operation
      const formData = new FormData();
      formData.append("intent", "syncProduct");

      // Submit to server action using fetcher
      fetcher.submit(formData, { method: "post" });

      // Response will be handled by the existing useEffect
    } catch (error) {
      AppLogger.error("Product sync failed:", {}, error as any);
      shopify.toast.show((error as Error).message || ERROR_MESSAGES.FAILED_TO_SYNC_PRODUCT, { isError: true, duration: 5000 });
    }
  }, [fetcher, shopify]);

  // ── Sync bundle confirm ──────────────────────────────────────────────────────
  const handleSyncBundleConfirm = useCallback(() => {
    setIsSyncModalOpen(false);
    const formData = new FormData();
    formData.append("intent", "syncBundle");
    fetcher.submit(formData, { method: "post" });
  }, [fetcher]);

  // ── Bundle product select ────────────────────────────────────────────────────
  const handleBundleProductSelect = useCallback(async () => {
    try {
      const products = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (products && products.length > 0) {
        const selectedProduct = products[0] as any;
        setBundleProduct(selectedProduct);
        setProductTitle(selectedProduct.title || "");
        setProductImageUrl(selectedProduct.featuredImage?.url || selectedProduct.images?.[0]?.originalSrc || "");

        shopify.toast.show("Bundle product updated successfully", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_BUNDLE_PRODUCT, { isError: true, duration: 5000 });
      }
    }
  }, [shopify]);

  // ── Step management ──────────────────────────────────────────────────────────
  // Step management handlers
  const cloneStep = useCallback((stepId: string) => {
    const stepToClone = stepsState.steps.find(step => step.id === stepId);
    if (stepToClone) {
      const newStep = {
        ...stepToClone,
        id: `step-${Date.now()}`,
        name: `${stepToClone.name} (Copy)`,
        StepProduct: stepToClone.StepProduct || []
      };
      stepsState.setSteps(prev => {
        const stepIndex = prev.findIndex(step => step.id === stepId);
        const newSteps = [...prev];
        newSteps.splice(stepIndex + 1, 0, newStep);
        return newSteps;
      });
      shopify.toast.show("Step cloned successfully", { isError: false });
    }
  }, [stepsState.steps, stepsState.setSteps, shopify]);

  const deleteStep = useCallback((stepId: string) => {
    if (stepsState.steps.length <= 1) {
      shopify.toast.show(ERROR_MESSAGES.CANNOT_DELETE_LAST_STEP, { isError: true, duration: 5000 });
      return;
    }

    // Use hook's removeStep which handles expandedSteps cleanup and dirty flag
    stepsState.removeStep(stepId);
  }, [stepsState]);

  // Navigate between steps with slide animation
  const navigateToStep = useCallback((idx: number) => {
    if (idx === activeTabIndex) return;
    setSlideDir(idx > activeTabIndex ? "forward" : "backward");
    setSlideKey(prev => prev + 1);
    setActiveTabIndex(idx);
    setShowIconPickerForStep?.(null); // FPB-only: close icon picker on navigation
  }, [activeTabIndex, setActiveTabIndex]);

  // ── Step drag-and-drop ───────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, stepId: string, _index: number) => {
    setDraggedStep(stepId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", stepId);

    // Add visual feedback by setting drag image
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedStep(null);
    setDragOverIndex(null);

    // Reset visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedStep) return;

    const dragIndex = stepsState.steps.findIndex(step => step.id === draggedStep);

    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      stepsState.setSteps(prev => {
        const newSteps = [...prev];
        const draggedStepData = newSteps[dragIndex];
        newSteps.splice(dragIndex, 1);
        newSteps.splice(dropIndex, 0, draggedStepData);
        return newSteps;
      });

      shopify.toast.show("Step reordered successfully", { isError: false });
    }

    setDraggedStep(null);
    setDragOverIndex(null);
  }, [draggedStep, stepsState.steps, stepsState.setSteps, shopify]);

  // ── Category drag-and-drop ───────────────────────────────────────────────────
  const handleCatDragStart = useCallback((e: React.DragEvent, stepId: string, catKey: string) => {
    setDraggedCatKey(catKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", catKey);
    const accordion = (e.currentTarget as HTMLElement).closest('[data-cat-key]') as HTMLElement | null;
    if (accordion) accordion.style.opacity = "0.5";
  }, []);

  const handleCatDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedCatKey(null);
    setDragOverCatKey(null);
    const accordion = (e.currentTarget as HTMLElement).closest('[data-cat-key]') as HTMLElement | null;
    if (accordion) accordion.style.opacity = "1";
  }, []);

  const handleCatDrop = useCallback((e: React.DragEvent, stepId: string, dropCatKey: string) => {
    e.preventDefault();
    const srcKey = draggedCatKey;
    setDraggedCatKey(null);
    setDragOverCatKey(null);
    if (!srcKey || srcKey === dropCatKey) return;
    const targetStep = stepsState.steps.find((s: any) => s.id === stepId);
    if (!targetStep) return;
    const cats = ((targetStep as any).StepCategory as any[]) ?? [];
    const srcIdx = cats.findIndex((_: any, i: number) => `${stepId}__${cats[i].id ?? i}` === srcKey);
    const dstIdx = cats.findIndex((_: any, i: number) => `${stepId}__${cats[i].id ?? i}` === dropCatKey);
    if (srcIdx === -1 || dstIdx === -1 || srcIdx === dstIdx) return;
    const reordered = [...cats];
    const [moved] = reordered.splice(srcIdx, 1);
    reordered.splice(dstIdx, 0, moved);
    stepsState.updateStepField(stepId, "StepCategory", reordered.map((c: any, i: number) => ({ ...c, sortOrder: i })));
    markAsDirty();
  }, [draggedCatKey, stepsState, markAsDirty]);

  // ── Collection management ────────────────────────────────────────────────────
  const handleCollectionSelection = useCallback(async (stepId: string) => {
    try {
      const currentCollections = selectedCollections[stepId] || [];

      const collections = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
        selectionIds: currentCollections.map((c: any) => ({ id: c.id })),
      });

      if (collections && collections.length > 0) {

        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: collections as any
        }));

        const addedCount = collections.length - currentCollections.length;
        const message = addedCount > 0
          ? `Added ${addedCount} collection${addedCount !== 1 ? 's' : ''}!`
          : addedCount < 0
            ? `Removed ${Math.abs(addedCount)} collection${Math.abs(addedCount) !== 1 ? 's' : ''}!`
            : "Collections updated successfully!";

        shopify.toast.show(message, { isError: false });
      } else if (collections && collections.length === 0) {
        // User deselected all collections
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: []
        }));
        shopify.toast.show("All collections removed", { isError: false });
      }
    } catch (error) {
      // Resource picker throws an error when user cancels - this is expected behavior
      // Enhanced error detection to catch more cancellation patterns
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      // Only show error toast for actual errors, not user cancellations
      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show(ERROR_MESSAGES.FAILED_TO_SELECT_COLLECTIONS, { isError: true, duration: 5000 });
      }
    }
  }, [shopify, selectedCollections]);

  // ── Rule messages ────────────────────────────────────────────────────────────
  const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
    setRuleMessages(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }));
  }, []);

  return {
    // Drag-and-drop state (routes need these for rendering)
    draggedStep,
    dragOverIndex,
    draggedCatKey,
    dragOverCatKey,
    setDragOverCatKey,

    // Handlers
    enhanceTemplateListWithUserSelection,
    handleProductSelection,
    handleSyncProduct,
    handleSyncBundleConfirm,
    handleBundleProductSelect,
    cloneStep,
    deleteStep,
    navigateToStep,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCatDragStart,
    handleCatDragEnd,
    handleCatDrop,
    handleCollectionSelection,
    updateRuleMessage,
  };
}
