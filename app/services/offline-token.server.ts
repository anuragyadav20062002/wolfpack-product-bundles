import { Session } from "@shopify/shopify-api";
import type { PrismaClient } from "@prisma/client";
import { AppLogger } from "../lib/logger";

const OFFLINE_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
const TOKEN_ENDPOINT_PATH = "/admin/oauth/access_token";
const OFFLINE_TOKEN_TYPE = "urn:shopify:params:oauth:token-type:offline-access-token";
const ID_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:id_token";
const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";

type SessionStorageSync = {
  storeSession(session: Session): Promise<boolean>;
};

export type OfflineSessionRecord = {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string | null;
  expires: Date | null;
  accessToken: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  storefrontAccessToken?: string | null;
};

type OfflineTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope?: string;
};

function getTokenEndpoint(shop: string) {
  return `https://${shop}${TOKEN_ENDPOINT_PATH}`;
}

function getOfflineSessionId(shop: string) {
  return `offline_${shop}`;
}

function getRequiredAppCredentials() {
  const clientId = process.env.SHOPIFY_API_KEY;
  const clientSecret = process.env.SHOPIFY_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
  }

  return { clientId, clientSecret };
}

function buildOfflineSession(record: OfflineSessionRecord) {
  const session = new Session({
    id: record.id,
    shop: record.shop,
    state: record.state,
    isOnline: false,
    scope: record.scope ?? undefined,
    expires: record.expires ?? undefined,
    accessToken: record.accessToken,
  });

  (session as Session & { refreshToken?: string; refreshTokenExpiresAt?: Date }).refreshToken =
    record.refreshToken ?? undefined;
  (session as Session & { refreshTokenExpiresAt?: Date }).refreshTokenExpiresAt =
    record.refreshTokenExpiresAt ?? undefined;

  return session;
}

async function requestOfflineToken(
  shop: string,
  params: Record<string, string>,
): Promise<OfflineTokenResponse> {
  const { clientId, clientSecret } = getRequiredAppCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...params,
  });

  const response = await fetch(getTokenEndpoint(shop), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    const error = payload?.error_description || payload?.error || response.statusText;
    throw new Error(`Offline token request failed: ${response.status} ${error}`);
  }

  return payload as OfflineTokenResponse;
}

async function persistOfflineTokenResponse(
  prisma: PrismaClient,
  record: OfflineSessionRecord,
  tokenResponse: OfflineTokenResponse,
  storage: SessionStorageSync,
) {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  const refreshTokenExpiresAt = new Date(
    Date.now() + tokenResponse.refresh_token_expires_in * 1000,
  );

  const updatedRecord: OfflineSessionRecord = {
    ...record,
    accessToken: tokenResponse.access_token,
    expires: expiresAt,
    scope: tokenResponse.scope ?? record.scope,
    refreshToken: tokenResponse.refresh_token,
    refreshTokenExpiresAt,
  };

  await prisma.session.upsert({
    where: { id: record.id },
    update: {
      accessToken: updatedRecord.accessToken,
      expires: updatedRecord.expires,
      scope: updatedRecord.scope,
      refreshToken: updatedRecord.refreshToken,
      refreshTokenExpiresAt: updatedRecord.refreshTokenExpiresAt,
    },
    create: {
      id: updatedRecord.id,
      shop: updatedRecord.shop,
      state: updatedRecord.state,
      isOnline: false,
      scope: updatedRecord.scope,
      expires: updatedRecord.expires,
      accessToken: updatedRecord.accessToken,
      refreshToken: updatedRecord.refreshToken,
      refreshTokenExpiresAt: updatedRecord.refreshTokenExpiresAt,
      storefrontAccessToken: updatedRecord.storefrontAccessToken ?? null,
    },
  });

  await storage.storeSession(buildOfflineSession(updatedRecord));

  return updatedRecord;
}

export function shouldRefreshOfflineSession(record: OfflineSessionRecord) {
  if (!record.refreshToken || !record.expires) return false;
  return record.expires.getTime() - OFFLINE_REFRESH_LEEWAY_MS <= Date.now();
}

export async function refreshOfflineSession(
  prisma: PrismaClient,
  record: OfflineSessionRecord,
  storage: SessionStorageSync,
) {
  if (!record.refreshToken) {
    throw new Error(`Offline session for ${record.shop} has no refresh token`);
  }

  if (
    record.refreshTokenExpiresAt &&
    record.refreshTokenExpiresAt.getTime() <= Date.now()
  ) {
    throw new Error(`Offline session refresh token expired for ${record.shop}`);
  }

  AppLogger.info("[OFFLINE_TOKEN] Refreshing expiring offline session", {
    component: "offline-token.server",
    shop: record.shop,
  });

  const tokenResponse = await requestOfflineToken(record.shop, {
    grant_type: "refresh_token",
    refresh_token: record.refreshToken,
  });

  return persistOfflineTokenResponse(prisma, record, tokenResponse, storage);
}

