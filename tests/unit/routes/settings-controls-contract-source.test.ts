import { readFileSync } from "node:fs";
import { join } from "node:path";

const settingsRouteSource = readFileSync(
  join(process.cwd(), "app/routes/app/app.settings.tsx"),
  "utf8",
);

describe("Settings Controls route source contract", () => {
  it("renders Controls from the shared exported controls layout contract", () => {
    expect(settingsRouteSource).toContain("CONTROL_LAYOUTS");
    expect(settingsRouteSource).not.toContain("CONTROLS_CONFIGURATION");
    expect(settingsRouteSource).toContain("selectedControlLayout.tabs");
    expect(settingsRouteSource).toContain("selectedControlTab.contentTitle");
    expect(settingsRouteSource).toContain("selectedControlTab.contentDescription");
    expect(settingsRouteSource).toContain("selectedControlTab.fields");
    expect(settingsRouteSource).toContain('aria-label="Layout selector"');
    expect(settingsRouteSource).not.toContain('role="tablist" aria-label="Layout selector"');
  });

  it("renders recovered field metadata used by the deployed bundle defaults", () => {
    expect(settingsRouteSource).toContain("field.description");
    expect(settingsRouteSource).toContain("field.options");
    expect(settingsRouteSource).toContain("field.state");
    expect(settingsRouteSource).toContain("field.group");
    expect(settingsRouteSource).toContain("fieldGroupTitle");
  });
});
