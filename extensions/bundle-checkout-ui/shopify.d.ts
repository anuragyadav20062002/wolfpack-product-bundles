import '@shopify/ui-extensions/checkout/preact';

// Declare Polaris web components for JSX
declare namespace preact.JSX {
  interface IntrinsicElements {
    's-stack': any;
    's-text': any;
    's-badge': any;
    's-box': any;
    's-button': any;
    's-heading': any;
    's-divider': any;
    's-banner': any;
    's-icon': any;
    's-image': any;
    's-link': any;
    's-paragraph': any;
    's-spinner': any;
  }
}
