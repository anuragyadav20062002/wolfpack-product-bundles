export type DashboardMediaStateInput = {
  isHydrated: boolean;
};

export type DashboardMediaState = {
  loadAppEmbedImage: boolean;
};

export type DashboardInitialImagePreload = {
  href: string;
  imageSizes: string;
  imageSrcSet: string;
  type: "image/avif";
};

export function getDashboardMediaState({
  isHydrated,
}: DashboardMediaStateInput): DashboardMediaState {
  return {
    loadAppEmbedImage: isHydrated,
  };
}

export function getDashboardInitialImagePreloads(): DashboardInitialImagePreload[] {
  return [
    {
      href: "/Parth.avif",
      imageSizes: "120px",
      imageSrcSet: "/Parth.avif 120w",
      type: "image/avif",
    },
  ];
}

export function shouldRenderDashboardResourceCard({
  hasMainContentSettled,
}: {
  hasMainContentSettled: boolean;
}) {
  return hasMainContentSettled;
}
