import fs from "node:fs";
import path from "node:path";

const fpbRoute = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);
const ppbRoute = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);
const fpbHandler = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts"),
  "utf8",
);

function slotIconBlock(source: string) {
  const start = source.indexOf("{/* Slot Icon");
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf("</s-stack>", source.indexOf("</s-stack>", start) + 1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end + "</s-stack>".length);
}

describe("FPB Bundle Settings Slot Icon", () => {
  it("uses dedicated productSlotIconUrl state and picker", () => {
    const source = fpbRoute;
    const block = slotIconBlock(source);
    expect(source).toContain("const [productSlotIconUrl, setProductSlotIconUrl]");
    expect(source).toContain("const [showSlotIconPicker, setShowSlotIconPicker]");
    expect(block).toContain("<FilePicker");
    expect(block).toContain("value={productSlotIconUrl || null}");
    expect(block).toContain("setProductSlotIconUrl(url ?? \"\")");
    expect(block).toContain("setProductSlotIconUrl(\"\")");
  });

  it("does not navigate to Step Setup or mutate Step Config", () => {
    const source = fpbRoute;
    const block = slotIconBlock(source);
    expect(block).not.toContain('handleSectionChange("step_setup")');
    expect(block).not.toContain('"stepImage"');
  });

  it("shows upload-control shell", () => {
    const block = slotIconBlock(fpbRoute);
    expect(block).toContain("Upload file");
    expect(block).toContain("No file chosen");
  });

  it("keeps change/reset controls", () => {
    const block = slotIconBlock(fpbRoute);
    expect(block).toContain("Change Icon");
    expect(block).toContain("Reset");
  });
});

describe("PPB Bundle Settings Slot Icon", () => {
  it("does not expose the FPB-only Slot Icon setting", () => {
    expect(ppbRoute).not.toContain("const [productSlotIconUrl, setProductSlotIconUrl]");
    expect(ppbRoute).not.toContain("const [showSlotIconPicker, setShowSlotIconPicker]");
    expect(ppbRoute).not.toContain('label="Slot Icon"');
    expect(ppbRoute).not.toContain('formData.append("productSlotIconUrl"');
  });
});

describe("FPB Slot Icon save contract", () => {
  it("submits and persists the dedicated productSlotIconUrl field", () => {
    expect(fpbRoute).toContain('formData.append("productSlotIconUrl", productSlotIconUrl)');
    expect(fpbHandler).toContain('const productSlotIconUrlRaw = formData.get("productSlotIconUrl") as string | null');
    expect(fpbHandler).toContain("productSlotIconUrl,");
  });
});

describe("Step Config independence", () => {
  it.each([
    ["FPB", fpbRoute],
    ["PPB", ppbRoute],
  ])("%s keeps the per-step stepImage picker", (_bundleType, source) => {
    expect(source).toContain("stepsState.updateStepField(step.id, 'stepImage', url)");
  });
});
