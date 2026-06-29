import type React from "react";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpTooltipImage } from "../../../components/HelpTooltipImage";
import {
  HELP_TOOLTIPS,
  type HelpTooltipKey,
} from "../../../constants/help-tooltips";
import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";
import type { BundleProductCardProps } from "./types";

export const BundleProductCard = memo(
  ({
    bundleProduct,
    productImageUrl,
    productTitle,
    onSync,
    onSelect,
    onOpenProduct,
  }: BundleProductCardProps) => (
    <s-section>
      <s-stack direction="block" gap="small">
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Bundle Product
          </h3>
          <s-button variant="tertiary" tone="critical" onClick={onSync}>
            Sync Product
          </s-button>
        </s-stack>

        {bundleProduct ? (
          <s-stack direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center">
              <img
                src={productImageUrl || "/bundle.png"}
                alt={productTitle || "Bundle Product"}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
              <s-stack direction="inline" gap="small-100" alignItems="center">
                <s-button
                  variant="tertiary"
                  onClick={onOpenProduct}
                  disabled={!onOpenProduct}
                >
                  <s-icon type="view" />
                  {productTitle || bundleProduct.title || "Untitled Product"}
                </s-button>
                <s-button
                  variant="tertiary"
                  onClick={onSelect}
                  aria-label="Change bundle product"
                >
                  <s-icon type="clock" />
                </s-button>
              </s-stack>
            </s-stack>
          </s-stack>
        ) : (
          <div className={productPageBundleStyles.productSelectionPlaceholder}>
            <s-stack direction="block" gap="small-400" alignItems="center">
              <s-icon type="product" />
              <s-button variant="tertiary" onClick={onSelect}>
                Select Bundle Product
              </s-button>
            </s-stack>
          </div>
        )}
      </s-stack>
    </s-section>
  ),
);

BundleProductCard.displayName = "BundleProductCard";

export function QuestionHelpTooltip({
  tooltipKey,
}: {
  tooltipKey: HelpTooltipKey;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`, "");
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
  } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, 16),
      window.innerWidth - width - 16,
    );
    setTooltipPos({
      top: rect.bottom + 10,
      left,
      arrowLeft: rect.left + rect.width / 2 - left,
    });
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={productPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span
        className={productPageBundleStyles.questionHelpButton}
        role="img"
        tabIndex={0}
        aria-label={title || description}
      >
        <s-icon type="info" />
      </span>
      <span
        className={`${productPageBundleStyles.richHelpCard} ${productPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={
          tooltipPos
            ? ({
                position: "fixed",
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: Math.min(320, window.innerWidth - 32),
                transform: "none",
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto",
                "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {tooltip.imageSrc && (
          <HelpTooltipImage
            src={tooltip.imageSrc}
            alt={title || tooltip.accessibilityLabel || description}
          />
        )}
        {title && (
          <span className={productPageBundleStyles.richHelpTitle}>{title}</span>
        )}
        <span className={productPageBundleStyles.richHelpDescription}>
          {description}
        </span>
      </span>
    </span>
  );
}

export function VisibilityBadge({ isOptimised }: { isOptimised: boolean }) {
  const { t } = useTranslation();
  const description = t(`tooltips.bundleVisibilityPending.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const showTooltip = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setTooltipPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={
        isOptimised
          ? productPageBundleStyles.optimisedBadge
          : productPageBundleStyles.pendingBadge
      }
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`${isOptimised ? "Optimised" : "Pending"} — ${description}`}
    >
      {isOptimised ? "Optimised" : "Pending"}
      <svg
        width="11"
        height="11"
        viewBox="0 0 13 13"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="6.5"
          cy="6.5"
          r="5.75"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="6.5"
          y1="5.75"
          x2="6.5"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="6.5" cy="4.25" r="0.75" fill="currentColor" />
      </svg>
      {tooltipPos && (
        <span
          className={productPageBundleStyles.pendingTooltipCard}
          style={{
            position: "fixed",
            top: tooltipPos.top,
            right: tooltipPos.right,
          }}
          role="tooltip"
        >
          {description}
        </span>
      )}
    </span>
  );
}
