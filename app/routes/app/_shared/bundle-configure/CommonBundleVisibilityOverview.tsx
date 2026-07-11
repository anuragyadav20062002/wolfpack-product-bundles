import type {
  BundleLinkModel,
  EmbedStatusModel,
} from "../../../../lib/bundle-config/common-configure-page-model";

interface VisibilityGuide {
  title: string;
  description: string;
  img: string;
  guide: string;
}

interface VisibilityPlacementOption {
  title: string;
  description: string;
  actionLabel: string;
  variant: "primary" | "secondary";
  onAction: () => void;
}

const VISIBILITY_GUIDES: VisibilityGuide[] = [
  {
    title: "Hero Banner",
    description:
      "Add a button to your homepage hero to drive shoppers directly to your bundle.",
    img: "/Hero-Banner.avif",
    guide:
      "Copy your bundle link, open the theme editor, add or select an image banner, set the button label and link, then save.",
  },
  {
    title: "Navigation Menu",
    description:
      "Add your bundle as a nav link so shoppers can find it from anywhere on your store.",
    img: "/Navigation-Menu.avif",
    guide:
      "Copy your bundle link, open Content > Menus, add the bundle as a main-menu item, then save the menu.",
  },
  {
    title: "Announcement Banner",
    description:
      "Show your offer in the announcement bar so visitors see it instantly.",
    img: "/Announcement-Bar.avif",
    guide:
      "Copy your bundle link, open the theme editor, enable the announcement bar, add offer copy and the bundle link, then save.",
  },
  {
    title: "Featured Product Card",
    description:
      "Feature your bundle product on your homepage so shoppers find it right away.",
    img: "/Featured-Product-Card.avif",
    guide:
      "Add the bundle product to a collection, open the theme editor, select Featured Collection, choose that collection, lower the max product count, then save.",
  },
];

interface CommonBundleVisibilityOverviewProps {
  active: boolean;
  embedStatus: EmbedStatusModel;
  link: BundleLinkModel;
  onCopyLink: () => void;
  onOpenLink: () => void;
  onCreatePage?: () => void;
  onEnableEmbed?: () => void;
  pageSlug?: string;
  pageSlugError?: string | null;
  setPageSlug?: (slug: string) => void;
  onPageSlugEdited?: () => void;
  onPageSlugBlur?: () => void;
  creatingPage?: boolean;
  styles: Record<string, string>;
  themeEditorUrl?: string | null;
  placementOptions: VisibilityPlacementOption[];
}

export function CommonBundleVisibilityOverview({
  active,
  creatingPage,
  embedStatus,
  link,
  onCopyLink,
  onCreatePage,
  onEnableEmbed,
  onOpenLink,
  onPageSlugBlur,
  onPageSlugEdited,
  pageSlug,
  pageSlugError,
  placementOptions,
  setPageSlug,
  styles,
  themeEditorUrl,
}: CommonBundleVisibilityOverviewProps) {
  if (!active) return null;

  return (
    <div className={styles.visibilityOverviewStack}>
      <div className={styles.visibilityOverviewCard}>
        <div className={styles.visibilityCardHeaderRow}>
          <div>
            <h3 className={styles.visibilityCardTitle}>App Embed Status</h3>
            <p className={styles.visibilityCardText}>{embedStatus.description}</p>
          </div>
          <div
            className={
              embedStatus.enabled
                ? styles.visibilityStatusEnabled
                : styles.visibilityStatusWarning
            }
          >
            {embedStatus.label}
          </div>
        </div>
        {!embedStatus.enabled && themeEditorUrl && onEnableEmbed && (
          <button
            type="button"
            className={styles.visibilitySecondaryAction}
            onClick={onEnableEmbed}
          >
            Enable Here
          </button>
        )}
      </div>

      <div className={styles.visibilityOverviewCard}>
        <div className={styles.visibilitySectionIntro}>
          <h3 className={styles.visibilityCardTitle}>
            Publishing Best Practices
          </h3>
          <p className={styles.visibilityCardText}>
            Pick a placement and follow the quick guide to make your bundle
            discoverable on your store.
          </p>
        </div>
        <div className={styles.visibilityGuideGrid}>
          {VISIBILITY_GUIDES.map(({ title, description, img, guide }) => (
            <div key={title} className={styles.visibilityGuideCard}>
              <div className={styles.visibilityGuideMedia}>
                <img src={img} alt={title} />
              </div>
              <div className={styles.visibilityGuideBody}>
                <h4 className={styles.visibilityGuideTitle}>{title}</h4>
                <p className={styles.visibilityGuideDescription}>
                  {description}
                </p>
                <div className={styles.visibilityGuideFooter}>
                  <details>
                    <summary className={styles.visibilityGuideAction}>
                      Quick Setup Guide
                    </summary>
                    <p className={styles.visibilityGuideDescription}>{guide}</p>
                  </details>
                  <span className={styles.visibilitySetupTime}>
                    5 min setup
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.visibilityOverviewCard}>
        <div className={styles.visibilitySectionIntro}>
          <h3 className={styles.visibilityCardTitle}>Your Bundle Link</h3>
          <p className={styles.visibilityCardText}>
            Use this link to place your bundle anywhere - theme components,
            emails, ads, or social bios.
          </p>
        </div>
        {link.isLinked ? (
          <div className={styles.visibilityLinkRow}>
            <input
              className={styles.visibilityTextInput}
              aria-label="Bundle link"
              value={link.url}
              disabled
              readOnly
            />
            <button
              type="button"
              className={styles.visibilitySecondaryAction}
              onClick={onCopyLink}
            >
              Copy Link
            </button>
            <button
              type="button"
              className={styles.visibilityPlainAction}
              onClick={onOpenLink}
            >
              View on Storefront
            </button>
          </div>
        ) : link.kind === "page" && onCreatePage ? (
          <>
            <div className={styles.visibilityLinkRow}>
              <input
                className={styles.visibilityTextInput}
                aria-label="Bundle link"
                value={link.url}
                disabled
                readOnly
              />
              <button
                type="button"
                className={styles.visibilityPrimaryAction}
                onClick={onCreatePage}
                disabled={Boolean(pageSlugError) || creatingPage}
              >
                {creatingPage ? "Creating..." : "Create Page"}
              </button>
            </div>
            {pageSlug !== undefined && setPageSlug && (
              <label className={styles.visibilityFieldLabel}>
                <span>Page URL slug</span>
                <input
                  className={styles.visibilityTextInput}
                  value={pageSlug}
                  onChange={(event) => {
                    setPageSlug(event.target.value);
                    onPageSlugEdited?.();
                  }}
                  onBlur={onPageSlugBlur}
                />
              </label>
            )}
            {pageSlugError && (
              <p className={styles.visibilityCardText}>{pageSlugError}</p>
            )}
          </>
        ) : (
          <p className={styles.visibilityCardText}>{link.emptyMessage}</p>
        )}
      </div>

      <div className={styles.visibilityOverviewCard}>
        <h3 className={styles.visibilityCardTitle}>
          Want more placement options?
        </h3>
        {placementOptions.map((option) => (
          <div key={option.title} className={styles.visibilitySetupPanel}>
            <div>
              <h4 className={styles.visibilitySetupTitle}>{option.title}</h4>
              <p className={styles.visibilityCardText}>
                {option.description}
              </p>
            </div>
            <button
              type="button"
              className={
                option.variant === "primary"
                  ? styles.visibilityPrimaryAction
                  : styles.visibilitySecondaryAction
              }
              onClick={option.onAction}
            >
              {option.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
