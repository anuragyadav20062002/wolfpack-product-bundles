import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings Design configure flow", () => {
  it("routes the Design card Configure action to the Design Control Panel", () => {
    const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");

    expect(source).toContain('if (card.id === "design")');
    expect(source).toContain('navigate("/app/design-control-panel")');
    expect(source).not.toContain("Open Design Control Panel");
    expect(source).not.toContain("Store-level configuration");
  });
});
