/**
 * Metafield Size Check Utilities
 *
 * Utilities for checking metafield sizes against Shopify limits
 */

import { AppLogger } from "../../../../lib/logger";
import type { MetafieldSizeCheck } from "../types";

// Metafield size constants (Shopify limits)
export const METAFIELD_SIZE_WARNING = 50 * 1024; // 50KB - start warning at this size
export const METAFIELD_SIZE_CRITICAL = 60 * 1024; // 60KB - critical warning
export const METAFIELD_SIZE_LIMIT = 64 * 1024; // 64KB - Shopify's hard limit

/**
 * Check metafield size and log warnings/errors if approaching or exceeding limits
 * Returns size information for monitoring
 */
export function checkMetafieldSize(
  data: any,
  key: string,
  context: string
): MetafieldSizeCheck {
  const jsonString = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf-8');
  const sizeKB = (sizeBytes / 1024).toFixed(2);

  let warningLevel: MetafieldSizeCheck['warningLevel'] = 'none';
  let withinLimit = true;

  if (sizeBytes >= METAFIELD_SIZE_LIMIT) {
    warningLevel = 'exceeded';
    withinLimit = false;
    AppLogger.error(`Metafield exceeds Shopify size limit`, {
      component: 'metafield-sync',
      operation: context,
      key,
      sizeBytes,
      sizeKB,
      limit: METAFIELD_SIZE_LIMIT,
      excessBytes: sizeBytes - METAFIELD_SIZE_LIMIT,
      action: 'WILL_FAIL_TO_SAVE'
    });
  } else if (sizeBytes >= METAFIELD_SIZE_CRITICAL) {
    warningLevel = 'critical';
    AppLogger.warn(`Metafield approaching size limit (critical)`, {
      component: 'metafield-sync',
      operation: context,
      key,
      sizeBytes,
      sizeKB,
      limit: METAFIELD_SIZE_LIMIT,
      remainingBytes: METAFIELD_SIZE_LIMIT - sizeBytes,
      utilizationPercent: ((sizeBytes / METAFIELD_SIZE_LIMIT) * 100).toFixed(1)
    });
  } else if (sizeBytes >= METAFIELD_SIZE_WARNING) {
    warningLevel = 'warning';
    AppLogger.warn(`Metafield size warning`, {
      component: 'metafield-sync',
      operation: context,
      key,
      sizeBytes,
      sizeKB,
      utilizationPercent: ((sizeBytes / METAFIELD_SIZE_LIMIT) * 100).toFixed(1)
    });
  } else {
    // Log info for all metafields for monitoring
    AppLogger.info(`Metafield size check`, {
      component: 'metafield-sync',
      operation: context,
      key,
      sizeBytes,
      sizeKB,
      utilizationPercent: ((sizeBytes / METAFIELD_SIZE_LIMIT) * 100).toFixed(1)
    });
  }

  return {
    size: sizeBytes,
    withinLimit,
    warningLevel
  };
}

/**
 * Helper function to safely parse JSON
 */
export function safeJsonParse<T>(json: any, defaultValue: T): T {
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch (e) {
      return defaultValue;
    }
  }
  return json || defaultValue;
}
