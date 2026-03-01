/**
 * StepBarPreview
 *
 * Renders real widget HTML for the step timeline and step tabs.
 * CSS variables are injected by the parent <PreviewScope>.
 *
 * Two sub-sections:
 * - Timeline sub-sections (completedStep, incompleteStep, stepBarProgressBar, stepName):
 *   Shows the .step-timeline circles + connecting lines using real CSS classes.
 * - stepBarTabs:
 *   Shows the .step-tabs-container with real .step-tab pills.
 */

import { Text } from "@shopify/polaris";
import { HighlightBox } from "./HighlightBox";

// Real step timeline HTML matching the widget's createStepTimeline() structure.
// Classes: .step-timeline > .timeline-step(.completed|.current|.locked) >
//           .timeline-circle + .timeline-line + .timeline-step-name
const timelineHTML = `
<div class="step-timeline">
  <div class="timeline-step completed">
    <div class="timeline-circle">✓</div>
    <div class="timeline-line"></div>
    <div class="timeline-step-name">Step 1</div>
  </div>
  <div class="timeline-step current">
    <div class="timeline-circle">2</div>
    <div class="timeline-line"></div>
    <div class="timeline-step-name">Step 2</div>
  </div>
  <div class="timeline-step locked">
    <div class="timeline-circle">3</div>
    <div class="timeline-step-name">Step 3</div>
  </div>
</div>
`.trim();

// Real step tabs HTML matching the widget's createStepTimeline() step-tabs output.
// Classes: .step-tabs-container > .step-tab(.active|.completed|.locked)
const stepTabsHTML = `
<div class="step-tabs-container">
  <div class="step-tab completed" data-step-index="0">
    <div class="tab-number">1</div>
    <div class="tab-info">
      <span class="tab-name">Shoes</span>
      <span class="tab-count">2 selected</span>
    </div>
    <div class="tab-check">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  <div class="step-tab active" data-step-index="1">
    <div class="tab-number">2</div>
    <div class="tab-info">
      <span class="tab-name">Laces</span>
      <span class="tab-hint">Select 1+</span>
    </div>
  </div>
  <div class="step-tab locked" data-step-index="2">
    <div class="tab-number">3</div>
    <div class="tab-info">
      <span class="tab-name">Cleaner</span>
      <span class="tab-hint">Choose items</span>
    </div>
    <div class="tab-lock">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M12 7H11V5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5V7H4C3.45 7 3 7.45 3 8V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V8C13 7.45 12.55 7 12 7ZM8 11C7.45 11 7 10.55 7 10C7 9.45 7.45 9 8 9C8.55 9 9 9.45 9 10C9 10.55 8.55 11 8 11ZM9.1 7H6.9V5C6.9 4.39 7.39 3.9 8 3.9C8.61 3.9 9.1 4.39 9.1 5V7Z" fill="currentColor"/>
      </svg>
    </div>
  </div>
</div>
`.trim();

interface StepBarPreviewProps {
  activeSubSection: string;
}

export function StepBarPreview({ activeSubSection }: StepBarPreviewProps) {
  // Step tabs sub-section — show real .step-tabs-container structure
  if (activeSubSection === "stepBarTabs") {
    return (
      <div style={{ textAlign: "center", width: "100%" }}>
        <Text as="h3" variant="headingLg" fontWeight="semibold">
          Step Tabs
        </Text>
        <div style={{ marginTop: "32px" }}>
          <HighlightBox active>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: stepTabsHTML }} />
          </HighlightBox>
        </div>
        <div style={{ marginTop: "32px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Preview updates as you customize
          </Text>
        </div>
      </div>
    );
  }

  // Timeline sub-sections: completedStep, incompleteStep, stepBarProgressBar, stepName
  const titleMap: Record<string, string> = {
    completedStep: "Completed Step",
    incompleteStep: "Incomplete Step",
    stepBarProgressBar: "Step Bar",
    stepName: "Step Name",
  };

  return (
    <div style={{ textAlign: "center", width: "100%", overflowX: "auto" }}>
      <Text as="h3" variant="headingLg" fontWeight="semibold">
        {titleMap[activeSubSection] ?? "Step Bar"}
      </Text>
      <div style={{ marginTop: "32px", display: "inline-block" }}>
        <HighlightBox
          active={
            activeSubSection === "completedStep" ||
            activeSubSection === "incompleteStep" ||
            activeSubSection === "stepBarProgressBar" ||
            activeSubSection === "stepName"
          }
        >
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: timelineHTML }} />
        </HighlightBox>
      </div>
      <div style={{ marginTop: "40px" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Preview updates as you customize
        </Text>
      </div>
    </div>
  );
}
