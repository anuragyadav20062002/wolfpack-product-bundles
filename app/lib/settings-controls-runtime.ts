import { BundleType } from "../constants/bundle";
import {
  normalizeCheckoutIntegrationProvider,
  type CheckoutIntegrationProviderId,
} from "./checkout-integrations";

export const SETTINGS_CONTROLS_BUNDLE_TYPES = [
  BundleType.PRODUCT_PAGE,
  BundleType.FULL_PAGE,
] as const;

type ControlsPayload = Record<string, unknown>;

export type ControlsRedirectAction = "side_cart" | "checkout" | "cart";

function asBoolean(payload: ControlsPayload, label: string, fallback = false) {
  const rawValue = payload[label];
  if (typeof rawValue === "boolean") return rawValue;

  if (typeof rawValue === "string") {
    const normalized = rawValue.trim().toLowerCase();
    if (normalized === "checked" || normalized === "true") return true;
    if (normalized === "unchecked" || normalized === "false" || normalized === "") return false;
  }

  return fallback;
}

function asBooleanFromAlternates(payload: ControlsPayload, labels: string[], fallback: boolean) {
  for (const label of labels) {
    const directValue = payload[label];
    if (directValue !== undefined) {
      return asBoolean(payload, label, fallback);
    }
  }
  return fallback;
}

export type SettingsControlsRuntime = {
  landingPage: {
    showCompareAtPrice: boolean;
    hideIrrelevantVariantImages: boolean;
    trackInventoryOnAddToCart: boolean;
    redirectCollectionQuickAddToBundle: boolean;
    checkout: {
      action: Exclude<ControlsRedirectAction, "side_cart">;
      providerId: CheckoutIntegrationProviderId;
    };
    font: {
      customFont: string;
    };
    css: {
      bundleBuilderPages: string;
      bundleDummyProductPage: string;
      themePages: string;
    };
    integrations: {
      customThemeScriptEnabled: boolean;
      customThemeIntegrationScript: string;
      cartIntegrationEnabled: boolean;
      cartItemSelectors: string;
      cartItemRemoveParentSelectors: string;
      cartItemRemoveSelectors: string;
      cartItemQuantityButtonSelectors: string;
      customCartIntegrationScript: string;
      judgeMeEnabled: boolean;
      judgeMePublicToken: string;
    };
    videoPlayerPage: {
      backgroundColor: string;
      logoUrl: string;
    };
  };
  productPage: {
    hideOutOfStockProducts: boolean;
    trackInventoryOnAddToCart: boolean;
    addBundleToCartAfterLastStepCompleted: boolean;
    showCompareAtPrices: boolean;
    displayEmptyStateBoxesBasedOnBundleCondition: boolean;
    hideStepTitlesInCompletedState: boolean;
    validateConditionsBeforeAddToCart: boolean;
    addToCartWhenProductCardClicked: boolean;
    redirectCollectionQuickAddToBundle: boolean;
    redirect: {
      action: ControlsRedirectAction;
      executeScript: string;
    };
    css: {
      mixAndMatchBundles: string;
      themePages: string;
    };
    scripts: {
      executeCustomScript: string;
    };
    selectors: {
      sideCart: string;
      sideCartSectionId: string;
      cartPageItems: string;
      cartPageItemsSectionId: string;
      sideCartOpenButton: string;
      productPagePrice: string;
    };
  };
};

export type BundleCartLineMessagingRuntime = {
  isEnabled: boolean;
  showBundleContains: boolean;
  showOriginalPrice: boolean;
  discountDisplay: {
    isEnabled: boolean;
    format: "amount_percentage" | "amount_only" | "percentage_only";
  };
};

export type SettingsControlsRuntimeResult = {
  settingsControls: SettingsControlsRuntime;
  bundleCartLineMessaging: BundleCartLineMessagingRuntime;
  fullPageCustomCss: string | null;
  productPageCustomCss: string | null;
};

const value = (payload: ControlsPayload, label: string) => String(payload[label] ?? "").trim();
const checked = (payload: ControlsPayload, label: string) => value(payload, label) === "Checked";
const joinCss = (parts: string[]) => parts.filter(Boolean).join("\n\n") || null;

function getDiscountFormat(payload: ControlsPayload): BundleCartLineMessagingRuntime["discountDisplay"]["format"] {
  const discountFormatValue = value(payload, "Discount format");
  if (discountFormatValue.includes("Amount only")) return "amount_only";
  if (discountFormatValue.includes("Percentage only")) return "percentage_only";
  return "amount_percentage";
}

function getLandingCheckoutAction(payload: ControlsPayload): "checkout" | "cart" {
  return value(payload, "Checkout Settings") === "Redirect to Cart" ? "cart" : "checkout";
}

function getLandingCheckoutProvider(payload: ControlsPayload): CheckoutIntegrationProviderId {
  return normalizeCheckoutIntegrationProvider(value(payload, "Checkout Integration"));
}

function getProductPageRedirectAction(payload: ControlsPayload): ControlsRedirectAction {
  const redirectValue = value(payload, "Redirect Settings");
  if (redirectValue === "Redirect to Checkout") return "checkout";
  if (redirectValue === "Redirect to Cart") return "cart";
  return "side_cart";
}

