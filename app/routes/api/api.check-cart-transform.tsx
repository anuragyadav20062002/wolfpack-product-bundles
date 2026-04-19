import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";

const RUST_FUNCTION_HANDLE = 'bundle-cart-transform-rs';

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await requireAdminSession(request);

  const CHECK_QUERY = `
    query CheckCartTransform {
      cartTransforms(first: 10) {
        edges {
          node {
            id
            functionId
          }
        }
      }
      shopifyFunctions(first: 25) {
        edges {
          node {
            id
            handle
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(CHECK_QUERY);
    const data = await response.json();

    const transforms = data.data?.cartTransforms?.edges || [];
    const functions = data.data?.shopifyFunctions?.edges || [];

    // Resolve the live Rust function ID — avoids hardcoding a UUID that changes on deploy
    const rustFn = functions.find((e: any) => e.node.handle === RUST_FUNCTION_HANDLE);
    const rustFunctionId = rustFn?.node?.id ?? null;

    const activeTransform = rustFunctionId
      ? transforms.find((e: any) => e.node.functionId === rustFunctionId)
      : null;

    return json({
      activated: !!activeTransform,
      cartTransformId: activeTransform?.node?.id ?? null,
      rustFunctionId,
      totalTransforms: transforms.length,
      // Surface stale transforms so callers can act on them
      staleTransforms: rustFunctionId
        ? transforms.filter((e: any) => e.node.functionId !== rustFunctionId).map((e: any) => e.node.id)
        : []
    });
  } catch (error) {
    return json({
      error: "Failed to check cart transform status",
      activated: false
    });
  }
}
