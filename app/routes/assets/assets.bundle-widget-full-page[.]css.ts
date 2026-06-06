import type { LoaderFunctionArgs } from "@remix-run/node";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AppLogger } from "../../lib/logger";

export const loader = async (_args: LoaderFunctionArgs) => {
  try {
    const content = await readFile(
      join(process.cwd(), "extensions", "bundle-builder", "assets", "bundle-widget-full-page.css"),
      "utf8",
    );

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    AppLogger.error("Error serving full-page bundle CSS", {
      component: "assets.bundle-widget-full-page.css",
      operation: "loader",
    }, error);
    return new Response("", { status: 500, headers: { "Content-Type": "text/css; charset=utf-8" } });
  }
};
