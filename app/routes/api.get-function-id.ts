import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query {
        app {
          functions(first: 10) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      }
    `);

    const data = await response.json();

    // Find the bundle-discount-function
    const functions = data.data.app.functions.edges;
    const bundleFunction = functions.find(
      (edge: any) => edge.node.handle === "bundle-discount-function",
    );

    if (bundleFunction) {
      return json({
        functionId: bundleFunction.node.id,
        functionTitle: bundleFunction.node.title,
        functionHandle: bundleFunction.node.handle,
      });
    } else {
      return json({ error: "Function not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching function ID:", error);
    return json({ error: "Failed to fetch function ID" }, { status: 500 });
  }
}
