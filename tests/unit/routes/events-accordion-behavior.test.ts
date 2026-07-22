import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccordionItem } from "../../../app/components/AccordionItem";

describe("Events accordion behavior", () => {
  it("uses native disclosure semantics and keeps the caller content contract", () => {
    const view = renderToStaticMarkup(
      React.createElement(
        AccordionItem,
        {
          title: "Latest update",
          subtitle: "What changed",
          badge: "New",
          defaultOpen: true,
        },
        React.createElement("p", null, "Update details"),
      ),
    );

    expect(view).toContain("<details");
    expect(view).toContain("<summary");
    expect(view).toContain("Latest update");
    expect(view).toContain("Update details");
    expect(view).toContain("<s-badge");
  });
});
