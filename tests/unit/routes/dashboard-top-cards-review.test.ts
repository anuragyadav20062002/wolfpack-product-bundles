import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardTopCards } from "../../../app/routes/app/app.dashboard/DashboardTopCards";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, number>) => values
      ? `${key}:${values.count}`
      : key,
  }),
}));

describe("DashboardTopCards BFS review fixes", () => {
  it("shows support issue paths without bundle count pills", () => {
    const view = renderToStaticMarkup(
      React.createElement(DashboardTopCards as any, {
        handleDirectChat: jest.fn(),
      }),
    );

    expect(view).not.toContain("dashboard.home.summary.total");
    expect(view).not.toContain("dashboard.home.summary.active");
    expect(view).toContain("dashboard.supportIssues.title");
    expect(view).toContain("dashboard.supportIssues.featureNotWorking");
    expect(view).toContain("dashboard.supportIssues.bundleNotShowing");
    expect(view).toContain("dashboard.supportIssues.uninstallHelp");
    expect(view).toContain("dashboard.supportIssues.storeDesignHelp");
    expect(view).toContain("dashboard.supportIssues.analyticsNotWorking");
    expect(view).toContain("dashboard.supportIssues.description");
    expect(view).toContain("dashboard.supportIssues.cta");
  });
});
