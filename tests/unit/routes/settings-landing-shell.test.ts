import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingsLandingShell } from "../../../app/routes/app/app.settings/SettingsLandingShell";

describe("Settings landing shell", () => {
  it("renders three actionable Polaris cards without loading a settings workspace", () => {
    const view = renderToStaticMarkup(
      React.createElement(SettingsLandingShell, { onSelect: jest.fn() }),
    );

    expect(view.match(/<s-clickable/g)).toHaveLength(3);
    expect(view).toContain("Design");
    expect(view).toContain("Language");
    expect(view).toContain("Controls");
    expect(view).not.toContain("Design Control Panel");
  });
});
