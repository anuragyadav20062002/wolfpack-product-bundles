import { useState, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HelpTooltipImage } from "../../../components/HelpTooltipImage";
import { HELP_TOOLTIPS, type HelpTooltipKey } from "../../../constants/help-tooltips";
import fullPageBundleStyles from "../../../styles/routes/full-page-bundle-configure.module.css";

export function SettingsRow({
  title,
  description,
  tooltipKey,
  children,
}: {
  title: string;
  description?: string;
  tooltipKey?: HelpTooltipKey;
  children: ReactNode;
}) {
  return (
    <div className={fullPageBundleStyles.settingsRow}>
      <div className={fullPageBundleStyles.settingsRowText}>
        <p className={fullPageBundleStyles.settingsRowTitle}>
          {title}
          {tooltipKey && <QuestionHelpTooltip tooltipKey={tooltipKey} />}
        </p>
        {description && <p className={fullPageBundleStyles.settingsRowDescription}>{description}</p>}
      </div>
      <div className={fullPageBundleStyles.settingsRowControl}>
        {children}
      </div>
    </div>
  );
}

export function RichHelpTooltip({
  label,
  tooltipKey,
  accessibilityLabel,
  icon,
}: {
  label?: string;
  tooltipKey: HelpTooltipKey;
  accessibilityLabel?: string;
  icon?: string;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`);
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16);
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
      className={fullPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span className={fullPageBundleStyles.richHelpTrigger}>
        <s-button
          icon={icon as any}
          variant="tertiary"
          accessibilityLabel={accessibilityLabel || tooltip.accessibilityLabel || label || title}
        >
          {label}
        </s-button>
      </span>
      <span
        className={`${fullPageBundleStyles.richHelpCard} ${fullPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={tooltipPos ? {
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: Math.min(320, window.innerWidth - 32),
          transform: "none",
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
        } as React.CSSProperties : undefined}
      >
        {tooltip.imageSrc && <HelpTooltipImage src={tooltip.imageSrc} alt={title} />}
        <span className={fullPageBundleStyles.richHelpTitle}>{title}</span>
        <span className={fullPageBundleStyles.richHelpDescription}>{description}</span>
      </span>
    </span>
  );
}

export function QuestionHelpTooltip({
  tooltipKey,
}: {
  tooltipKey: HelpTooltipKey;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`, tooltip.fallbackTitle || '');
  const description = t(`tooltips.${tooltipKey}.description`, tooltip.fallbackDescription || tooltip.accessibilityLabel || '');
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16);
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
      className={fullPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span className={fullPageBundleStyles.richHelpTrigger}>
        <s-button
          variant="tertiary"
          icon="info"
          accessibilityLabel={tooltip.accessibilityLabel || title || description}
        />
      </span>
      <span
        className={`${fullPageBundleStyles.richHelpCard} ${fullPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={tooltipPos ? {
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: Math.min(320, window.innerWidth - 32),
          transform: "none",
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
        } as React.CSSProperties : undefined}
      >
        {tooltip.imageSrc && <HelpTooltipImage src={tooltip.imageSrc} alt={title || tooltip.accessibilityLabel || description} />}
        {title && <span className={fullPageBundleStyles.richHelpTitle}>{title}</span>}
        <span className={fullPageBundleStyles.richHelpDescription}>{description}</span>
      </span>
    </span>
  );
}

export function VisibilityBadge({ isOptimised }: { isOptimised: boolean }) {
  const { t } = useTranslation();
  const description = t(`tooltips.bundleVisibilityPending.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; right: number } | null>(null);

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
      className={isOptimised ? fullPageBundleStyles.optimisedBadge : fullPageBundleStyles.pendingBadge}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`${isOptimised ? 'Optimised' : 'Pending'} — ${description}`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {isOptimised ? 'Optimised' : 'Pending'}
      <svg width="11" height="11" viewBox="0 0 13 13" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6.5" y1="5.75" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6.5" cy="4.25" r="0.75" fill="currentColor" />
      </svg>
      {tooltipPos && (
        <span
          className={fullPageBundleStyles.pendingTooltipCard}
          style={{ position: 'fixed', top: tooltipPos.top, right: tooltipPos.right }}
          role="tooltip"
        >
          {description}
        </span>
      )}
    </span>
  );
}

