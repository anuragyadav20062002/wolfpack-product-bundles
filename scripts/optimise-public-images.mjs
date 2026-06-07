#!/usr/bin/env node
/**
 * Optimise /public images for the admin LCP plan.
 *
 * For every PNG/JPG/JPEG under /public, emit an AVIF sibling and a WebP
 * sibling. Idempotent — skips files whose modern siblings already exist
 * and are newer than the source. Run as part of `npm run build` so the
 * production deploy ships the small variants.
 *
 * Targets (see docs/issues-prod/admin-lcp-phase3-images-1.md):
 *   - AVIF: quality 60, effort 4 — typically <50 KB for the FPB-*.png pickers
 *   - WebP: quality 75 — fallback for browsers without AVIF
 *   - source PNG/JPG stays in place — used only by ancient browsers and as
 *     the `<img>` src inside `<picture>` (which never fires when a modern
 *     `<source>` matches)
 *
 * Issue: docs/issues-prod/admin-lcp-phase3-images-1.md.
 */

import { readdir, stat, mkdir } from "node:fs/promises";
import { join, basename, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

const AVIF_OPTIONS = { quality: 60, effort: 4 };
const WEBP_OPTIONS = { quality: 75, effort: 4 };

const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function isOutdated(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([stat(source), stat(target)]);
    return targetStat.mtimeMs < sourceStat.mtimeMs;
  } catch {
    return true; // target missing
  }
}

async function optimise(sourcePath) {
  const ext = extname(sourcePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return null;

  const base = sourcePath.replace(new RegExp(`${ext}$`), "");
  const avifPath = `${base}.avif`;
  const webpPath = `${base}.webp`;

  const tasks = [];
  if (await isOutdated(sourcePath, avifPath)) {
    tasks.push(
      sharp(sourcePath)
        .avif(AVIF_OPTIONS)
        .toFile(avifPath)
        .then((info) => ({ kind: "avif", path: avifPath, size: info.size })),
    );
  }
  if (await isOutdated(sourcePath, webpPath)) {
    tasks.push(
      sharp(sourcePath)
        .webp(WEBP_OPTIONS)
        .toFile(webpPath)
        .then((info) => ({ kind: "webp", path: webpPath, size: info.size })),
    );
  }

  if (tasks.length === 0) return { source: sourcePath, skipped: true };

  const results = await Promise.all(tasks);
  const sourceSize = (await stat(sourcePath)).size;
  return { source: sourcePath, sourceSize, results };
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  const files = await walk(PUBLIC_DIR);
  const targets = files.filter((f) => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()));

  if (targets.length === 0) {
    console.log("[optimise-public-images] no png/jpg files in /public");
    return;
  }

  console.log(`[optimise-public-images] scanning ${targets.length} source images...`);

  let optimisedCount = 0;
  let skippedCount = 0;
  let totalSavedBytes = 0;

  for (const source of targets) {
    const result = await optimise(source);
    if (!result) continue;
    if (result.skipped) {
      skippedCount += 1;
      continue;
    }
    optimisedCount += 1;
    const rel = source.replace(PUBLIC_DIR + "/", "");
    const variants = result.results.map((r) => `${r.kind} ${formatKB(r.size)}`).join(", ");
    console.log(`  ${rel}: ${formatKB(result.sourceSize)} -> ${variants}`);
    for (const r of result.results) {
      const saving = result.sourceSize - r.size;
      if (saving > 0) totalSavedBytes += saving;
    }
  }

  console.log(`[optimise-public-images] optimised ${optimisedCount}, skipped ${skippedCount} (up-to-date). Saved ${formatKB(totalSavedBytes)} across all variants.`);
}

main().catch((error) => {
  console.error("[optimise-public-images] failed:", error);
  process.exitCode = 1;
});
