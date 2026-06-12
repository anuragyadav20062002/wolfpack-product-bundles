/**
 * Server-Timing — W3C-spec timing measurements that surface in Chrome DevTools.
 *
 * Usage in a Remix loader:
 *
 *   const timing = new ServerTiming();
 *   const session = await timing.track("auth", () => authenticate.admin(request));
 *   const bundles = await timing.track("db.bundles", () => db.bundle.findMany(...));
 *   return json(payload, { headers: timing.toHeaders() });
 *
 * Route headers function should propagate the parent's Server-Timing header
 * AND add its own. See `mergeServerTimingHeaders` for the merge helper.
 *
 * Issue: docs/issues-prod/admin-lcp-measurement-1.md.
 */

export interface ServerTimingEntry {
  name: string;
  durationMs: number;
  description?: string;
}

export class ServerTiming {
  private entries: ServerTimingEntry[] = [];
  private starts = new Map<string, number>();

  /** Marks the start of a manually-bounded span. */
  start(name: string) {
    this.starts.set(name, performance.now());
  }

  /** Stops a manually-bounded span and records the elapsed time. */
  stop(name: string, description?: string) {
    const begin = this.starts.get(name);
    if (begin === undefined) return;
    const durationMs = performance.now() - begin;
    this.starts.delete(name);
    this.entries.push({ name, durationMs, description });
  }

  /** Awaits a promise-returning function and records its wall-clock duration. */
  async track<T>(name: string, fn: () => Promise<T> | T, description?: string): Promise<T> {
    const begin = performance.now();
    try {
      const result = await fn();
      this.entries.push({
        name,
        durationMs: performance.now() - begin,
        description,
      });
      return result;
    } catch (error) {
      // Record the duration even on failure so slowness is visible regardless of outcome.
      this.entries.push({
        name: `${name}.err`,
        durationMs: performance.now() - begin,
        description: description ?? "error",
      });
      throw error;
    }
  }

  /** Wraps an array of named tasks in Promise.all and tags each with its own entry. */
  async trackAll<T extends Record<string, () => Promise<unknown>>>(
    tasks: T,
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const names = Object.keys(tasks) as Array<keyof T>;
    const results = await Promise.all(
      names.map(name => this.track(String(name), tasks[name])),
    );
    const out = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
    names.forEach((name, i) => {
      out[name] = results[i] as Awaited<ReturnType<T[typeof name]>>;
    });
    return out;
  }

  /**
   * Returns the entries serialised as a W3C `Server-Timing` header value.
   * Multiple entries are joined with comma + space.
   */
  toHeader(): string {
    return this.entries
      .map(entry => {
        const dur = Math.round(entry.durationMs * 100) / 100;
        const desc = entry.description
          ? `;desc="${entry.description.replace(/"/g, "'")}"`
          : "";
        return `${sanitizeName(entry.name)}${desc};dur=${dur}`;
      })
      .join(", ");
  }

  /** Returns the header pre-wrapped in a `Headers`-compatible record. */
  toHeaders(): Record<string, string> {
    const value = this.toHeader();
    return value ? { "Server-Timing": value } : {};
  }

  /** Exposes the raw entries — useful for tests and the dev overlay. */
  list(): ReadonlyArray<ServerTimingEntry> {
    return this.entries;
  }
}

/**
 * Merges two Server-Timing header values. Used by route `headers` functions to
 * combine the parent route's timing with this route's.
 */
export function mergeServerTimingHeaders(
  parent: string | null | undefined,
  child: string | null | undefined,
): string | undefined {
  const parts = [parent, child].filter(p => typeof p === "string" && p.length > 0);
  if (parts.length === 0) return undefined;
  return parts.join(", ");
}

const NAME_REPLACE_RE = /[^a-zA-Z0-9_\-.]/g;
function sanitizeName(name: string): string {
  // Server-Timing names must be tokens — no spaces or quotes. Replace illegal chars.
  return name.replace(NAME_REPLACE_RE, "_");
}
