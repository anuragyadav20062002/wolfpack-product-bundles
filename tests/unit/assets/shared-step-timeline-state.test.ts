import { readFullPageWidgetSources } from './widget-source-helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getTimelineEntryState } = require('../../../app/assets/widgets/shared/engine/bundle-selectors.js');

describe('shared step timeline state selector', () => {
  it('marks the current accessible step active', () => {
    expect(getTimelineEntryState({
      entry: { type: 'step', stepIndex: 1, step: {} },
      currentStepIndex: 1,
      isCompleted: false,
      isAccessible: true,
    })).toEqual({
      isDefaultStep: false,
      isCurrent: true,
      isCompleted: false,
      isAccessible: true,
      classes: ['timeline-step--active'],
    });
  });

  it('marks completed included steps', () => {
    expect(getTimelineEntryState({
      entry: { type: 'step', stepIndex: 0, step: { isDefault: true } },
      currentStepIndex: 1,
      isCompleted: true,
      isAccessible: true,
    }).classes).toEqual([
      'timeline-step--included',
      'timeline-step--completed',
    ]);
  });

  it('marks inaccessible future steps locked and inactive', () => {
    expect(getTimelineEntryState({
      entry: { type: 'step', stepIndex: 2, step: {} },
      currentStepIndex: 0,
      isCompleted: false,
      isAccessible: false,
    }).classes).toEqual([
      'timeline-step--inactive',
      'timeline-step--locked',
    ]);
  });

  it('marks current multiple-category entries active when requested', () => {
    expect(getTimelineEntryState({
      entry: { type: 'multiple_categories', stepIndex: 1, step: {} },
      currentStepIndex: 1,
      isCompleted: false,
      isAccessible: true,
      hasMultipleCategoryEntry: true,
    }).classes).toEqual(['timeline-step--active']);
  });
});

describe('FPB timeline shared state integration', () => {
  it('delegates timeline class state to the shared selector', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const source = readFullPageWidgetSources();

    expect(source).toContain("getTimelineEntryState");
    expect(source).toContain("classes: timelineState.classes");
    expect(source).toContain("timelineState.classes.forEach((className) => itemEl.classList.add(className));");
  });
});
