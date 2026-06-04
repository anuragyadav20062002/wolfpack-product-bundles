import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);
const slotIconStart = source.indexOf("{/* Slot Icon — nested inside EQV section */}");
const slotIconEnd = source.indexOf("{/* Variant Selector + Show Text on + Button */}");
const slotIconSource = source.slice(slotIconStart, slotIconEnd);

describe("FPB Bundle Settings Slot Icon contract", () => {
  it("opens the icon picker in-place instead of navigating to Step Setup", () => {
    expect(slotIconSource).toContain("Change Icon");
    expect(slotIconSource).not.toContain('handleSectionChange("step_setup")');
    expect(slotIconSource).toContain("setShowSlotIconPicker(true)");
    expect(slotIconSource).toContain("showSlotIconPicker");
  });

  it("writes Slot Icon changes through the bundle-level productSlotIconUrl contract", () => {
    expect(slotIconSource).toContain("<FilePicker");
    expect(slotIconSource).toContain("value={productSlotIconUrl || null}");
    expect(slotIconSource).toContain("setProductSlotIconUrl(url ?? \"\")");
    expect(slotIconSource).toContain("setProductSlotIconUrl(\"\")");
    expect(slotIconSource).not.toContain("stepImage");
  });
});
