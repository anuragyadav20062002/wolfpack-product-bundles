import { Session } from "@shopify/shopify-api";
import { Prisma, type PrismaClient } from "@prisma/client";
import { AppLogger } from "../lib/logger";

const OFFLINE_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
const OFFLINE_TOKEN_REFRESH_MAX_ATTEMPTS = 2;
const TOKEN_ENDPOINT_PATH = "/admin/oauth/access_token";
const OFFLINE_TOKEN_TYPE = "urn:shopify:params:oauth:token-type:offline-access-token";
const ID_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:id_token";
const TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";

type OfflineTokenPrismaClient = PrismaClient | Prisma.TransactionClient;

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

type OfflineTokenErrorPayload = {
  error?: string;
  error_description?: string;
};

class OfflineTokenRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string | null,
  ) {
    super(message);
  }
}

function getTokenEndpoint(shop: string) {
  return `https://${shop}${TOKEN_ENDPOINT_PATH}`;
}

function getOfflineSessionId(shop: string) {
  return `offline_${shop}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOfflineTokenResponsePayload(value: unknown): value is OfflineTokenResponse {
  return isRecord(value) &&
    typeof value.access_token === "string" &&
    typeof value.expires_in === "number" &&
    typeof value.refresh_token === "string" &&
    typeof value.refresh_token_expires_in === "number";
}

function toOfflineTokenErrorPayload(value: unknown): OfflineTokenErrorPayload {
  if (!isRecord(value)) return {};
  return {
    error: typeof value.error === "string" ? value.error : undefined,
    error_description: typeof value.error_description === "string"
      ? value.error_description
      : undefined,
  };
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
  const maxAttempts = params.grant_type === "refresh_token"
    ? OFFLINE_TOKEN_REFRESH_MAX_ATTEMPTS
    : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestOfflineTokenOnce(shop, params);
    } catch (error) {
      if (attempt >= maxAttempts || !isTransientOfflineTokenRequestError(error)) {
        throw error;
      }

      AppLogger.warn("[OFFLINE_TOKEN] Retrying transient offline token refresh failure", {
        component: "offline-token.server",
        shop,
        attempt,
      }, error as Error);
    }
  }

  throw new Error("Offline token request failed");
}

async function requestOfflineTokenOnce(
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

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || !isOfflineTokenResponsePayload(payload)) {
    const errorPayload = toOfflineTokenErrorPayload(payload);
    const error = errorPayload.error_description ?? errorPayload.error ?? response.statusText;
    throw new OfflineTokenRequestError(
      `Offline token request failed: ${response.status} ${error}`,
      response.status,
      errorPayload.error ?? null,
    );
  }

  return payload;
}

function isTransientOfflineTokenRequestError(error: unknown) {
  if (!(error instanceof OfflineTokenRequestError)) {
    return error instanceof TypeError || (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    );
  }

  return error.status === 429 || (error.status !== null && error.status >= 500);
}

function applyOfflineTokenResponse(
  record: OfflineSessionRecord,
  tokenResponse: OfflineTokenResponse,
) {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  const refreshTokenExpiresAt = new Date(
    Date.now() + tokenResponse.refresh_token_expires_in * 1000,
  );

  return {
    ...record,
    accessToken: tokenResponse.access_token,
    expires: expiresAt,
    scope: tokenResponse.scope ?? record.scope,
    refreshToken: tokenResponse.refresh_token,
    refreshTokenExpiresAt,
  };
}

async function writeOfflineSessionRecord(
  prisma: OfflineTokenPrismaClient,
  updatedRecord: OfflineSessionRecord,
) {
  await prisma.session.upsert({
    where: { id: updatedRecord.id },
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
}

async function withOfflineTokenLock<T>(
  prisma: PrismaClient,
  shop: string,
  operation: "acquire" | "migrate" | "refresh",
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`wpb:offline-token:${shop}`}))`,
    );
    AppLogger.info("[OFFLINE_TOKEN] Acquired offline token lock", {
      component: "offline-token.server",
      shop,
      operation,
    });
    return callback(tx);
  }, {
    maxWait: 10_000,
    timeout: 30_000,
  });
}

async function requestAndPersistWithOfflineTokenLock(
  prisma: PrismaClient,
  record: OfflineSessionRecord,
  storage: SessionStorageSync,
  operation: "acquire" | "migrate" | "refresh",
  requestParams: Record<string, string>,
) {
  const updatedRecord = await withOfflineTokenLock(
    prisma,
    record.shop,
    operation,
    async (tx) => {
      const tokenResponse = await requestOfflineToken(record.shop, requestParams);
      const nextRecord = applyOfflineTokenResponse(record, tokenResponse);
      await writeOfflineSessionRecord(tx, nextRecord);
      return nextRecord;
    },
  );

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

  return requestAndPersistWithOfflineTokenLock(prisma, record, storage, "refresh", {
    grant_type: "refresh_token",
    refresh_token: record.refreshToken,
  });
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

  return requestAndPersistWithOfflineTokenLock(prisma, record, storage, "migrate", {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: record.accessToken,
    subject_token_type: OFFLINE_TOKEN_TYPE,
    requested_token_type: OFFLINE_TOKEN_TYPE,
    expiring: "1",
  });
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

  return requestAndPersistWithOfflineTokenLock(prisma, {
    id: getOfflineSessionId(shop),
    shop,
    state: "",
    isOnline: false,
    scope: null,
    expires: null,
    accessToken: "",
    refreshToken: null,
    refreshTokenExpiresAt: null,
    storefrontAccessToken: null,
  }, storage, "acquire", {
    grant_type: TOKEN_EXCHANGE_GRANT,
    subject_token: idToken,
    subject_token_type: ID_TOKEN_TYPE,
    requested_token_type: OFFLINE_TOKEN_TYPE,
    expiring: "1",
  });
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

  if (record.refreshToken && record.expires && record.refreshTokenExpiresAt) {
    if (shouldRefreshOfflineSession(record)) {
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

  if (record.refreshToken) {
    try {
      return await refreshOfflineSession(prisma, record, storage);
    } catch (error) {
      AppLogger.error("[OFFLINE_TOKEN] Failed to refresh incomplete offline session", {
        component: "offline-token.server",
        shop,
      }, error as Error);
      return null;
    }
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

  if (
    refreshIfNeeded &&
    record.refreshToken &&
    (!record.expires || !record.refreshTokenExpiresAt || shouldRefreshOfflineSession(record))
  ) {
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
