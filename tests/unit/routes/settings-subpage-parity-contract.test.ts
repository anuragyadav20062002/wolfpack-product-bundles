import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Settings subpage parity contract", () => {
  const source = readFileSync(join(process.cwd(), "app/routes/app/app.settings.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "app/styles/routes/admin-configuration-surfaces.module.css"), "utf8");
  const config = readFileSync(join(process.cwd(), "app/lib/admin-configuration-surfaces.ts"), "utf8");

  it("uses EB-style icon-only back actions on Settings subpages", () => {
    expect(source).toContain('aria-label="Back to Settings"');
    expect(source).toContain('className={styles.settingsSubpageBackButton}');
    expect(source).not.toContain(">Back</button>");
  });

  it("renders the Design subpage as Design Control Panel aligned with the back action", () => {
    expect(source).toContain('<ui-title-bar title="Design Control Panel" />');
    expect(source).toContain('<h1 className={styles.title}>Design Control Panel</h1>');
    expect(source).toContain("settingsSubpageHeaderLeft");
  });

  it("uses valid Settings card icons", () => {
    expect(config).toContain('icon: "globe"');
    expect(config).toContain('icon: "filter"');
    expect(config).not.toContain('icon: "language"');
    expect(config).not.toContain('icon: "adjust"');
  });

  it("uses visible CSS chevrons for dark Settings dropdowns", () => {
    expect(source).not.toContain('type="caret-down"');
    expect(source).not.toContain('return "corner-round"');
    expect(source).not.toContain('return "image-add"');
    expect(source).not.toContain('return "link-list"');
    expect(source).not.toContain('return "adjust"');
    expect(styles).toContain(".languageLayoutButton::after");
    expect(styles).toContain("border-right: 1.5px solid #ffffff");
  });

  it("wires Show Variables to an in-page variables modal", () => {
    expect(source).toContain("settingsVariablesModal");
    expect(source).toContain("setSettingsVariablesModal");
    expect(source).toContain("onShowVariables");
    expect(source).toContain("SettingsVariablesModal");
  });

  it("places the expert color warning inside the right Design section", () => {
    const contentStart = source.indexOf("styles.designContentCard");
    const alertIndex = source.indexOf("styles.designGateAlert", contentStart);
    expect(contentStart).toBeGreaterThan(-1);
    expect(alertIndex).toBeGreaterThan(contentStart);
  });
});
