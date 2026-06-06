export interface ProductPageLayoutBundleSettingRow {
  label: string;
  checked: boolean;
  visualOnly: true;
}

export const PRODUCT_PAGE_LAYOUT_BUNDLE_SETTING_ROWS: ProductPageLayoutBundleSettingRow[] = [
  { label: "Hide Out Of Stock Products", checked: true, visualOnly: true },
  { label: "Track inventory on Add To Cart (in beta)", checked: false, visualOnly: true },
  { label: "Add bundle to cart after the last step is completed", checked: false, visualOnly: true },
  { label: "Display empty state boxes based on bundle condition", checked: true, visualOnly: true },
  { label: "Hide Step Titles in completed state", checked: false, visualOnly: true },
  { label: "Add to cart when product card is clicked", checked: true, visualOnly: true },
  { label: "Redirect Collection Page 'Quick Add' to Bundle", checked: true, visualOnly: true },
];
