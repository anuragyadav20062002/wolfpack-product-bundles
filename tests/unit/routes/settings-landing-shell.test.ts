import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SettingsLandingShell,
  SettingsWorkspaceSkeleton,
} from "../../../app/routes/app/app.settings/SettingsLandingShell";

describe("Settings landing shell", () => {
  it("renders three actionable Polaris cards without loading a settings workspace", () => {
    const view = renderToStaticMarkup(
      React.createElement(SettingsLandingShell, { onSelect: jest.fn() }),
    );

    expect(view.match(/<s-clickable/g)).toHaveLength(3);
    expect(view).toContain("Design");
    expect(view).toContain("Language");
    expect(view).toContain("Controls");
    expect(view).toContain('accessibilityLabel="Open Design settings"');
    expect(view).not.toContain("Configure</s-text>");
    expect(view).not.toContain("Design Control Panel");
  });

  it("renders three skeleton cards without a loading spinner", () => {
    const view = renderToStaticMarkup(
      React.createElement(SettingsWorkspaceSkeleton),
    );

    expect(view).toContain('aria-label="Loading Settings"');
    expect(view).toContain('aria-busy="true"');
    expect(view.match(/data-settings-skeleton-card="true"/g)).toHaveLength(3);
    expect(view).not.toContain("<s-spinner");
  });
});
