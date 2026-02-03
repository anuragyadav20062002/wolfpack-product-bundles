import { Text } from "@shopify/polaris";
import type { DesignSettings } from "../../../types/state.types";

interface StepBarPreviewProps {
  activeSubSection: string;
  settings: DesignSettings;
}

/**
 * StepBarPreview - Preview component for step bar related settings.
 * Displays the step progress bar, completed/incomplete step indicators,
 * and optionally category tabs.
 */
export function StepBarPreview({ activeSubSection, settings }: StepBarPreviewProps) {
  const {
    stepBarProgressEmptyColor,
    stepBarProgressFilledColor,
    completedStepCircleBorderRadius,
    completedStepBgColor,
    completedStepCircleBorderColor,
    completedStepCheckMarkColor,
    incompleteStepCircleStrokeRadius,
    incompleteStepBgColor,
    incompleteStepCircleStrokeColor,
    stepNameFontColor,
    stepNameFontSize,
    tabsActiveBgColor,
    tabsActiveTextColor,
    tabsInactiveBgColor,
    tabsInactiveTextColor,
    tabsBorderColor,
    tabsBorderRadius,
  } = settings;

  return (
    <div style={{ maxWidth: "627px", width: "100%" }}>
      {/* Step Bar Container */}
      <div style={{ marginBottom: "24px" }}>
        {/* Steps with circles and progress bar */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          {/* Progress Bar Background */}
          <div
            style={{
              position: "absolute",
              top: "33px",
              left: "33px",
              right: "33px",
              height: "7px",
              backgroundColor: stepBarProgressEmptyColor,
              borderRadius: "4px",
              zIndex: 0,
            }}
          >
            {/* Progress Bar Filled */}
            <div
              style={{
                width: "47%",
                height: "100%",
                backgroundColor: stepBarProgressFilledColor,
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Steps Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Step 1 - Completed */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "67px",
                  height: "67px",
                  borderRadius: `${completedStepCircleBorderRadius}%`,
                  backgroundColor: completedStepBgColor,
                  border: `2px solid ${completedStepCircleBorderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke={completedStepCheckMarkColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  color: stepNameFontColor,
                  fontSize: `${stepNameFontSize}px`,
                  fontWeight: 500,
                }}
              >
                Step 1
              </span>
            </div>

            {/* Step 2 - Completed */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "67px",
                  height: "67px",
                  borderRadius: `${completedStepCircleBorderRadius}%`,
                  backgroundColor: completedStepBgColor,
                  border: `2px solid ${completedStepCircleBorderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke={completedStepCheckMarkColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  color: stepNameFontColor,
                  fontSize: `${stepNameFontSize}px`,
                  fontWeight: 500,
                }}
              >
                Step 2
              </span>
            </div>

            {/* Step 3 - Incomplete */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "67px",
                  height: "67px",
                  borderRadius: `${incompleteStepCircleStrokeRadius}%`,
                  backgroundColor: incompleteStepBgColor,
                  border: `2px solid ${incompleteStepCircleStrokeColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    color: stepNameFontColor,
                    fontSize: "20px",
                    fontWeight: 600,
                  }}
                >
                  3
                </span>
              </div>
              <span
                style={{
                  color: stepNameFontColor,
                  fontSize: `${stepNameFontSize}px`,
                  fontWeight: 500,
                }}
              >
                Step 3
              </span>
            </div>
          </div>
        </div>

        {/* Tabs - Only shown for stepBarTabs subsection */}
        {activeSubSection === "stepBarTabs" && (
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              gap: "0",
              border: `1px solid ${tabsBorderColor}`,
              borderRadius: `${tabsBorderRadius}px`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: tabsActiveBgColor,
                color: tabsActiveTextColor,
                padding: "12px 24px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Category 1
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: tabsInactiveBgColor,
                color: tabsInactiveTextColor,
                padding: "12px 24px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                borderLeft: `1px solid ${tabsBorderColor}`,
              }}
            >
              Category 2
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: tabsInactiveBgColor,
                color: tabsInactiveTextColor,
                padding: "12px 24px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                borderLeft: `1px solid ${tabsBorderColor}`,
              }}
            >
              Category 3
            </div>
          </div>
        )}
      </div>

      {/* Annotation */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <Text as="p" variant="bodySm" tone="subdued">
          Preview updates as you customize
        </Text>
      </div>
    </div>
  );
}
