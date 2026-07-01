import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const checkedAt = new Date().toISOString();

  try {
    await db.$queryRaw`SELECT 1`;

    return json(
      {
        status: "ok",
        checkedAt,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    AppLogger.warn(
      "Render health check failed",
      {
        component: "render-health",
        operation: "loader",
        path: new URL(request.url).pathname,
      },
      error
    );

    return json(
      {
        status: "error",
        checkedAt,
      },
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}
