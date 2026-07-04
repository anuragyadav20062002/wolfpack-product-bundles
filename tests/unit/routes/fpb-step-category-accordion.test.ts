import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FpbStepCategoryAccordion } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/StepSetupCategoryAccordion";

function makeFlow(overrides: Record<string, unknown> = {}) {
  return {
    categoryActiveTabs: {},
    categoryOpen: { "step-1__cat-1": true },
    draggedCatKey: null,
    dragOverCatKey: null,
    fullPageBundleStyles: {},
    handleCatDragEnd: jest.fn(),
    handleCatDragStart: jest.fn(),
    handleCatDrop: jest.fn(),
    markAsDirty: jest.fn(),
    openStepCategoryMultiLanguageModal: jest.fn(),
    setCategoryActiveTabs: jest.fn(),
    setCategoryOpen: jest.fn(),
    setDragOverCatKey: jest.fn(),
    showPolarisModal: jest.fn(),
    hidePolarisModal: jest.fn(),
    shopify: { resourcePicker: jest.fn() },
    stepsState: { updateStepField: jest.fn() },
    ...overrides,
  } as any;
}

function makeStep(categories: any[]) {
  return {
    id: "step-1",
    StepCategory: categories,
  };
}

function renderAccordion(categories: any[]) {
  const step = makeStep(categories);
  return renderToStaticMarkup(
    React.createElement(FpbStepCategoryAccordion, {
      flow: makeFlow(),
      step,
      cat: categories[0],
      catIndex: 0,
    }),
  );
}

describe("FpbStepCategoryAccordion", () => {
  it("hides the editable category name field when the step has one category", () => {
    const view = renderAccordion([
      { id: "cat-1", name: "Single Category", products: [], collections: [] },
    ]);

    expect(view).not.toContain('aria-label="Category name"');
    expect(view).toContain("Products");
    expect(view).toContain("Collections");
  });

  it("renders the editable category name field when the step has multiple categories", () => {
    const view = renderAccordion([
      { id: "cat-1", name: "First Category", products: [], collections: [] },
      { id: "cat-2", name: "Second Category", products: [], collections: [] },
    ]);

    expect(view).toContain('aria-label="Category name"');
    expect(view).toContain('value="First Category"');
    expect(view).toContain("Products");
    expect(view).toContain("Collections");
  });
});
