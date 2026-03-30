/**
 * Widget Installation Types
 *
 * Type definitions for widget installation service.
 */

export interface WidgetInstallationStatus {
  installed: boolean;
  themeId?: string;
  themeName?: string;
  lastChecked: Date;
}

export interface ThemeEditorDeepLink {
  url: string;
  template: string;
  bundleId?: string;
}

export interface FullPageBundleResult {
  success: boolean;
  pageId?: string;
  pageHandle?: string;
  pageUrl?: string;
  shareablePreviewUrl?: string;
  widgetInstallationRequired?: boolean;
  widgetInstallationLink?: string;
  slugAdjusted?: boolean;
  error?: string;
  errorType?: 'page_creation_failed' | 'metafield_failed' | 'widget_not_installed' | 'unknown';
}

export interface ProductBundleWidgetStatus {
  widgetInstalled: boolean;
  installationLink?: string;
  productUrl?: string;
  configurationLink?: string;
  message: string;
  requiresOneTimeSetup: boolean;
}

