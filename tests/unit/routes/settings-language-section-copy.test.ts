import { readFileSync } from "node:fs";
import { join } from "node:path";

const settingsRouteSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.settings.tsx"),
  "utf8",
);

describe("Settings Language section copy", () => {
  it("keeps the captured Shared Components and Template Language descriptions", () => {
    expect(settingsRouteSource).toContain("Shared Components");
    expect(settingsRouteSource).toContain("Customize language for components across all templates");
    expect(settingsRouteSource).toContain("Cart &amp; Checkout");
    expect(settingsRouteSource).toContain("Template Language");
    expect(settingsRouteSource).toContain("Edit language for your landing page or product page template");
    expect(settingsRouteSource).toContain("Landing Page Layout");
    expect(settingsRouteSource).toContain("Product Card");
    expect(settingsRouteSource).toContain("Button Configuration");
    expect(settingsRouteSource).toContain("Product card button text and action labels");
  });
});
