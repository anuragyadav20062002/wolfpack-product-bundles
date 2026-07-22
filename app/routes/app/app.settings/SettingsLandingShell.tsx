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

export function SettingsLandingShell({ onSelect }: { onSelect: (view: SettingsWorkspaceView) => void }) {
  return (
    <s-page heading="Settings" inlineSize="large">
      <s-grid
        gridTemplateColumns="@container (inline-size <= 720px) 1fr, repeat(3, minmax(0, 1fr))"
        gap="base"
      >
        {SETTINGS_SECTIONS.map((section) => (
          <s-clickable
            key={section.id}
            accessibilityLabel={`Configure ${section.title}`}
            padding="base"
            border="base"
            borderRadius="base"
            onClick={() => onSelect(section.id)}
          >
            <s-stack gap="base">
              <s-icon type={section.icon} size="base" />
              <s-heading>{section.title}</s-heading>
              <s-paragraph color="subdued">{section.description}</s-paragraph>
              <s-text type="strong">Configure</s-text>
            </s-stack>
          </s-clickable>
        ))}
      </s-grid>
    </s-page>
  );
}
