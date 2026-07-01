import { moveArrayItem } from "../../../app/lib/bundle-config/reorder-items";

describe("moveArrayItem", () => {
  it("moves an item forward", () => {
    expect(moveArrayItem(["a", "b", "c", "d"], 1, 3)).toEqual([
      "a",
      "c",
      "d",
      "b",
    ]);
  });

  it("moves an item backward", () => {
    expect(moveArrayItem(["a", "b", "c", "d"], 3, 1)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("returns a copy in original order for invalid indexes", () => {
    const items = ["a", "b"];
    const result = moveArrayItem(items, -1, 1);

    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it("returns a copy in original order for a same-index move", () => {
    const items = ["a", "b"];
    const result = moveArrayItem(items, 1, 1);

    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });
});
