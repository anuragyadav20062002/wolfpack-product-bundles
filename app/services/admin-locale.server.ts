import db from "../db.server";
import {
  isSupportedLocale,
  normalizeAdminLocale,
  type SupportedLocale,
} from "../i18n/config";

export async function loadShopAdminLocale(shopDomain: string): Promise<SupportedLocale> {
  const shop = await db.shop.findUnique({
    where: { shopDomain },
    select: { adminLocale: true },
  });

  return normalizeAdminLocale(shop?.adminLocale);
}

export async function saveShopAdminLocale(
  shopDomain: string,
  locale: string,
): Promise<SupportedLocale> {
  if (!isSupportedLocale(locale)) {
    throw new Error("Unsupported Admin locale");
  }

  const shop = await db.shop.upsert({
    where: { shopDomain },
    create: { shopDomain, adminLocale: locale },
    update: { adminLocale: locale },
    select: { adminLocale: true },
  });

  return normalizeAdminLocale(shop.adminLocale);
}
