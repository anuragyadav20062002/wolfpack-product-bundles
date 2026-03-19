import '@shopify/ui-extensions';

// Shopify UI Extensions custom web components used in Checkout.tsx
// Declare these custom elements in the global JSX namespace so both the root
// tsconfig (react-jsx) and the extension tsconfig (preact) accept them.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      's-stack': { [key: string]: any };
      's-text': { [key: string]: any };
      's-divider': { [key: string]: any };
      's-clickable': { [key: string]: any };
    }
  }
}

//@ts-ignore
declare module './src/index.tsx' {
  const shopify:
    | import('@shopify/ui-extensions/purchase.checkout.cart-line-item.render-after').Api
    | import('@shopify/ui-extensions/purchase.thank-you.cart-line-item.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/Checkout.tsx' {
  const shopify:
    | import('@shopify/ui-extensions/purchase.checkout.cart-line-item.render-after').Api
    | import('@shopify/ui-extensions/purchase.thank-you.cart-line-item.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
