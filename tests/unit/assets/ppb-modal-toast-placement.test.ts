import { getProductPageModalValidationToastOptions } from "../../../app/assets/widgets/product-page/methods/modal-state-methods.js";

describe("PPB modal validation toast placement", () => {
  it("keeps validation feedback body-mounted and dismissible", () => {
    expect(getProductPageModalValidationToastOptions()).toEqual({
      dismissible: true,
      className: "bundle-toast--modal",
    });
  });
});
