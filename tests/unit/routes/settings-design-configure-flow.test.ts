import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings Design configure flow", () => {
  it("opens the Settings Design subpage", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");

    expect(source).toContain('if (card.id === "design")');
    expect(source).toContain('setSettingsView("design")');
    expect(source).toContain("setSettingsView(\"design\")");
    expect(source).not.toContain("Store-level configuration");
  });
});
