type SaveBarApi = {
  leaveConfirmation: () => Promise<void> | void;
};

type ShopifyWithSaveBar = {
  saveBar: SaveBarApi;
};

export async function runAfterSaveBarLeaveConfirmation(
  shopify: ShopifyWithSaveBar,
  navigate: () => void,
) {
  await shopify.saveBar.leaveConfirmation();
  navigate();
}
