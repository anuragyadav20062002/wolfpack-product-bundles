export type SettingsCardId = "design" | "language" | "controls";

export type SettingsCard = {
  id: SettingsCardId;
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
};

export type RecoveredField = {
  label: string;
  value?: string;
  kind?: "color" | "text" | "number" | "select" | "toggle" | "css" | "script";
  note?: string;
  description?: string;
  options?: string[];
  state?: string;
  group?: string;
};

export type RecoveredTab = {
  title: string;
  description: string;
  contentTitle?: string;
  contentDescription?: string;
  fields: RecoveredField[];
};

export type SettingsPanel = {
  title: string;
  description: string;
  bullets: string[];
};

export type LanguageConfiguration = {
  enabled: boolean;
  selectedLanguage: string;
  supportedLanguages: string[];
  sharedCartFields: RecoveredField[];
  templateSections: string[];
  productCardFields: RecoveredField[];
};

export type ControlsLayout = {
  id: "landing-page" | "product-page";
  label: string;
  description: string;
  tabs: RecoveredTab[];
};

export type IntegrationCard = {
  id: string;
  title: string;
  description: string;
  logoLabel: string;
  logoUrl?: string;
  status: "Setup guide" | "Chat setup" | "Custom request";
  ctaLabel: string;
  ctaType: "guide" | "chat" | "request";
  guideSummary: string[];
};

export type IntegrationCategory = {
  id: string;
  title: string;
  description: string;
  cards: IntegrationCard[];
};

export const SETTINGS_CARDS: SettingsCard[] = [
  {
    id: "design",
    title: "Design",
    description: "Modify and customize all design elements of the bundle here",
    icon: "edit",
    actionLabel: "Configure",
  },
  {
    id: "language",
    title: "Language",
    description: "Configure all text, labels, and translations for your bundle here",
    icon: "globe",
    actionLabel: "Configure",
  },
  {
    id: "controls",
    title: "Controls",
    description: "Change loading screen gif, add custom CSS, modify checkout settings and more",
    icon: "filter",
    actionLabel: "Configure",
  },
];

export const SETTINGS_PANELS: Record<SettingsCardId, SettingsPanel> = {
  design: {
    title: "Design control panel",
    description: "Recovered settings from the deployed design configuration surface.",
    bullets: [
      "Brand colors control primary, button text, primary text, secondary background, and product card background colors.",
      "Typography is split between primary, secondary, and body text tokens with size and weight controls.",
      "Corners expose separate bundle button and product-card/cart radius values.",
      "Images and GIFs configure product image fit plus loading media for bundle and checkout states.",
    ],
  },
  language: {
    title: "Language configurations",
    description: "Recovered multilingual and text-template configuration surface.",
    bullets: [
      "Multilingual configuration is enabled and defaults to English.",
      "Cart and checkout shared labels include bundle contains, original price, and cart discount display labels.",
      "Template text is grouped into product card, bundle cart, bundle, popups, toasts, addons, and messages.",
      "Product card copy includes the add-to-bundle action label.",
    ],
  },
  controls: {
    title: "Additional configurations",
    description: "Recovered layout-specific behavior controls and integration callback settings.",
    bullets: [
      "Landing Page Layout and Product Page Layout expose different configuration sets.",
      "Controls are grouped into Configuration, CSS & Scripts, Integrations, and Advanced tabs.",
      "Checkout and cart behavior is configured through explicit target redirects or callback functions.",
      "Theme-page CSS and scripts are configured from this surface rather than from each integration card.",
    ],
  },
};

export const SUPPORTED_LANGUAGE_LABELS = [
  "English",
  "Arabic",
  "Bulgarian (BG)",
  "Catalan",
  "Chinese (CN)",
  "Chinese (TW)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "Estonian",
  "Finnish",
  "French",
  "Georgian",
  "German",
  "Greek",
  "Hebrew",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Norwegian Bokmal",
  "Polish",
  "Portuguese (BR)",
  "Portuguese (PT)",
  "Romanian",
  "Russian",
  "Slovak (SK)",
  "Slovenian (SI)",
  "Spanish",
  "Swedish",
  "Thai",
  "Turkish",
  "Vietnamese",
  "Norwegian",
];

