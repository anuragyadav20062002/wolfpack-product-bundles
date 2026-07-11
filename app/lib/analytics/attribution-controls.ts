import type { Prisma } from "@prisma/client";

export const DEFAULT_ATTRIBUTION_DAYS = 30;
export const MAX_ATTRIBUTION_DAYS = 90;
export const MAX_CUSTOM_UTM_PARAMETERS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CUSTOM_PARAM_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const BLOCKED_CUSTOM_PARAM_RE = /(email|phone|address|customer|buyer|token|secret|password)/i;

export interface AttributionWindow {
  since: Date;
  until: Date;
  days: number;
  from?: string;
  to?: string;
}

export interface CustomUtmInputAnalysis {
  accepted: string[];
  rejected: string[];
  limitReached: boolean;
}

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ATTRIBUTION_DAYS;
  return Math.max(1, Math.min(MAX_ATTRIBUTION_DAYS, Math.trunc(value)));
}

function parseDays(raw: string | null | undefined): number {
  if (!raw) return DEFAULT_ATTRIBUTION_DAYS;
  return clampDays(Number.parseInt(raw, 10));
}

function parseDateKey(value: string | null | undefined): Date | null {
  if (!value || !DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

export function normalizeAttributionWindow(
  params: Pick<URLSearchParams, "get">,
  now = new Date(),
): AttributionWindow {
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const fromDate = parseDateKey(fromParam);
  const toDate = parseDateKey(toParam);

  if (fromParam && toParam && fromDate && toDate && fromDate.getTime() <= toDate.getTime()) {
    const since = startOfUtcDay(fromDate);
    const until = endOfUtcDay(toDate);
    return {
      since,
      until,
      days: Math.max(1, Math.floor((startOfUtcDay(toDate).getTime() - since.getTime()) / DAY_MS) + 1),
      from: fromParam,
      to: toParam,
    };
  }

  const days = parseDays(params.get("days"));
  const until = endOfUtcDay(now);
  const since = startOfUtcDay(new Date(until.getTime() - (days - 1) * DAY_MS));
  return { since, until, days };
}

export function analyzeCustomUtmInput(input: string | null | undefined): CustomUtmInputAnalysis {
  const names = new Set<string>();
  const rejected = new Set<string>();
  for (const rawName of (input ?? "").split(/[\s,]+/)) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;
    if (!CUSTOM_PARAM_RE.test(name) || BLOCKED_CUSTOM_PARAM_RE.test(name)) {
      rejected.add(name);
      continue;
    }
    names.add(name);
    if (names.size >= MAX_CUSTOM_UTM_PARAMETERS) break;
  }
  return {
    accepted: [...names],
    rejected: [...rejected],
    limitReached: names.size >= MAX_CUSTOM_UTM_PARAMETERS,
  };
}

export function parseCustomUtmInput(input: string | null | undefined): string[] {
  return analyzeCustomUtmInput(input).accepted;
}

export function normalizeSavedCustomUtmParameters(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .flatMap((item) => parseCustomUtmInput(item))
    .slice(0, MAX_CUSTOM_UTM_PARAMETERS);
}

export function formatCustomUtmParameters(parameters: string[]): string {
  return parameters.join("\n");
}

export function sanitizeCustomUtmAttributes(input: unknown): Prisma.InputJsonObject {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const [key] = parseCustomUtmInput(rawKey);
    if (!key || typeof rawValue !== "string") continue;
    const value = rawValue.trim();
    if (!value) continue;
    output[key] = value.slice(0, 256);
    if (Object.keys(output).length >= MAX_CUSTOM_UTM_PARAMETERS) break;
  }
  return output;
}
