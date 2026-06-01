import { readFileSync } from "node:fs";
import { join } from "node:path";

const settingsRouteSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.settings.tsx"),
  "utf8",
);

describe("Settings landing card-only contract", () => {
  it("keeps the landing screen limited to the EB Settings cards", () => {
    expect(settingsRouteSource).toContain("SETTINGS_CARDS.map");
    expect(settingsRouteSource).not.toContain("SETTINGS_PANELS");
    expect(settingsRouteSource).not.toContain("activePanel");
    expect(settingsRouteSource).not.toContain("DESIGN_CONFIGURATION");
  });

  it("routes Configure actions to the dedicated configuration screens", () => {
    expect(settingsRouteSource).toContain('navigate("/app/design-control-panel")');
    expect(settingsRouteSource).toContain('setSettingsView("language")');
    expect(settingsRouteSource).toContain('setSettingsView("controls")');
  });
});
