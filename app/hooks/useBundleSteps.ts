/**
 * useBundleSteps Hook
 *
 * Manages bundle steps state and operations including:
 * - Step CRUD operations (add, update, remove, duplicate)
 * - Step expansion/collapse
 * - Product/Collection selection
 * - Drag and drop reordering
 */

import { useState, useCallback } from "react";

interface BundleStep {
  id: string;
  name: string;
  collections?: any[];
  products?: any[];
  StepProduct?: any[];
  displayVariantsAsIndividual?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  enabled?: boolean;
  [key: string]: any;
}

interface UseBundleStepsProps {
  initialSteps: BundleStep[];
  shopify: any;
}

export function useBundleSteps({ initialSteps, shopify }: UseBundleStepsProps) {
  const [steps, setSteps] = useState<BundleStep[]>(initialSteps);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCollections, setSelectedCollections] = useState<Record<string, any[]>>(() => {
    const initial: Record<string, any[]> = {};
    initialSteps.forEach((step: any) => {
      if (step.collections && Array.isArray(step.collections)) {
        initial[step.id] = step.collections;
      }
    });
    return initial;
  });

  // Add a new step
  const addStep = useCallback(() => {
    const newStep: BundleStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      collections: [],
      products: [],
      StepProduct: [],
      displayVariantsAsIndividual: false
    };
    setSteps(prev => [...prev, newStep]);
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
    shopify.toast.show("Step added successfully", { isError: false });
  }, [steps.length, shopify]);

  // Update a step field
  const updateStepField = useCallback((stepId: string, field: string, value: any) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  }, []);

  // Remove a step
  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
    shopify.toast.show("Step removed", { isError: false });
  }, [shopify]);

  // Toggle step expansion
  const toggleStepExpansion = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(stepId)) {
        newExpanded.delete(stepId);
      } else {
        newExpanded.add(stepId);
      }
      return newExpanded;
    });
  }, []);

  // Duplicate a step
  const duplicateStep = useCallback((stepId: string) => {
    const stepToDuplicate = steps.find(s => s.id === stepId);
    if (stepToDuplicate) {
      const duplicatedStep: BundleStep = {
        ...stepToDuplicate,
        id: `step-${Date.now()}`,
        name: `${stepToDuplicate.name} (Copy)`,
      };
      setSteps(prev => [...prev, duplicatedStep]);
      setExpandedSteps(prev => new Set([...prev, duplicatedStep.id]));
      shopify.toast.show("Step duplicated successfully", { isError: false });
    }
  }, [steps, shopify]);

  // Collection selection handler
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
        setSelectedCollections(prev => ({
          ...prev,
          [stepId]: []
        }));
        shopify.toast.show("All collections removed", { isError: false });
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error :
        (error && typeof error === 'object' && 'message' in error) ? (error as { message: string }).message : '';

      const isCancellation = errorMessage?.toLowerCase().includes('cancel') ||
        errorMessage?.toLowerCase().includes('abort') ||
        errorMessage?.toLowerCase().includes('dismiss') ||
        errorMessage?.toLowerCase().includes('close') ||
        error === null || error === undefined;

      if (!isCancellation && errorMessage && errorMessage.trim() !== '') {
        shopify.toast.show("Failed to select collections", { isError: true });
      }
    }
  }, [selectedCollections, shopify]);

  // Get unique product count
  const getUniqueProductCount = useCallback((stepProducts: any[]) => {
    if (!stepProducts || stepProducts.length === 0) return 0;
    const uniqueProductIds = new Set(stepProducts.map((p) => p.id));
    return uniqueProductIds.size;
  }, []);

  // Reorder steps (for drag and drop)
  const reorderSteps = useCallback((fromIndex: number, toIndex: number) => {
    setSteps(prev => {
      const newSteps = [...prev];
      const [movedStep] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedStep);
      return newSteps;
    });
  }, []);

  return {
    // State
    steps,
    expandedSteps,
    selectedTab,
    selectedCollections,

    // Setters
    setSteps,
    setSelectedTab,
    setSelectedCollections,

    // Methods
    addStep,
    updateStepField,
    removeStep,
    toggleStepExpansion,
    duplicateStep,
    handleCollectionSelection,
    getUniqueProductCount,
    reorderSteps,
  };
}
