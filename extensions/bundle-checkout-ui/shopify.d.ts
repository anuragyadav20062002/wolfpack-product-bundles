import '@shopify/ui-extensions';

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
