import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EXPERT_COLOR_CONTROLS } from "../../../app/lib/admin-configuration-surfaces";
import { DesignFields } from "../../../app/routes/app/app.settings/SettingsDesignFields";

const EXPECTED_GUIDES = [
  "/design-color-guide-general.avif",
  "/design-color-guide-categories.avif",
  "/design-color-guide-product-card.avif",
  "/design-color-guide-bundle-cart.avif",
  "/design-color-guide-upsell.avif",
];

describe("Settings Design visual guide links", () => {
  it("opens every Wolfpack-owned AVIF guide in a new tab", () => {
    const view = Object.entries(EXPERT_COLOR_CONTROLS)
      .map(([title, fields]) => renderToStaticMarkup(React.createElement(DesignFields, {
        title,
        fields,
        values: {},
        onFieldChange: jest.fn(),
      })))
      .join("");

    EXPECTED_GUIDES.forEach((guideUrl) => {
      expect(view).toContain(`href="${guideUrl}"`);
    });
    expect(view.match(/target="_blank"/g)).toHaveLength(EXPECTED_GUIDES.length);
    expect(view).toContain("Visual reference");
    expect(view.match(/Show Colour Guide/g)).toHaveLength(EXPECTED_GUIDES.length);
    expect(view).not.toContain("cloudfront.net");
  });
});
