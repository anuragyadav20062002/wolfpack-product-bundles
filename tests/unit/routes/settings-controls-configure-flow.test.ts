import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings Controls configure flow", () => {
  it("opens a dedicated Additional Configurations view from the Controls card", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");

    expect(source).toContain('settingsView === "controls"');
    expect(source).toContain('ui-title-bar title="Additional Configurations"');
    expect(source).toContain('setSettingsView("controls")');
    expect(source).toContain("Back");
    expect(source).toContain("App Configurations");
    expect(source).toContain("Configure your bundle settings");
    expect(source).toContain("Layout selector");
    expect(source).toContain("<select");
    expect(source).toContain("nextLayoutLabel");
    expect(source).toContain("Configuration tabs");
  });
});
