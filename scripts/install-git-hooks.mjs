#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const isPrepare = process.argv.includes("--prepare");
const warnOnly = isPrepare;

function finishFailure(message) {
  console.warn(`[hooks] ${message}`);
  process.exit(warnOnly ? 0 : 1);
}

if (process.env.CI || process.env.WPB_SKIP_HOOK_INSTALL === "1") {
  process.exit(0);
}

if (!existsSync(".git") || !existsSync(".githooks")) {
  process.exit(0);
}

const insideWorkTree = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (insideWorkTree.status !== 0 || insideWorkTree.stdout.trim() !== "true") {
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.error) {
  finishFailure(`Could not install tracked git hooks: ${result.error.message}`);
}

if (result.status !== 0) {
  finishFailure(`Could not install tracked git hooks:\n${result.stderr.trim()}`);
}

if (!isPrepare) {
  console.log("[hooks] Git hooks installed via core.hooksPath=.githooks");
}
