import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

const FILES_QUERY = `
  query StoreImageFiles($first: Int!, $after: String, $query: String) {
    files(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          alt
          createdAt
          fileStatus
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export interface StoreFile {
  id: string;
  url: string;
  filename: string;
  alt: string;
  createdAt: string;
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch {
    return url;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const searchTerm = url.searchParams.get("query") || "";

  const gqlQuery = searchTerm
    ? `media_type:IMAGE ${searchTerm}`
    : "media_type:IMAGE";

  try {
    const response = await admin.graphql(FILES_QUERY, {
      variables: {
        first: 25,
        after: cursor ?? null,
        query: gqlQuery,
      },
    });

    const data = await response.json();
    const edges = data.data?.files?.edges ?? [];
    const pageInfo = data.data?.files?.pageInfo ?? { hasNextPage: false, endCursor: null };

    const files: StoreFile[] = edges
      .filter((edge: any) => edge.node.fileStatus === "READY" && edge.node.image?.url)
      .map((edge: any) => ({
        id: edge.node.id,
        url: edge.node.image.url,
        filename: filenameFromUrl(edge.node.image.url),
        alt: edge.node.alt || "",
        createdAt: edge.node.createdAt,
      }));

    return json({ files, pageInfo });
  } catch {
    return json({ files: [], pageInfo: { hasNextPage: false, endCursor: null } });
  }
}
