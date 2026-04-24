/**
 * SetupScoreCard Component
 *
 * Gamified bundle setup progress card shown on the dashboard.
 * Shows a circular score ring (0–100) and a 5-step checklist.
 * Replaces the old BundleSetupInstructions component.
 */

import { Text, InlineStack, BlockStack, Button } from "@shopify/polaris";

export interface SetupScoreData {
  bundlesExist: boolean;
  hasProductsAdded: boolean;
  hasDiscount: boolean;
  hasActiveBundleOnStore: boolean;
  hasDcpConfigured: boolean;
}

export interface SetupScoreCardProps {
  setupScore: SetupScoreData;
  onCreateBundle: () => void;
}

const STEPS = [
  {
    key: "bundlesExist" as keyof SetupScoreData,
    label: "Create your first bundle",
    description: 'Click "Create Bundle" to get started',
  },
  {
    key: "hasProductsAdded" as keyof SetupScoreData,
    label: "Add products to a bundle step",
    description: "Select products or collections for each step",
  },
  {
    key: "hasDiscount" as keyof SetupScoreData,
    label: "Set a discount rule",
    description: "Configure pricing discounts for your bundle",
  },
  {
    key: "hasActiveBundleOnStore" as keyof SetupScoreData,
    label: "Make a bundle active on your store",
    description: "Publish and place your bundle on a page",
  },
  {
    key: "hasDcpConfigured" as keyof SetupScoreData,
    label: "Customize your bundle design",
    description: "Use the Design Control Panel to style your bundles",
  },
];

const POINTS_PER_STEP = 20;

function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / max, 1);
  const offset = circumference * (1 - progress);

  const getColor = () => {
    if (score >= 80) return "#008060"; // green
    if (score >= 40) return "#005bd3"; // blue
    return "#6d7175"; // gray
  };

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e3e3e3"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
        />
      </svg>
      {/* Score label centered */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: "#202223" }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: "#6d7175", lineHeight: 1.2 }}>/ {max}</span>
      </div>
    </div>
  );
}

export function SetupScoreCard({ setupScore, onCreateBundle }: SetupScoreCardProps) {
  const completedCount = STEPS.filter(s => setupScore[s.key]).length;
  const score = completedCount * POINTS_PER_STEP;
  const allDone = completedCount === STEPS.length;

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e3e3e3",
      borderRadius: "12px",
      padding: "20px",
      height: "100%",
      boxSizing: "border-box",
    }}>
      <BlockStack gap="400">
        {/* Header: ring + title */}
        <InlineStack gap="400" blockAlign="center">
          <ScoreRing score={score} />
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd" fontWeight="semibold">
              {allDone ? "Setup complete! 🎉" : "Bundle setup score"}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {allDone
                ? "Your store is fully configured."
                : `Complete all steps to reach 100 — ${STEPS.length - completedCount} remaining`}
            </Text>
          </BlockStack>
        </InlineStack>

        {/* Step checklist */}
        <BlockStack gap="200">
          {STEPS.map((step, idx) => {
            const done = setupScore[step.key];
            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: done ? "#f6fff9" : "#fafafa",
                  border: `1px solid ${done ? "#b5e3c4" : "#e3e3e3"}`,
                }}
              >
                {/* Step indicator */}
                {done ? (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#008060",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#e3e3e3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#6d7175" }}>
                      {idx + 1}
                    </span>
                  </div>
                )}

                {/* Step text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    as="p"
                    variant="bodySm"
                    fontWeight={done ? "regular" : "semibold"}
                    tone={done ? "subdued" : undefined}
                  >
                    <span style={{ textDecoration: done ? "line-through" : "none" }}>
                      {step.label}
                    </span>
                  </Text>
                  {!done && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {step.description}
                    </Text>
                  )}
                </div>

                {/* Points badge */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: done ? "#008060" : "#6d7175",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginTop: 3,
                }}>
                  +{POINTS_PER_STEP}
                </div>
              </div>
            );
          })}
        </BlockStack>

        {/* CTA: only show if no bundles yet */}
        {!setupScore.bundlesExist && (
          <Button variant="primary" fullWidth onClick={onCreateBundle}>
            Create your first bundle
          </Button>
        )}
      </BlockStack>
    </div>
  );
}
