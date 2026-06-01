import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

describe("PPB Select Product Page Template modal close contract", () => {
  const modalStart = source.indexOf("{/* Page Selection Modal */}");
  const modalEnd = source.indexOf("{/* Selected Products Modal */}");
  const modalSource = source.slice(modalStart, modalEnd);

  it("uses a controlled dialog instead of the non-closing s-modal wrapper", () => {
    expect(modalSource).toContain("isPageSelectionModalOpen &&");
    expect(modalSource).toContain('role="dialog"');
    expect(modalSource).not.toContain("<s-modal");
    expect(modalSource).not.toContain("pageSelectionModalRef");
  });

  it("wires the X button and backdrop to the page-selection close handler", () => {
    expect(modalSource).toContain("onClick={closePageSelectionModal}");
    expect(modalSource).toContain('aria-label="Close"');
    expect(modalSource).toContain("onClick={(event) => event.stopPropagation()}");
  });
});
