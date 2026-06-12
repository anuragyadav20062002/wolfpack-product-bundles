import { readFullPageWidgetSources } from './widget-source-helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderStepTimelineEntry } = require('../../../app/assets/widgets/shared/components/step-timeline.js');

describe('shared step timeline entry renderer', () => {
  it('renders the stable FPB timeline step DOM contract', () => {
    const html = renderStepTimelineEntry({
      stepIndex: 2,
      timelineType: 'step',
      label: 'Choose <Item>',
      iconHtml: '<svg data-icon="true"></svg>',
      checkmarkHtml: '<svg data-check="true"></svg>',
      classes: ['timeline-step--active'],
    });

    expect(html).toContain('class="timeline-step timeline-step--active"');
    expect(html).toContain('data-step-index="2"');
    expect(html).toContain('data-timeline-type="step"');
    expect(html).toContain('<svg data-icon="true"></svg>');
    expect(html).toContain('<div class="timeline-checkmark"><svg data-check="true"></svg></div>');
    expect(html).toContain('Choose &lt;Item&gt;');
  });

  it('is included in the widget shared module bundle before widget sources', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const modulesStart = script.indexOf('const WIDGET_SHARED_MODULES = [');
    const modulesEnd = script.indexOf('];', modulesStart);
    const modules = script.slice(modulesStart, modulesEnd);

    expect(modules).toContain('app/assets/widgets/shared/components/step-timeline.js');
  });
});

describe('FPB timeline shared renderer integration', () => {
  it('delegates timeline step markup to the shared renderer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const source = readFullPageWidgetSources();

    expect(source).toContain("import { renderStepTimelineEntry } from './widgets/shared/components/step-timeline.js';");
    expect(source).toContain('renderStepTimelineEntry({');
  });
});
