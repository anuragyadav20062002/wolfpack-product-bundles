import { Text, Icon } from "@shopify/polaris";
import { ChevronDownIcon, ChevronRightIcon } from "@shopify/polaris-icons";

interface NavigationItemProps {
  label: string;
  sectionKey: string;
  hasChildren?: boolean;
  isChild?: boolean;
  onClick?: () => void;
  isExpanded?: boolean;
  isActive?: boolean;
}

export function NavigationItem({
  label,
  sectionKey,
  hasChildren = false,
  isChild = false,
  onClick,
  isExpanded = false,
  isActive = false,
}: NavigationItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: isChild ? "8px 16px 8px 36px" : "12px 16px",
        backgroundColor: isActive && isChild ? "#F3F3F3" : "transparent",
        borderLeft: isActive && isChild ? "3px solid #303030" : "3px solid transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text as="span" variant="bodyMd" fontWeight={isChild && isActive ? "semibold" : "regular"}>
        {label}
      </Text>
      {hasChildren && (
        <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} />
      )}
    </div>
  );
}
