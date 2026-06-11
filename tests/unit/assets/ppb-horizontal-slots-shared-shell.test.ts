import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('PPB Horizontal Slots shared shell migration', () => {
  it('builds modal slot grids through the shared selected-slots wrapper', () => {
    const source = readFileSync(
      join(process.cwd(), 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
      'utf8',
    );

    expect(source).toContain("import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';");
    expect(source).toContain('renderSelectedProductSlots([], {');
    expect(source).toContain("mode: isVertical ? 'vertical' : 'horizontal'");
    expect(source).toContain('bw-ppb-modal-slot-grid');
    expect(source).toContain("data-bw-selected-slots=\"true\"");
  });
});
