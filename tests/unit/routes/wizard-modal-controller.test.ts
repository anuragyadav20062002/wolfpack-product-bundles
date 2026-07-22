import {
  bindWizardModalDismiss,
  restoreWizardModalFocus,
  setWizardModalVisibility,
} from "../../../app/routes/app/app.bundles.create_.configure.$bundleId/wizard-modal-controller";

describe("create wizard modal controller", () => {
  it("shows a stable Polaris modal by ID", () => {
    const modal = { show: jest.fn(), hide: jest.fn() };

    setWizardModalVisibility(modal, "wizard-language-modal", true);

    expect(modal.show).toHaveBeenCalledWith("wizard-language-modal");
    expect(modal.hide).not.toHaveBeenCalled();
  });

  it("hides a stable Polaris modal by ID", () => {
    const modal = { show: jest.fn(), hide: jest.fn() };

    setWizardModalVisibility(modal, "wizard-filters-modal", false);

    expect(modal.hide).toHaveBeenCalledWith("wizard-filters-modal");
    expect(modal.show).not.toHaveBeenCalled();
  });

  it("restores focus to the control that opened the modal", () => {
    const opener = { focus: jest.fn() };

    restoreWizardModalFocus(opener);

    expect(opener.focus).toHaveBeenCalledTimes(1);
  });

  it("routes built-in dismiss and hide events through the close callback", () => {
    const listeners = new Map<string, EventListener>();
    const modal = {
      addEventListener: jest.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener);
      }),
      removeEventListener: jest.fn(),
    };
    const onClose = jest.fn();
    const unbind = bindWizardModalDismiss(modal, onClose);

    listeners.get("dismiss")?.(new Event("dismiss"));
    listeners.get("hide")?.(new Event("hide"));
    unbind();

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(modal.removeEventListener).toHaveBeenCalledTimes(2);
  });
});
