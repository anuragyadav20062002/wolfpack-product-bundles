import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

describe("FPB Add-ons selected products modal picker stack", () => {
  const routeSource = readFpbConfigureRouteFamilySource();
  const normalizedRouteSource = routeSource.replace(/\s+/g, " ");

  it("closes the selected-products modal before opening the resource picker from that modal", () => {
    const handlerStart = routeSource.indexOf(
      "const handleAddonSelectedProductAdd = useCallback",
    );
    const handlerEnd = routeSource.indexOf(
      "const handleDisableAddonStepConfirm",
      handlerStart,
    );
    const handlerSource = routeSource.slice(handlerStart, handlerEnd);

    expect(handlerSource).toContain("reopenSelectedProductsModal");
    expect(handlerSource).toContain(
      "flow.setIsAddonSelectedProductsModalOpen(false)",
    );
    expect(handlerSource).toContain(
      "flow.hidePolarisModal(flow.addonSelectedProductsModalRef)",
    );

    const closeBeforePicker = handlerSource.indexOf(
      "flow.hidePolarisModal(flow.addonSelectedProductsModalRef)",
    );
    const pickerOpen = handlerSource.indexOf("resourcePicker");
    expect(closeBeforePicker).toBeGreaterThan(-1);
    expect(pickerOpen).toBeGreaterThan(closeBeforePicker);
  });

  it("reopens the selected-products modal after picker completion only for modal-launched add", () => {
    const handlerStart = routeSource.indexOf(
      "const handleAddonSelectedProductAdd = useCallback",
    );
    const handlerEnd = routeSource.indexOf(
      "const handleDisableAddonStepConfirm",
      handlerStart,
    );
    const handlerSource = routeSource.slice(handlerStart, handlerEnd);
    const modalStart = routeSource.indexOf(
      'id="addon-selected-products-modal"',
    );
    const modalEnd = routeSource.indexOf(
      "{/* Selected Collections Modal */}",
      modalStart,
    );
    const modalSource = routeSource.slice(modalStart, modalEnd);
    expect(handlerSource).toContain(
      "setAddonSelectedProductsTierIndex(tierIndex)",
    );
    expect(handlerSource).toContain(
      "setIsAddonSelectedProductsModalOpen(true)",
    );
    expect(modalSource.replace(/\s+/g, " ")).toContain(
      "handleAddonSelectedProductAdd(addonSelectedProductsTierIndex ?? 0, { reopenSelectedProductsModal: true, })",
    );
    expect(normalizedRouteSource).toContain(
      "handleAddonSelectedProductAdd(idx)",
    );
    expect(normalizedRouteSource).not.toContain(
      "handleAddonSelectedProductAdd(idx, { reopenSelectedProductsModal: true })",
    );
  });

  it("imperatively hides the selected-products modal when closing it", () => {
    const closeStart = normalizedRouteSource.indexOf(
      "const handleCloseAddonSelectedProductsModal = () =>",
    );
    const closeEnd = normalizedRouteSource.indexOf(
      "useModalHideListener(productsModalRef",
      closeStart,
    );
    const closeSource = normalizedRouteSource.slice(closeStart, closeEnd);

    expect(closeSource).toContain("setIsAddonSelectedProductsModalOpen(false)");
    expect(closeSource).toContain("setAddonSelectedProductsTierIndex(null)");
    expect(closeSource).toContain(
      "hidePolarisModal(addonSelectedProductsModalRef)",
    );
  });

  it("wires the selected-products modal close action to the Polaris hide command", () => {
    const modalStart = routeSource.indexOf(
      'id="addon-selected-products-modal"',
    );
    const modalEnd = routeSource.indexOf(
      "{/* Selected Collections Modal */}",
      modalStart,
    );
    const modalSource = routeSource.slice(modalStart, modalEnd);

    expect(modalSource).toContain('id="addon-selected-products-modal"');
    expect(modalSource).toContain('slot="secondary-actions"');
    expect(modalSource).toContain('variant="secondary"');
    expect(modalSource).toContain('commandFor="addon-selected-products-modal"');
    expect(modalSource).toContain('command="--hide"');
  });
});
