import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
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
        fileStatus
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
      id
      ... on MediaImage {
        alt
        createdAt
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
  return json({ ok: false, error: message });
}

// Loader — called by the client to poll file status after upload
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const fileId = new URL(request.url).searchParams.get("fileId");

  if (!fileId) {
    return json({ error: "Missing fileId" }, { status: 400 });
  }

  const pollRes = await admin.graphql(FILE_STATUS_QUERY, {
    variables: { id: fileId },
  });
  const pollData = await pollRes.json();
  const node = pollData.data?.node;

  if (!node) {
    return json({ error: "File not found" }, { status: 404 });
  }

  if (node.fileStatus === "READY" && node.image?.url) {
    const cdnUrl: string = node.image.url;
    const storeFile: StoreFile = {
      id: fileId,
      url: cdnUrl,
      filename: filenameFromUrl(cdnUrl),
      alt: node.alt ?? "",
      createdAt: node.createdAt ?? new Date().toISOString(),
    };
    return json({ fileStatus: "READY", file: storeFile });
  }

  return json({ fileStatus: node.fileStatus ?? "PROCESSING" });
}

// Action — receives the file, runs stagedUpload + fileCreate, returns fileId immediately.
// The client polls the loader above until the file is READY.
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

  // Return fileId immediately — client polls the loader for READY status
  return json({ ok: true, fileId: createdFile.id as string });
}
