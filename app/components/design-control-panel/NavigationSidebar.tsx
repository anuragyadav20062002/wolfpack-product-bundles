/**
 * Navigation Sidebar Component
 *
 * Left sidebar navigation for the Design Control Panel modal.
 * Driven by config from app/lib/dcp-config — no hardcoded bundle-type conditionals.
 */

import { Text, Divider, Collapsible, Tooltip } from "@shopify/polaris";
import { NavigationItem } from "./NavigationItem";
import type { BundleType } from "../../constants/bundle";
import { getDCPConfig } from "../../lib/dcp-config";

// Base config has 4 groups (globalColors, productCard, bundleFooter, general).
// Any groups beyond index 3 are bundle-type-specific extras (e.g. FPB bundleHeader, promoBanner, tierPills).
const BASE_GROUP_COUNT = 4;

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
  const config = getDCPConfig(bundleType);

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
          Customize
        </Text>
      </div>

      <Divider />

      {config.map((group, index) => {
        const isFirstExtraGroup = index === BASE_GROUP_COUNT;

        return (
          <div key={group.key}>
            {/* Divider after globalColors (index 0) */}
            {index === 1 && <Divider />}

            {/* Divider between FPB-specific groups (bundleHeader, tierPills, promoBanner) and shared base groups */}
            {isFirstExtraGroup && <Divider />}

            {group.hasChildren ? (
              <>
                {group.description ? (
                  <Tooltip content={group.description} dismissOnMouseOut preferredPosition="right">
                    <NavigationItem
                      label={group.label}
                      sectionKey={group.key}
                      hasChildren
                      onClick={() => onToggleSection(group.key)}
                      isExpanded={expandedSection === group.key}
                      isActive={false}
                    />
                  </Tooltip>
                ) : (
                  <NavigationItem
                    label={group.label}
                    sectionKey={group.key}
                    hasChildren
                    onClick={() => onToggleSection(group.key)}
                    isExpanded={expandedSection === group.key}
                    isActive={false}
                  />
                )}
                <Collapsible
                  open={expandedSection === group.key}
                  id={`${group.key}-collapsible`}
                >
                  {(group.children ?? []).map((child) => (
                    child.description ? (
                      <Tooltip key={child.key} content={child.description} dismissOnMouseOut preferredPosition="right">
                        <NavigationItem
                          label={child.label}
                          sectionKey={child.key}
                          isChild
                          onClick={() => onSubSectionClick(child.key)}
                          isActive={activeSubSection === child.key}
                        />
                      </Tooltip>
                    ) : (
                      <NavigationItem
                        key={child.key}
                        label={child.label}
                        sectionKey={child.key}
                        isChild
                        onClick={() => onSubSectionClick(child.key)}
                        isActive={activeSubSection === child.key}
                      />
                    )
                  ))}
                </Collapsible>
              </>
            ) : (
              group.description ? (
                <Tooltip content={group.description} dismissOnMouseOut preferredPosition="right">
                  <NavigationItem
                    label={group.label}
                    sectionKey={group.sectionKey ?? group.key}
                    onClick={() => onSubSectionClick(group.sectionKey ?? group.key)}
                    isExpanded={expandedSection === group.key}
                    isActive={activeSubSection === (group.sectionKey ?? group.key)}
                  />
                </Tooltip>
              ) : (
                <NavigationItem
                  label={group.label}
                  sectionKey={group.sectionKey ?? group.key}
                  onClick={() => onSubSectionClick(group.sectionKey ?? group.key)}
                  isExpanded={expandedSection === group.key}
                  isActive={activeSubSection === (group.sectionKey ?? group.key)}
                />
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
