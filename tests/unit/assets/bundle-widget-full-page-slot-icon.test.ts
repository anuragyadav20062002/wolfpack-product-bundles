import { readFullPageWidgetSources } from './widget-source-helpers';

const source = readFullPageWidgetSources();

describe("full-page widget bundle Slot Icon", () => {
  it("renders the bundle-level slot icon in empty cards before falling back to the plus SVG", () => {
    expect(source).toContain("this.selectedBundle?.productSlotIconUrl");
    expect(source).toContain("emptyStateIconUrl");
    expect(source).toContain('<img class="empty-state-card-icon"');
    expect(source).toContain('<svg class="empty-state-card-icon"');
  });
});
