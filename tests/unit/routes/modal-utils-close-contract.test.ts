import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/_shared/bundle-configure/modal-utils.ts"),
  "utf8",
);

describe("Polaris modal close contract", () => {
  it("keeps React state in sync for every s-modal close event used by Admin modals", () => {
    for (const eventName of ["dismiss", "hide", "close", "afterhide"]) {
      expect(source).toContain(`modal.addEventListener("${eventName}", handler);`);
      expect(source).toContain(`modal.removeEventListener("${eventName}", handler);`);
    }
  });

  it("falls back to the built-in Close button click path when s-modal does not emit hide", () => {
    expect(source).toContain("const closeClickHandler = (event: MouseEvent) =>");
    expect(source).toContain("event.composedPath()");
    expect(source).toContain('node.getAttribute("aria-label") === "Close"');
    expect(source).toContain('modal.addEventListener("click", closeClickHandler);');
    expect(source).toContain('modal.removeEventListener("click", closeClickHandler);');
  });
});
