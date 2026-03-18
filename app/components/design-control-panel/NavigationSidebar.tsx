/**
 * Navigation Sidebar Component
 *
 * Left sidebar navigation for the Design Control Panel modal
 */

import { Text, Divider, Collapsible } from "@shopify/polaris";
import { NavigationItem } from "./NavigationItem";
import { BundleType } from "../../constants/bundle";

interface NavigationSidebarProps {
  bundleType: BundleType;
  expandedSection: string | null;
  activeSubSection: string;
  onToggleSection: (section: string) => void;
  onSubSectionClick: (subSection: string) => void;
}

export function NavigationSidebar({
  bundleType,
  expandedSection,
  activeSubSection,
  onToggleSection,
  onSubSectionClick,
}: NavigationSidebarProps) {
  const isFullPage = bundleType === BundleType.FULL_PAGE;
  return (
    <div
      style={{
        width: "220px",
        minWidth: "220px",
        borderRight: "1px solid #D9D9D9",
        backgroundColor: "#FFFFFF",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "16px" }}>
        <Text as="h3" variant="headingSm">
          Customise
        </Text>
      </div>

      <Divider />

      {/* Global Colors Section */}
      <NavigationItem
        label="Global Colors"
        sectionKey="globalColors"
        onClick={() => onSubSectionClick("globalColors")}
        isExpanded={expandedSection === "globalColors"}
        isActive={activeSubSection === "globalColors"}
      />

      <Divider />

      {/* Product Card Section */}
      <NavigationItem
        label="Product Card"
        sectionKey="productCard"
        hasChildren
        onClick={() => onToggleSection("productCard")}
        isExpanded={expandedSection === "productCard"}
        isActive={false}
      />
      <Collapsible open={expandedSection === "productCard"} id="productCard-collapsible">
        <NavigationItem
          label="Product Card"
          sectionKey="productCard"
          isChild
          onClick={() => onSubSectionClick("productCard")}
          isActive={activeSubSection === "productCard"}
        />
        <NavigationItem
          label="Product Card Typography"
          sectionKey="productCardTypography"
          isChild
          onClick={() => onSubSectionClick("productCardTypography")}
          isActive={activeSubSection === "productCardTypography"}
        />
        <NavigationItem
          label="Button"
          sectionKey="button"
          isChild
          onClick={() => onSubSectionClick("button")}
          isActive={activeSubSection === "button"}
        />
        <NavigationItem
          label="Added State"
          sectionKey="addedButtonState"
          isChild
          onClick={() => onSubSectionClick("addedButtonState")}
          isActive={activeSubSection === "addedButtonState"}
        />
        <NavigationItem
          label="Quantity & Variant Selector"
          sectionKey="quantityVariantSelector"
          isChild
          onClick={() => onSubSectionClick("quantityVariantSelector")}
          isActive={activeSubSection === "quantityVariantSelector"}
        />
        <NavigationItem
          label="Search Input"
          sectionKey="searchInput"
          isChild
          onClick={() => onSubSectionClick("searchInput")}
          isActive={activeSubSection === "searchInput"}
        />
        <NavigationItem
          label="Skeleton Loading"
          sectionKey="skeletonLoading"
          isChild
          onClick={() => onSubSectionClick("skeletonLoading")}
          isActive={activeSubSection === "skeletonLoading"}
        />
        <NavigationItem
          label="Typography"
          sectionKey="typography"
          isChild
          onClick={() => onSubSectionClick("typography")}
          isActive={activeSubSection === "typography"}
        />
      </Collapsible>

      {/* Bundle Footer Section */}
      <NavigationItem
        label="Bundle Footer"
        sectionKey="bundleFooter"
        hasChildren
        onClick={() => onToggleSection("bundleFooter")}
        isExpanded={expandedSection === "bundleFooter"}
        isActive={false}
      />
      <Collapsible open={expandedSection === "bundleFooter"} id="bundleFooter-collapsible">
        <NavigationItem
          label="Footer"
          sectionKey="footer"
          isChild
          onClick={() => onSubSectionClick("footer")}
          isActive={activeSubSection === "footer"}
        />
        <NavigationItem
          label="Price"
          sectionKey="footerPrice"
          isChild
          onClick={() => onSubSectionClick("footerPrice")}
          isActive={activeSubSection === "footerPrice"}
        />
        <NavigationItem
          label="Button"
          sectionKey="footerButton"
          isChild
          onClick={() => onSubSectionClick("footerButton")}
          isActive={activeSubSection === "footerButton"}
        />
        <NavigationItem
          label="Discount Text"
          sectionKey="footerDiscountProgress"
          isChild
          onClick={() => onSubSectionClick("footerDiscountProgress")}
          isActive={activeSubSection === "footerDiscountProgress"}
        />
        <NavigationItem
          label="Quantity Badge"
          sectionKey="quantityBadge"
          isChild
          onClick={() => onSubSectionClick("quantityBadge")}
          isActive={activeSubSection === "quantityBadge"}
        />
      </Collapsible>

      {/* Bundle Header Section */}
      <NavigationItem
        label="Bundle Header"
        sectionKey="bundleHeader"
        hasChildren
        onClick={() => onToggleSection("bundleHeader")}
        isExpanded={expandedSection === "bundleHeader"}
        isActive={false}
      />
      <Collapsible open={expandedSection === "bundleHeader"} id="bundleHeader-collapsible">
        <NavigationItem
          label="Tabs"
          sectionKey="headerTabs"
          isChild
          onClick={() => onSubSectionClick("headerTabs")}
          isActive={activeSubSection === "headerTabs"}
        />
        <NavigationItem
          label="Header Text"
          sectionKey="headerText"
          isChild
          onClick={() => onSubSectionClick("headerText")}
          isActive={activeSubSection === "headerText"}
        />
      </Collapsible>

      {/* General Section */}
      <NavigationItem
        label="General"
        sectionKey="general"
        hasChildren
        onClick={() => onToggleSection("general")}
        isExpanded={expandedSection === "general"}
        isActive={false}
      />
      <Collapsible open={expandedSection === "general"} id="general-collapsible">
        <NavigationItem
          label="Empty State"
          sectionKey="emptyState"
          isChild
          onClick={() => onSubSectionClick("emptyState")}
          isActive={activeSubSection === "emptyState"}
        />
        <NavigationItem
          label="Add to Cart Button"
          sectionKey="addToCartButton"
          isChild
          onClick={() => onSubSectionClick("addToCartButton")}
          isActive={activeSubSection === "addToCartButton"}
        />
        <NavigationItem
          label="Toasts"
          sectionKey="toasts"
          isChild
          onClick={() => onSubSectionClick("toasts")}
          isActive={activeSubSection === "toasts"}
        />
        <NavigationItem
          label="Modal Close Button"
          sectionKey="modalCloseButton"
          isChild
          onClick={() => onSubSectionClick("modalCloseButton")}
          isActive={activeSubSection === "modalCloseButton"}
        />
        <NavigationItem
          label="Accessibility"
          sectionKey="accessibility"
          isChild
          onClick={() => onSubSectionClick("accessibility")}
          isActive={activeSubSection === "accessibility"}
        />
      </Collapsible>

      {isFullPage && <Divider />}

      {/* Promo Banner Section (Full-Page Bundles only) */}
      {isFullPage && (
        <NavigationItem
          label="Promo Banner"
          sectionKey="promoBanner"
          onClick={() => onSubSectionClick("promoBanner")}
          isExpanded={expandedSection === "promoBanner"}
          isActive={activeSubSection === "promoBanner"}
        />
      )}

      {/* Pricing Tier Pills (Full-Page Bundles only) */}
      {isFullPage && (
        <NavigationItem
          label="Pricing Tier Pills"
          sectionKey="tierPills"
          onClick={() => onSubSectionClick("tierPills")}
          isExpanded={expandedSection === "tierPills"}
          isActive={activeSubSection === "tierPills"}
        />
      )}
    </div>
  );
}
