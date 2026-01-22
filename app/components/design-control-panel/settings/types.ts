import type { DesignSettings } from "../../../types/state.types";

/**
 * Common props for all settings panel components.
 * Each component receives the full settings object and an update function.
 */
export interface SettingsComponentProps {
  settings: DesignSettings;
  onUpdate: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
}

/**
 * Props for SettingsPanel orchestrator component
 */
export interface SettingsPanelProps extends SettingsComponentProps {
  activeSubSection: string;
  customCssHelpOpen: boolean;
  setCustomCssHelpOpen: (open: boolean) => void;
}
