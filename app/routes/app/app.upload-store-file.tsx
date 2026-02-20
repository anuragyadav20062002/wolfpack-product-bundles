import { type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import type { StoreFile } from "./app.store-files";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

const STAGED_UPLOADS_CREATE = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
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
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const FILE_STATUS_QUERY = `
  query GetFileStatus($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        fileStatus
        image {
          url
        }
      }
    }
  }
`;

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? url);
  } catch {
    return url;
  }
}

function errorResponse(message: string) {
  return Response.json({ ok: false, error: message });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return errorResponse("No file received.");
  }

  // Server-side validation
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return errorResponse("Only image files are accepted.");
  }
  if (file.size > MAX_BYTES) {
    return errorResponse("File must be under 20 MB.");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Step 1 — stagedUploadsCreate
  const stagedRes = await admin.graphql(STAGED_UPLOADS_CREATE, {
    variables: {
      input: [
        {
          filename: file.name,
          mimeType: file.type,
          resource: "FILE",
          httpMethod: "POST",
        },
      ],
    },
  });

  const stagedData = await stagedRes.json();
  const stagedErrors = stagedData.data?.stagedUploadsCreate?.userErrors ?? [];
  if (stagedErrors.length > 0) {
    return errorResponse("Upload failed. Please try again.");
  }

  const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) {
    return errorResponse("Upload failed. Please try again.");
  }

  // Step 2 — binary upload to staged URL
  const uploadForm = new FormData();
  for (const param of target.parameters as Array<{ name: string; value: string }>) {
    uploadForm.append(param.name, param.value);
  }
  uploadForm.append(
    "file",
    new Blob([fileBuffer], { type: file.type }),
    file.name,
  );

  const uploadRes = await fetch(target.url as string, {
    method: "POST",
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    return errorResponse("Upload failed. Please try again.");
  }

  // Step 3 — fileCreate
  const createRes = await admin.graphql(FILE_CREATE, {
    variables: {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: "IMAGE",
          alt: file.name,
        },
      ],
    },
  });

  const createData = await createRes.json();
  const createErrors = createData.data?.fileCreate?.userErrors ?? [];
  if (createErrors.length > 0) {
    return errorResponse("Upload failed. Please try again.");
  }

  const createdFile = createData.data?.fileCreate?.files?.[0];
  if (!createdFile?.id) {
    return errorResponse("Upload failed. Please try again.");
  }

  // Step 4 — poll for READY
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollRes = await admin.graphql(FILE_STATUS_QUERY, {
      variables: { id: createdFile.id },
    });
    const pollData = await pollRes.json();
    const node = pollData.data?.node;

    if (node?.fileStatus === "READY" && node?.image?.url) {
      const cdnUrl: string = node.image.url;
      const storeFile: StoreFile = {
        id: createdFile.id,
        url: cdnUrl,
        filename: filenameFromUrl(cdnUrl),
        alt: createdFile.alt ?? file.name,
        createdAt: createdFile.createdAt ?? new Date().toISOString(),
      };
      return Response.json({ ok: true, file: storeFile });
    }

    if (node?.fileStatus === "FAILED") {
      return errorResponse("Upload failed. Please try again.");
    }
  }

  // Timeout — file is in Shopify Files but not yet READY
  return Response.json({ ok: false, timeout: true, error: "timeout" });
}
