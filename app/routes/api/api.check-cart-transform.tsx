import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const CHECK_CART_TRANSFORM_QUERY = `
    query CheckCartTransform {
      cartTransforms(first: 10) {
        edges {
          node {
            id
            functionId
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(CHECK_CART_TRANSFORM_QUERY);
    const data = await response.json();

    const transforms = data.data?.cartTransforms?.edges || [];
    const bundleTransform = transforms.find(
      (edge: any) => edge.node.functionId === "527a500e-5386-4a67-a61b-9cb4cb8973f8"
    );

    return json({
      activated: !!bundleTransform,
      cartTransformId: bundleTransform?.node.id,
      totalTransforms: transforms.length
    });

  } catch (error) {
    return json({ 
      error: "Failed to check cart transform status",
      activated: false 
    });
  }
}