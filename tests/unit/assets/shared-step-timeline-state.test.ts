// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getTimelineEntryState,
  shouldShowTimelineCompletedState,
} = require('../../../app/assets/widgets/shared/engine/bundle-selectors.js');

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

describe('timeline completed-state selector', () => {
  it('does not mark future steps completed even when their condition is satisfied', () => {
    expect(shouldShowTimelineCompletedState({
      entry: { type: 'step', stepIndex: 1, step: {} },
      currentStepIndex: 0,
      isStepCompleted: true,
      hasMultipleCategoryEntry: false,
    })).toBe(false);
  });

  it('marks past completed steps completed', () => {
    expect(shouldShowTimelineCompletedState({
      entry: { type: 'step', stepIndex: 0, step: {} },
      currentStepIndex: 1,
      isStepCompleted: true,
      hasMultipleCategoryEntry: false,
    })).toBe(true);
  });

  it('preserves the current multiple-category step completed state', () => {
    expect(shouldShowTimelineCompletedState({
      entry: { type: 'step', stepIndex: 1, step: {} },
      currentStepIndex: 1,
      isStepCompleted: true,
      hasMultipleCategoryEntry: true,
    })).toBe(true);
  });
});
