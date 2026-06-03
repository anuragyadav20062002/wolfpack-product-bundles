import fs from "node:fs";
import path from "node:path";

const componentSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/UpgradePromptBanner.tsx"),
  "utf8",
);

const styleSource = fs.readFileSync(
  path.join(process.cwd(), "app/components/UpgradePromptBanner.module.css"),
  "utf8",
);

describe("UpgradePromptBanner layout contract", () => {
  it("uses a custom info banner layout for usage prompts", () => {
    expect(componentSource).toContain("styles.upgradePromptBanner");
    expect(componentSource).toContain("styles.upgradePromptMessage");
    expect(componentSource).toContain("styles.upgradePromptAction");
    expect(componentSource).toContain('tone === "info" ? "info" : "alert-triangle"');
  });

  it("pins the View Plans action to the far right", () => {
    expect(styleSource).toContain(".upgradePromptAction");
    expect(styleSource).toContain("margin-left: auto");
  });
});
