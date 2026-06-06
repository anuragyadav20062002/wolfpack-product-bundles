type ParentProductStatusUi = {
  label: "Active" | "Archived" | "Draft" | "Unlisted" | "Unknown";
  tone: "success" | "warning";
  showUnlistedBanner: boolean;
};

export function getParentProductStatusUi(status: string | null | undefined): ParentProductStatusUi {
  switch (String(status ?? "").toUpperCase()) {
    case "ACTIVE":
      return { label: "Active", tone: "success", showUnlistedBanner: false };
    case "ARCHIVED":
      return { label: "Archived", tone: "warning", showUnlistedBanner: false };
    case "DRAFT":
      return { label: "Draft", tone: "warning", showUnlistedBanner: false };
    case "UNLISTED":
      return { label: "Unlisted", tone: "warning", showUnlistedBanner: true };
    default:
      return { label: "Unknown", tone: "warning", showUnlistedBanner: false };
  }
}