export const DESIGN_CONFIGURATION: RecoveredTab[] = [
  {
    title: "Brand Colors",
    description: "Global brand colors used by bundle cards, summary, buttons, and supporting surfaces.",
    fields: [
      { label: "Primary Color", value: "#000000", kind: "color" },
      { label: "Button Text Color", value: "#ffffff", kind: "color" },
      { label: "Primary Text Color", value: "#000000", kind: "color" },
      { label: "Secondary Color", value: "#eeeeee", kind: "color" },
      { label: "Product Background Color", value: "#ffffff", kind: "color" },
    ],
  },
  {
    title: "Typography",
    description: "Recovered text token defaults for primary, secondary, and body labels.",
    fields: [
      { label: "Primary Font Size", value: "16", kind: "number" },
      { label: "Primary Font Weight", value: "Bold", kind: "select" },
      { label: "Secondary Font Size", value: "14", kind: "number" },
      { label: "Secondary Font Weight", value: "Bold", kind: "select" },
      { label: "Body Font Size", value: "14", kind: "number" },
      { label: "Body Font Weight", value: "Regular", kind: "select" },
    ],
  },
  {
    title: "Corners",
    description: "Recovered radius controls for bundle buttons and product card/cart shells.",
    fields: [
      { label: "Bundle Buttons Base", value: "5px", kind: "number" },
      { label: "Product Card & Cart Base", value: "10px", kind: "number" },
    ],
  },
  {
    title: "Images & GIFs",
    description: "Recovered image-fit and loading-media controls.",
    fields: [
      { label: "Image Fit", value: "Cover", kind: "select" },
      { label: "Bundle Loading GIF", value: "Loading_Spinner.gif", kind: "text" },
      { label: "Checkout GIF", value: "Loading_Spinner_Checkout.gif", kind: "text" },
    ],
  },
];

export const LANGUAGE_CONFIGURATION: LanguageConfiguration = {
  enabled: true,
  selectedLanguage: "English",
  supportedLanguages: SUPPORTED_LANGUAGE_LABELS,
  sharedCartFields: [
    { label: "Bundle Contains Label", value: "Items", kind: "text" },
    { label: "Bundle Original Price Label", value: "Retail Price", kind: "text" },
    { label: "Bundle Cart Discount Display Label", value: "You Save", kind: "text" },
  ],
  templateSections: ["Product Card", "Bundle Cart", "Bundle", "Popups", "Toasts", "Addons", "Messages"],
  productCardFields: [
    { label: "Clear Selection", value: "Clear Selection", kind: "text" },
    { label: "Search Label", value: "Search", kind: "text" },
    { label: "Add Product to Bundle Button", value: "Add To Box", kind: "text", description: "Deployed key label: Add To Box Button." },
    { label: "Choose Options Button", value: "Choose Options", kind: "text" },
    { label: "Load More Products Button", value: "Load More Products", kind: "text" },
    { label: "Loading Checkout Button", value: "Loading Checkout", kind: "text" },
  ],
};

