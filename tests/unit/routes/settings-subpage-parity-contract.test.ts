import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings subpage parity contract", () => {
  const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");
  const config = readFileSync(join(process.cwd(), "app/lib/admin-configuration-surfaces.ts"), "utf8");

  it("uses valid Settings card icons", () => {
    expect(config).toContain('icon: "globe"');
    expect(config).toContain('icon: "filter"');
    expect(config).not.toContain('icon: "language"');
    expect(config).not.toContain('icon: "adjust"');
  });

  it("wires Show Variables to an in-page variables modal", () => {
    expect(source).toContain("settingsVariablesModal");
    expect(source).toContain("setSettingsVariablesModal");
    expect(source).toContain("onShowVariables");
    expect(source).toContain("SettingsVariablesModal");
  });
});
