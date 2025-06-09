import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // GraphQL mutation to create a metafield definition for the shop
  const CREATE_METAFIELD_DEFINITION_MUTATION = `#graphql
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          namespace
          key
          type {
            name
          }
          access {
            storefront
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // GraphQL query to check if a metafield definition already exists
  const GET_METAFIELD_DEFINITION_QUERY = `#graphql
    query GetMetafieldDefinition($query: String!, $ownerType: MetafieldOwnerType!) {
      metafieldDefinitions(first: 1, query: $query, ownerType: $ownerType) {
        edges {
          node {
            id
          }
        }
      }
    }
  `;

  const metafieldNamespace = "custom";
  const metafieldKey = "all_bundles";
  const combinedMetafieldQuery = `namespace:${metafieldNamespace} AND key:${metafieldKey}`;

  try {
    if (!admin) {
      console.error("Admin object is undefined in webhook handler.");
      return new Response("Admin object is undefined", { status: 500 });
    }

    // Check if the metafield definition already exists
    const existingDefinitionResponse: Response = await admin.graphql(
      GET_METAFIELD_DEFINITION_QUERY,
      {
        variables: {
          query: combinedMetafieldQuery,
          ownerType: "SHOP",
        },
      }
    );
    const existingDefinitionJson: {
      data?: { metafieldDefinitions?: { edges?: Array<{ node: { id: string } }> } };
      errors?: any[];
    } = await existingDefinitionResponse.json();

    if (existingDefinitionJson.errors && existingDefinitionJson.errors.length > 0) {
      console.error("Error querying existing metafield definition:", existingDefinitionJson.errors);
      return new Response(`Failed to query existing metafield definition: ${JSON.stringify(existingDefinitionJson.errors)}`, { status: 500 });
    }

    // Safely check for edges length
    if (existingDefinitionJson.data?.metafieldDefinitions?.edges && existingDefinitionJson.data.metafieldDefinitions.edges.length > 0) {
      console.log(`Metafield definition for ${metafieldNamespace}.${metafieldKey} already exists.`);
      return new Response(null, { status: 200 }); // Definition already exists, no need to create
    }

    // Define the metafield definition input
    const definitionInput = {
      name: "All Bundles Data",
      namespace: metafieldNamespace,
      key: metafieldKey,
      description: "Stores all product bundle configurations for the shop.",
      ownerType: "SHOP",
      type: "json_string",
      access: {
        storefront: true, // Crucially, enable storefront access
        admin: true,
      },
      // You can add more validation here if needed, eg., validationMethod, validationReference
    };

    // Create the metafield definition
    const createDefinitionResponse = await admin.graphql(
      CREATE_METAFIELD_DEFINITION_MUTATION,
      {
        variables: {
          definition: definitionInput,
        },
      }
    );
    // Refined type for createDefinitionJson
    const createDefinitionJson: {
      data?: {
        metafieldDefinitionCreate?: {
          createdDefinition?: {
            id: string;
            namespace: string;
            key: string;
            type: { name: string };
            access: { storefront: boolean };
          };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      };
      errors?: any[]; // Added for general GraphQL errors
    } = await createDefinitionResponse.json();

    if (createDefinitionJson.errors && createDefinitionJson.errors.length > 0) { // Check top-level errors
      console.error("Error creating metafield definition (GraphQL errors):", createDefinitionJson.errors);
      return new Response(`Failed to create metafield definition (GraphQL errors): ${JSON.stringify(createDefinitionJson.errors)}`, { status: 500 });
    } else if (createDefinitionJson.data?.metafieldDefinitionCreate?.userErrors && createDefinitionJson.data.metafieldDefinitionCreate.userErrors.length > 0) {
      console.error("Shopify User Errors creating metafield definition:", createDefinitionJson.data.metafieldDefinitionCreate.userErrors);
      return new Response(`Shopify User Errors creating metafield definition: ${JSON.stringify(createDefinitionJson.data.metafieldDefinitionCreate.userErrors)}`, { status: 500 });
    } else if (createDefinitionJson.data?.metafieldDefinitionCreate?.createdDefinition) { // Only log success if createdDefinition exists
      console.log("Metafield definition created successfully:", createDefinitionJson.data.metafieldDefinitionCreate.createdDefinition);
      return new Response(null, { status: 200 });
    } else {
      // Fallback for unexpected successful response without createdDefinition
      console.log("Metafield definition creation response received, but no definition returned.", createDefinitionJson);
      return new Response(null, { status: 200 });
    }
  } catch (error: unknown) { // Type 'unknown' for caught error
    console.error("Error handling app/installed webhook:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(`Webhook handler failed: ${errorMessage}`, { status: 500 });
  }
}; 