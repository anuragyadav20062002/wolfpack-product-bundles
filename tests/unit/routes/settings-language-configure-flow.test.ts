import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings Language configure flow", () => {
  it("opens a dedicated Language Configurations view from the Language card", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");
    const config = readFileSync(join(process.cwd(), "app/lib/admin-configuration-surfaces.ts"), "utf8");

    expect(source).toContain('settingsView === "language"');
    expect(source).toContain('ui-title-bar title="Language Configurations"');
    expect(source).toContain('setSettingsView("language")');
    expect(source).toContain('setSettingsView("landing")');
    expect(source).toContain("Enable Multilanguage");
    expect(source).toContain("Add preferred languages");
    expect(source).toContain("Shared Components");
    expect(config).toContain("Button Configuration");
  });
});
