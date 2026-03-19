export type DCPSectionKey =
  | 'globalColors'
  | 'productCard' | 'productCardTypography' | 'button' | 'addedButtonState'
  | 'quantityVariantSelector' | 'searchInput' | 'skeletonLoading' | 'typography'
  | 'footer' | 'footerPrice' | 'footerButton' | 'footerDiscountProgress' | 'quantityBadge'
  | 'headerTabs' | 'headerText'
  | 'emptyState' | 'addToCartButton' | 'toasts' | 'modalCloseButton'
  | 'accessibility' | 'widgetStyle'
  | 'promoBanner' | 'tierPills'
  | 'customCss';

export type DCPGroupKey =
  | 'globalColors' | 'productCard' | 'bundleFooter' | 'bundleHeader'
  | 'general' | 'promoBanner' | 'tierPills' | 'customCss';

export interface DCPSection {
  key: DCPSectionKey;
  label: string;
}

export interface DCPGroup {
  key: DCPGroupKey;
  label: string;
  /** If true, renders as a collapsible group with child sections */
  hasChildren: boolean;
  /** For groups with hasChildren:false, the single section it maps to */
  sectionKey?: DCPSectionKey;
  children?: DCPSection[];
}