export function buildSettingsControlsRuntime(payload: ControlsPayload): SettingsControlsRuntimeResult {
  const themePagesCss = value(payload, "Custom CSS for theme pages");
  const fullPageCustomCss = joinCss([
    value(payload, "Custom CSS for bundle builder pages"),
    value(payload, "Custom CSS for bundle dummy product page"),
    themePagesCss,
  ]);
  const productPageCustomCss = joinCss([
    value(payload, "Custom CSS for Mix And Match Bundles"),
    themePagesCss,
  ]);

  const settingsControls: SettingsControlsRuntime = {
    landingPage: {
      showCompareAtPrice: checked(payload, "Show Compare At Price"),
      hideIrrelevantVariantImages: checked(payload, "Hide Irrelevant variant images"),
      trackInventoryOnAddToCart: checked(payload, "Track inventory on Add To Cart (in beta)"),
      redirectCollectionQuickAddToBundle: checked(payload, "Redirect Collection Page 'Quick Add' to Bundle"),
      checkout: {
        action: getLandingCheckoutAction(payload),
        providerId: getLandingCheckoutProvider(payload),
      },
      font: {
        customFont: value(payload, "Custom Font"),
      },
      css: {
        bundleBuilderPages: value(payload, "Custom CSS for bundle builder pages"),
        bundleDummyProductPage: value(payload, "Custom CSS for bundle dummy product page"),
        themePages: themePagesCss,
      },
      integrations: {
        customThemeScriptEnabled: checked(payload, "Enable Custom Theme Integration Script"),
        customThemeIntegrationScript: value(payload, "Custom Theme Integration Script"),
        cartIntegrationEnabled: checked(payload, "Enable Cart Integration"),
        cartItemSelectors: value(payload, "Cart Item Selectors"),
        cartItemRemoveParentSelectors: value(payload, "Cart Item Remove Parent Selectors"),
        cartItemRemoveSelectors: value(payload, "Cart Item Remove Selectors"),
        cartItemQuantityButtonSelectors: value(payload, "Cart Item Quantity Button Selectors"),
        customCartIntegrationScript: value(payload, "Custom Cart Integration Script"),
        judgeMeEnabled: checked(payload, "Enable Judge Me Integration"),
        judgeMePublicToken: value(payload, "Public token"),
      },
      videoPlayerPage: {
        backgroundColor: value(payload, "Background Color") || "#ffffff",
        logoUrl: value(payload, "Logo"),
      },
    },
    productPage: {
      hideOutOfStockProducts: checked(payload, "Hide Out Of Stock Products"),
      trackInventoryOnAddToCart: checked(payload, "Track inventory on Add To Cart (in beta)"),
      showCompareAtPrices: asBooleanFromAlternates(
        payload,
        [
          "showCompareAtPrices",
          "Show Compare At Price",
          "Display Compare At Price",
        ],
        false,
      ),
      addBundleToCartAfterLastStepCompleted: asBooleanFromAlternates(
        payload,
        [
          "Add bundle to cart after the last step is completed",
          "addBundleToCartAfterLastStepCompleted",
          "addBundleToCartOnDone",
        ],
        false,
      ),
      displayEmptyStateBoxesBasedOnBundleCondition: checked(payload, "Display empty state boxes based on bundle condition"),
      hideStepTitlesInCompletedState: checked(payload, "Hide Step Titles in completed state"),
      validateConditionsBeforeAddToCart: asBooleanFromAlternates(
        payload,
        ["Validate conditions before add to cart", "validateConditionsBeforeAddToCart"],
        true,
      ),
      addToCartWhenProductCardClicked: asBooleanFromAlternates(
        payload,
        [
          "Add to cart when product card is clicked",
          "addToBundleOnProductCardClick",
          "addToBundleOnProductCardClicked",
        ],
        false,
      ),
      redirectCollectionQuickAddToBundle: checked(payload, "Redirect Collection Page 'Quick Add' to Bundle"),
      redirect: {
        action: getProductPageRedirectAction(payload),
        executeScript: value(payload, "Execute Script"),
      },
      css: {
        mixAndMatchBundles: value(payload, "Custom CSS for Mix And Match Bundles"),
        themePages: themePagesCss,
      },
      scripts: {
        executeCustomScript: value(payload, "Execute Custom Script"),
      },
      selectors: {
        sideCart: value(payload, "Side cart selector"),
        sideCartSectionId: value(payload, "Side cart section ID"),
        cartPageItems: value(payload, "Cart page items selector"),
        cartPageItemsSectionId: value(payload, "Cart page items section ID"),
        sideCartOpenButton: value(payload, "Side cart open button selector"),
        productPagePrice: value(payload, "Product page price selector"),
      },
    },
  };

  return {
    settingsControls,
    bundleCartLineMessaging: {
      isEnabled: checked(payload, "Cart Messaging"),
      showBundleContains: checked(payload, "Bundle Items"),
      showOriginalPrice: checked(payload, "Original Bundle Price"),
      discountDisplay: {
        isEnabled: checked(payload, "Discount Display"),
        format: getDiscountFormat(payload),
      },
    },
    fullPageCustomCss,
    productPageCustomCss,
  };
}

export function buildSettingsControlsResponse(
  settingsControls: unknown,
  bundleType: BundleType.PRODUCT_PAGE | BundleType.FULL_PAGE,
) {
  const runtime = settingsControls && typeof settingsControls === "object"
    ? settingsControls as SettingsControlsRuntime
    : buildSettingsControlsRuntime({}).settingsControls;
  const activeControls = bundleType === BundleType.FULL_PAGE
    ? runtime.landingPage
    : runtime.productPage;

  return {
    bundleType,
    settingsControls: runtime,
    activeControls,
  };
}