export const CONTROL_LAYOUTS: ControlsLayout[] = [
  {
    id: "landing-page",
    label: "Landing Page Layout",
    description: "Full-page bundle controls recovered from the deployed Additional Configurations surface.",
    tabs: [
      {
        title: "Configuration",
        description: "Landing-page bundle behavior toggles and checkout/cart flow controls.",
        contentTitle: "Bundle Settings",
        contentDescription: "Additional bundle level settings applicable to all bundles created",
        fields: [
          { label: "Show Compare At Price", kind: "toggle", value: "Checked", group: "Bundle Settings" },
          { label: "Hide Irrelevant variant images", kind: "toggle", group: "Bundle Settings" },
          { label: "Track inventory on Add To Cart (in beta)", kind: "toggle", group: "Bundle Settings", description: "Know More" },
          { label: "Redirect Collection Page 'Quick Add' to Bundle", value: "Checked", kind: "toggle", group: "Bundle Settings" },
          { label: "Cart Messaging", kind: "text", group: "Cart Messaging", description: "Edit Language" },
          { label: "Bundle Items", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows the individual items within a bundle" },
          { label: "Original Bundle Price", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows the retail price before bundle discount" },
          { label: "Discount Display", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows how much the customer is saving on the bundle" },
          {
            label: "Discount format",
            group: "Cart Messaging",
            value: "Amount and percentage (Eg: \"You save $73.00 (19%)\")",
            kind: "select",
            options: [
              "Amount and percentage (Eg: \"You save $73.00 (19%)\")",
              "Amount only (Eg: \"You save $73.00\")",
              "Percentage only (Eg: \"You save 19%\")",
            ],
          },
          {
            label: "Checkout Settings",
            group: "Checkout Settings",
            value: "Redirect to Checkout",
            kind: "select",
            description: "Customize the checkout behavior for all the bundle flows",
            options: ["Redirect to Checkout", "Redirect to Cart"],
          },
          { label: "Execute Script", kind: "script", group: "Checkout Settings" },
          { label: "Font Settings", kind: "text", group: "Font Settings", description: "Customize the font of the bundle builder." },
          { label: "Custom Font", kind: "text", group: "Font Settings", description: "Note: By default, your storefront theme font will be picked." },
        ],
      },
      {
        title: "CSS & Scripts",
        description: "Theme-page custom CSS and custom scripts used by theme and integration fixes.",
        contentTitle: "CSS",
        contentDescription: "JavaScript & Selectors",
        fields: [
          { label: "Custom CSS for bundle builder pages", kind: "css", group: "CSS", description: "The CSS written here will be applied to bundle builder pages." },
          { label: "Custom CSS for bundle dummy product page", kind: "css", group: "CSS", description: "The CSS written here will be applied to bundle dummy product page." },
          { label: "Custom CSS for theme pages", kind: "css", group: "CSS", description: "The CSS written here will have a global impact on all store pages. Please choose classes carefully." },
          { label: "Custom JS Bundle Script", kind: "script", group: "JavaScript & Selectors", description: "Script, written here, would be applied only on bundle pages." },
          { label: "Button Selectors", kind: "text", group: "JavaScript & Selectors", description: "CSS selectors for buttons" },
          { label: "Add to Cart Button Selectors", kind: "text", group: "JavaScript & Selectors" },
          { label: "Buy now button", kind: "text", group: "JavaScript & Selectors" },
        ],
      },
      {
        title: "Integrations",
        description: "Callback and redirect integration settings for checkout apps, side carts, and cart drawers.",
        contentTitle: "Integrate JS with custom elements from the store theme",
        contentDescription: "The script written here will exclusively apply to theme pages and will not affect bundle pages.",
        fields: [
          { label: "Enable Custom Theme Integration Script", kind: "toggle", group: "Integrate JS with custom elements from the store theme" },
          { label: "Custom Theme Integration Script", kind: "script", group: "Integrate JS with custom elements from the store theme" },
          {
            label: "Integrate JS bundle script with Cart page",
            kind: "text",
            group: "Cart page integration",
            description: "Hide qty selector, overwrite remove button & show pop when remove button is clicked",
          },
          {
            label: "Enable Cart Integration",
            kind: "toggle",
            group: "Cart page integration",
            description: "Block for Hiding Qty Selector and Overwriting Remove Button for Bundle Products in Cart: Prevents individual quantity increase for bundle items and enforces removal of all bundle products if one is removed",
          },
          { label: "Cart Item Selectors", kind: "text", group: "Cart page integration", description: "Note: This section is only for developers." },
          { label: "Cart Item Remove Parent Selectors", kind: "text", group: "Cart page integration" },
          { label: "Cart Item Remove Selectors", kind: "text", group: "Cart page integration" },
          { label: "Cart Item Quantity Button Selectors", kind: "text", group: "Cart page integration" },
          { label: "Custom Cart Integration Script", kind: "script", group: "Cart page integration" },
          { label: "Integrate with Judge Me", kind: "text", group: "Integrate with Judge Me", description: "Show reviews on product cards through integration with judgeme" },
          { label: "Enable Judge Me Integration", kind: "toggle", group: "Integrate with Judge Me" },
          { label: "Public token", kind: "text", group: "Integrate with Judge Me" },
        ],
      },
      {
        title: "Advanced",
        description: "Advanced display and runtime behavior settings recovered from deployed controls.",
        contentTitle: "Video Player Page Settings",
        contentDescription: "Customize the video player page of the bundle video message",
        fields: [
          { label: "Logo", kind: "text", group: "Video Player Page Settings", description: "Default no-logo image" },
          { label: "Background Color", value: "#ffffff", kind: "color", group: "Video Player Page Settings" },
          { label: "Upload file", kind: "text", group: "Video Player Page Settings" },
          { label: "Update Image", kind: "text", group: "Video Player Page Settings" },
        ],
      },
    ],
  },
  {
    id: "product-page",
    label: "Product Page Layout",
    description: "Product-page bundle controls recovered from the deployed Additional Configurations surface.",
    tabs: [
      {
        title: "Configuration",
        description: "Product-page bundle behavior toggles and redirect controls.",
        contentTitle: "Bundle Settings",
        contentDescription: "Additional bundle level settings applicable to all bundles created",
        fields: [
          { label: "Hide Out Of Stock Products", kind: "toggle", value: "Checked", group: "Bundle Settings" },
          { label: "Track inventory on Add To Cart (in beta)", kind: "toggle", group: "Bundle Settings" },
          { label: "Add bundle to cart after the last step is completed", kind: "toggle", group: "Bundle Settings" },
          { label: "Display empty state boxes based on bundle condition", kind: "toggle", value: "Checked", group: "Bundle Settings" },
          { label: "Hide Step Titles in completed state", kind: "toggle", group: "Bundle Settings" },
          { label: "Add to cart when product card is clicked", kind: "toggle", value: "Checked", group: "Bundle Settings" },
          { label: "Redirect Collection Page 'Quick Add' to Bundle", value: "Checked", kind: "toggle", group: "Bundle Settings" },
          { label: "Cart Messaging", kind: "text", group: "Cart Messaging", description: "Edit Language" },
          { label: "Bundle Items", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows the individual items within a bundle" },
          { label: "Original Bundle Price", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows the retail price before bundle discount" },
          { label: "Discount Display", kind: "toggle", value: "Checked", group: "Cart Messaging", description: "Shows how much the customer is saving on the bundle" },
          {
            label: "Discount format",
            group: "Cart Messaging",
            value: "Amount and percentage (Eg: \"You save $73.00 (19%)\")",
            kind: "select",
            options: [
              "Amount and percentage (Eg: \"You save $73.00 (19%)\")",
              "Amount only (Eg: \"You save $73.00\")",
              "Percentage only (Eg: \"You save 19%\")",
            ],
          },
          {
            label: "Redirect Settings",
            group: "Redirect Settings",
            value: "Execute Default Side Cart Update",
            kind: "select",
            description: "Customize the redirect on Add to cart",
            options: ["Execute Default Side Cart Update", "Redirect to Checkout", "Redirect to Cart"],
          },
          { label: "Execute Script", kind: "script", group: "Redirect Settings" },
        ],
      },
      {
        title: "CSS & Scripts",
        description: "Product-page custom CSS, script, and selector configuration.",
        contentTitle: "CSS",
        contentDescription: "JavaScript & Selectors",
        fields: [
          { label: "Custom CSS for Mix And Match Bundles", kind: "css", group: "CSS", description: "The CSS written here will be applied to all product page bundles." },
          { label: "Execute Custom Script", kind: "script", group: "JavaScript & Selectors", description: "The Script written here will be applied after product page load" },
          { label: "Selectors", kind: "text", group: "JavaScript & Selectors", description: "Configure Advanced options for Side cart and Cart Page" },
          { label: "Side cart selector", kind: "text", group: "JavaScript & Selectors" },
          { label: "Side cart section ID", kind: "text", group: "JavaScript & Selectors" },
          { label: "Cart page items selector", kind: "text", group: "JavaScript & Selectors" },
          { label: "Cart page items section ID", kind: "text", group: "JavaScript & Selectors" },
          { label: "Side cart open button selector", kind: "text", group: "JavaScript & Selectors" },
          { label: "Product page price selector", kind: "text", group: "JavaScript & Selectors" },
        ],
      },
    ],
  },
];

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    id: "inventory-preorders",
    title: "Pre-orders, Pickup & Delivery",
    description: "Let customers pre-order or schedule pickup and delivery for bundled products.",
    cards: [
      {
        id: "stoq",
        title: "Stoq",
        description: "Pre-order out-of-stock items within your bundles",
        logoLabel: "Stoq",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Stoq.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Configure pre-order behavior in the pre-order app for the products that can appear in the bundle.",
          "Sync products or collections after external setup so the bundle builder can use the updated product state.",
          "Keep bundle product visibility and purchase constraints aligned with the external pre-order rules.",
        ],
      },
      {
        id: "zapiet",
        title: "Zapiet",
        description: "Schedule store pickup & delivery for bundle orders",
        logoLabel: "Zapiet",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Zapiet.avif",
        status: "Chat setup",
        ctaLabel: "View Setup",
        ctaType: "chat",
        guideSummary: [
          "The deployed flow starts a support chat instead of opening a static setup article.",
          "Treat setup as merchant-specific because delivery and pickup routing depends on the store configuration.",
        ],
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    description: "Enable recurring purchases so customers can subscribe to their favorite bundles.",
    cards: [
      {
        id: "skio",
        title: "Skio",
        description: "Add subscription selling plans to bundled products",
        logoLabel: "Skio",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Skio.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Create one external subscription plan that includes every product that can appear in the bundle.",
          "Name the plan, configure subscription frequency/options, and save it in the subscription app.",
          "Return to the bundle app, sync collections, open the bundle, select Subscription, choose the synced plan, and save.",
        ],
      },
      {
        id: "appstle",
        title: "Appstle",
        description: "Enable subscribe-and-save options on your bundles",
        logoLabel: "Appstle",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Appstle.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Create one external subscription plan that includes every product that can appear in the bundle.",
          "Name the plan, configure subscription frequency/options, and save it in the subscription app.",
          "Return to the bundle app, sync collections, open the bundle, select Subscription, choose the synced plan, and save.",
        ],
      },
      {
        id: "bold",
        title: "Bold",
        description: "Set up recurring bundle subscriptions via Bold",
        logoLabel: "Bold",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Bold.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Create one external subscription plan that includes every product that can appear in the bundle.",
          "Name the plan, configure subscription frequency/options, and save it in the subscription app.",
          "Return to the bundle app, sync collections, open the bundle, select Subscription, choose the synced plan, and save.",
        ],
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    description: "Show social proof by displaying product ratings within your bundles.",
    cards: [
      {
        id: "judgeme",
        title: "Judge.me",
        description: "Display star ratings and reviews on your bundles",
        logoLabel: "Judge.me",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Judgeme.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Open Settings, then Controls, then the app configuration area for custom theme-page CSS.",
          "Add a small CSS override that restores review badge text visibility on bundle theme pages.",
          "This setup belongs in Controls > CSS & Scripts, not in a separate API credential flow.",
        ],
      },
    ],
  },
  {
    id: "page-builders",
    title: "Page Builders",
    description: "Build custom landing pages and sections to showcase your bundles.",
    cards: [
      {
        id: "pagefly",
        title: "PageFly",
        description: "Create custom landing pages to showcase bundles",
        logoLabel: "PageFly",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Pagefly.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Use the product-page bundle wrapper when embedding on a product page.",
          "On non-product pages, configure the parent product handle before loading the product-page bundle assets.",
          "This maps to Bundle Embed and Product Page Layout behavior rather than a standalone connection toggle.",
        ],
      },
      {
        id: "gempages",
        title: "GemPages",
        description: "Build high-converting pages for your bundle store",
        logoLabel: "GemPages",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Gempages.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Use the product-page bundle wrapper when embedding on a product page.",
          "On non-product pages, configure the parent product handle before loading the product-page bundle assets.",
          "This maps to Bundle Embed and Product Page Layout behavior rather than a standalone connection toggle.",
        ],
      },
    ],
  },
  {
    id: "checkout-side-cart",
    title: "Checkout",
    description: "Ensure bundles work smoothly through native and third-party checkout flows.",
    cards: [
      {
        id: "gokwik",
        title: "Gokwik",
        description: "Streamlined Indian checkout experience for bundles",
        logoLabel: "Gokwik",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Gokwik.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Configure a checkout callback that runs after bundle add-to-cart succeeds.",
          "Use the callback to pass control to the downstream checkout app instead of the default checkout redirect.",
          "If the downstream checkout needs discount state, persist the discount before opening the checkout app.",
        ],
      },
      {
        id: "shopflo",
        title: "Shopflo",
        description: "Optimized Indian checkout flow with bundle support",
        logoLabel: "Shopflo",
        logoUrl: "https://d3ks0ngva6go34.cloudfront.net/public/Shopflo.avif",
        status: "Setup guide",
        ctaLabel: "View Setup",
        ctaType: "guide",
        guideSummary: [
          "Configure a checkout callback that runs after bundle add-to-cart succeeds.",
          "Use the callback to pass control to the downstream checkout app instead of the default checkout redirect.",
          "Side-cart integrations should refresh or open the cart drawer after bundle add-to-cart succeeds.",
        ],
      },
    ],
  },
];

export function getIntegrationCardCount(categories: IntegrationCategory[] = INTEGRATION_CATEGORIES) {
  return categories.reduce((total, category) => total + category.cards.length, 0);
}