export async function migrateOfflineSessionToExpiring(
  prisma: PrismaClient,
  record: OfflineSessionRecord,
  storage: SessionStorageSync,
) {
  AppLogger.info("[OFFLINE_TOKEN] Migrating offline session to expiring token", {
    component: "offline-token.server",
    shop: record.shop,
  });

  const tokenResponse = await requestOfflineToken(record.shop, {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: record.accessToken,
    subject_token_type: OFFLINE_TOKEN_TYPE,
    requested_token_type: OFFLINE_TOKEN_TYPE,
    expiring: "1",
  });

  return persistOfflineTokenResponse(prisma, record, tokenResponse, storage);
}

export async function acquireExpiringOfflineSessionFromIdToken(
  prisma: PrismaClient,
  shop: string,
  idToken: string,
  storage: SessionStorageSync,
) {
  AppLogger.info("[OFFLINE_TOKEN] Acquiring expiring offline session from ID token", {
    component: "offline-token.server",
    shop,
  });

  const tokenResponse = await requestOfflineToken(shop, {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: idToken,
    subject_token_type: ID_TOKEN_TYPE,
    requested_token_type: OFFLINE_TOKEN_TYPE,
    expiring: "1",
  });

  return persistOfflineTokenResponse(prisma, {
    id: getOfflineSessionId(shop),
    shop,
    state: "",
    isOnline: false,
    scope: tokenResponse.scope ?? null,
    expires: null,
    accessToken: "",
    refreshToken: null,
    refreshTokenExpiresAt: null,
    storefrontAccessToken: null,
  }, tokenResponse, storage);
}

export async function ensureShopHasExpiringOfflineSession(
  prisma: PrismaClient,
  shop: string,
  storage: SessionStorageSync,
  options: { idToken?: string | null } = {},
) {
  const record = await getOfflineSessionForShop(prisma, shop, storage, {
    migrateIfNeeded: false,
    refreshIfNeeded: false,
  });

  if (!record) {
    if (options.idToken) {
      try {
        return await acquireExpiringOfflineSessionFromIdToken(
          prisma,
          shop,
          options.idToken,
          storage,
        );
      } catch (error) {
        AppLogger.error("[OFFLINE_TOKEN] Failed to acquire expiring offline session", {
          component: "offline-token.server",
          shop,
        }, error as Error);
        return null;
      }
    }

    AppLogger.warn("[OFFLINE_TOKEN] No offline session available for migration", {
      component: "offline-token.server",
      shop,
    });
    return null;
  }

  if (record.refreshToken) {
    return record;
  }

  try {
    return await migrateOfflineSessionToExpiring(prisma, record, storage);
  } catch (error) {
    AppLogger.error("[OFFLINE_TOKEN] Failed to migrate offline session", {
      component: "offline-token.server",
      shop,
    }, error as Error);
    return null;
  }
}

type GetOfflineSessionOptions = {
  migrateIfNeeded?: boolean;
  refreshIfNeeded?: boolean;
};

export async function getOfflineSessionForShop(
  prisma: PrismaClient,
  shop: string,
  storage: SessionStorageSync,
  options: GetOfflineSessionOptions = {},
) {
  const record = await prisma.session.findFirst({
    where: {
      shop,
      isOnline: false,
    },
    select: {
      id: true,
      shop: true,
      state: true,
      isOnline: true,
      scope: true,
      expires: true,
      accessToken: true,
      refreshToken: true,
      refreshTokenExpiresAt: true,
      storefrontAccessToken: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!record) {
    return null;
  }

  const migrateIfNeeded = options.migrateIfNeeded ?? true;
  const refreshIfNeeded = options.refreshIfNeeded ?? true;

  if (!record.refreshToken && migrateIfNeeded) {
    try {
      return await migrateOfflineSessionToExpiring(prisma, record, storage);
    } catch (error) {
      AppLogger.error("[OFFLINE_TOKEN] Failed to migrate offline session", {
        component: "offline-token.server",
        shop,
      }, error as Error);
      return null;
    }
  }

  if (refreshIfNeeded && shouldRefreshOfflineSession(record)) {
    try {
      return await refreshOfflineSession(prisma, record, storage);
    } catch (error) {
      AppLogger.error("[OFFLINE_TOKEN] Failed to refresh offline session", {
        component: "offline-token.server",
        shop,
      }, error as Error);
      return null;
    }
  }

  return record;
}
