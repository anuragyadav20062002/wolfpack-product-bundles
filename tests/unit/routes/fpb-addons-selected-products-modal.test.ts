import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("FPB Add-ons selected products modal picker stack", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
    "utf8",
  );

  it("closes the selected-products modal before opening the resource picker from that modal", () => {
    const handlerStart = routeSource.indexOf("const handleAddonSelectedProductAdd = useCallback");
    const handlerEnd = routeSource.indexOf("const handleDisableAddonStepConfirm", handlerStart);
    const handlerSource = routeSource.slice(handlerStart, handlerEnd);

    expect(handlerSource).toContain("reopenSelectedProductsModal");
    expect(handlerSource).toContain("setIsAddonSelectedProductsModalOpen(false)");
    expect(handlerSource).toContain("hidePolarisModal(addonSelectedProductsModalRef)");

    const closeBeforePicker = handlerSource.indexOf("hidePolarisModal(addonSelectedProductsModalRef)");
    const pickerOpen = handlerSource.indexOf("resourcePicker");
    expect(closeBeforePicker).toBeGreaterThan(-1);
    expect(pickerOpen).toBeGreaterThan(closeBeforePicker);
  });

  it("reopens the selected-products modal after picker completion only for modal-launched add", () => {
    const handlerStart = routeSource.indexOf("const handleAddonSelectedProductAdd = useCallback");
    const handlerEnd = routeSource.indexOf("const handleDisableAddonStepConfirm", handlerStart);
    const handlerSource = routeSource.slice(handlerStart, handlerEnd);
    const modalStart = routeSource.indexOf('id="addon-selected-products-modal"');
    const modalEnd = routeSource.indexOf("{/* Selected Collections Modal */}", modalStart);
    const modalSource = routeSource.slice(modalStart, modalEnd);
    const sectionStart = routeSource.indexOf('{activeSection === "free_gift_addons" && (() => {');
    const sectionEnd = routeSource.indexOf('activeSection === "discount_pricing"', sectionStart);
    const sectionSource = routeSource.slice(sectionStart, sectionEnd);

    expect(handlerSource).toContain("setAddonSelectedProductsTierIndex(tierIndex)");
    expect(handlerSource).toContain("setIsAddonSelectedProductsModalOpen(true)");
    expect(modalSource).toContain("handleAddonSelectedProductAdd(addonSelectedProductsTierIndex ?? 0, { reopenSelectedProductsModal: true })");
    expect(sectionSource).toContain("handleAddonSelectedProductAdd(idx)");
    expect(sectionSource).not.toContain("handleAddonSelectedProductAdd(idx, { reopenSelectedProductsModal: true })");
  });

  it("imperatively hides the selected-products modal when closing it", () => {
    const closeStart = routeSource.indexOf("const handleCloseAddonSelectedProductsModal = useCallback");
    const closeEnd = routeSource.indexOf("const openAddonSelectedProductsModal", closeStart);
    const closeSource = routeSource.slice(closeStart, closeEnd);

    expect(closeSource).toContain("setIsAddonSelectedProductsModalOpen(false)");
    expect(closeSource).toContain("setAddonSelectedProductsTierIndex(null)");
    expect(closeSource).toContain("hidePolarisModal(addonSelectedProductsModalRef)");
  });

  it("wires the selected-products modal close action to the Polaris hide command", () => {
    const modalStart = routeSource.indexOf('id="addon-selected-products-modal"');
    const modalEnd = routeSource.indexOf("{/* Selected Collections Modal */}", modalStart);
    const modalSource = routeSource.slice(modalStart, modalEnd);

    expect(modalSource).toContain('id="addon-selected-products-modal"');
    expect(modalSource).toContain('slot="secondary-actions"');
    expect(modalSource).toContain('variant="secondary"');
    expect(modalSource).toContain('commandFor="addon-selected-products-modal"');
    expect(modalSource).toContain('command="--hide"');
  });
});
