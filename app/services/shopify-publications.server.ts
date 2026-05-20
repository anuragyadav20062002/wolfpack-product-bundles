import type { ShopifyAdmin } from "../lib/auth-guards.server";
import { AppLogger } from "../lib/logger";

const GET_PUBLICATIONS = `
  query GetPublications {
    publications(first: 50) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const PUBLISH_PRODUCT = `
  mutation PublishProductToSalesChannels($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type PublicationEdge = {
  node?: {
    id?: string;
    name?: string;
  };
};

export type SalesChannelPublication = {
  id: string;
  name: string;
};

export async function discoverSalesChannels(admin: ShopifyAdmin): Promise<SalesChannelPublication[]> {
  try {
    const response = await admin.graphql(GET_PUBLICATIONS);
    const data = await response.json() as {
      data?: {
        publications?: {
          edges?: PublicationEdge[];
        };
      };
      errors?: unknown[];
    };

    if (data.errors?.length) {
      AppLogger.warn("Failed to discover sales channels from Shopify", {
        component: "shopify-publications",
        operation: "discover-sales-channels",
        errors: data.errors,
      });
      return [];
    }

    return (data.data?.publications?.edges ?? [])
      .map((edge) => edge.node)
      .filter((node): node is { id: string; name: string } => Boolean(node?.id && node?.name))
      .map((node) => ({ id: node.id, name: node.name }));
  } catch (error) {
    AppLogger.error("Failed to discover sales channels", {
      component: "shopify-publications",
      operation: "discover-sales-channels",
    }, error as any);
    return [];
  }
}

export async function publishProductToSalesChannels(
  admin: ShopifyAdmin,
  shopifyProductId: string | null | undefined,
  operation: string,
): Promise<void> {
  if (!shopifyProductId) {
    return;
  }

  try {
    const channels = await discoverSalesChannels(admin);

    if (channels.length === 0) {
      AppLogger.warn("No sales channels found for product publication", {
        component: "shopify-publications",
        operation,
        productId: shopifyProductId,
      });
      return;
    }

    const response = await admin.graphql(PUBLISH_PRODUCT, {
      variables: {
        id: shopifyProductId,
        input: channels.map((channel) => ({ publicationId: channel.id })),
      },
    });
    const data = await response.json() as {
      data?: {
        publishablePublish?: {
          userErrors?: Array<{ field?: string[]; message: string }>;
        };
      };
      errors?: unknown[];
    };

    if (data.errors?.length) {
      AppLogger.warn("Shopify returned transport errors while publishing product", {
        component: "shopify-publications",
        operation,
        productId: shopifyProductId,
        errors: data.errors,
      });
      return;
    }

    const userErrors = data.data?.publishablePublish?.userErrors ?? [];
    if (userErrors.length > 0) {
      AppLogger.warn("Shopify returned user errors while publishing product", {
        component: "shopify-publications",
        operation,
        productId: shopifyProductId,
        errors: userErrors,
      });
      return;
    }

    AppLogger.info("Product published to sales channels", {
      component: "shopify-publications",
      operation,
      productId: shopifyProductId,
      channelCount: channels.length,
      channelNames: channels.map((channel) => channel.name).join(", "),
    });
  } catch (error) {
    AppLogger.error("Failed to publish product to sales channels", {
      component: "shopify-publications",
      operation,
      productId: shopifyProductId,
    }, error as any);
  }
}
