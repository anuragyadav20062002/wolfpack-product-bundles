import styles from "./SettingsLandingShell.module.css";

export type SettingsWorkspaceView = "design" | "language" | "controls";

const SETTINGS_SECTIONS: Array<{
  id: SettingsWorkspaceView;
  title: string;
  description: string;
  icon: "edit" | "globe" | "filter";
}> = [
  {
    id: "design",
    title: "Design",
    description: "Modify and customize all design elements of the bundle here",
    icon: "edit",
  },
  {
    id: "language",
    title: "Language",
    description: "Configure all text, labels, and translations for your bundle here",
    icon: "globe",
  },
  {
    id: "controls",
    title: "Controls",
    description: "Change loading screen gif, add custom CSS, modify checkout settings and more",
    icon: "filter",
  },
];

export function SettingsLandingShell({
  onSelect,
  onIntent,
}: {
  onSelect: (view: SettingsWorkspaceView) => void;
  onIntent?: () => void;
}) {
  return (
    <s-page heading="Settings" inlineSize="large">
      <s-query-container containerName="settings-landing">
        <s-grid
          gridTemplateColumns="@container settings-landing (inline-size > 720px) 1fr 1fr 1fr, 1fr"
          gap="base"
        >
          {SETTINGS_SECTIONS.map((section) => (
            <s-clickable
              key={section.id}
              accessibilityLabel={`Open ${section.title} settings`}
              padding="base"
              border="base"
              borderRadius="base"
              onFocus={onIntent}
              onClick={() => onSelect(section.id)}
            >
              <s-stack gap="base">
                <s-icon type={section.icon} size="base" />
                <s-heading>{section.title}</s-heading>
                <s-paragraph color="subdued">{section.description}</s-paragraph>
              </s-stack>
            </s-clickable>
          ))}
        </s-grid>
      </s-query-container>
    </s-page>
  );
}

export function SettingsWorkspaceSkeleton() {
  return (
    <s-page heading="Settings" inlineSize="large">
      <section aria-label="Loading Settings" aria-busy="true" className={styles.skeletonRegion}>
        <s-grid
          gridTemplateColumns="@container settings-loading (inline-size > 720px) 1fr 1fr 1fr, 1fr"
          gap="base"
        >
          {["design", "language", "controls"].map((section) => (
            <s-box key={section} padding="base" border="base" borderRadius="base">
              <div data-settings-skeleton-card="true" aria-hidden="true" className={styles.skeletonCard}>
                <span className={styles.skeletonIcon} />
                <span className={styles.skeletonTitle} />
                <span className={styles.skeletonLine} />
                <span className={styles.skeletonLineShort} />
              </div>
            </s-box>
          ))}
        </s-grid>
      </section>
    </s-page>
  );
}
