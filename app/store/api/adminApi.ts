import { createApi } from "@reduxjs/toolkit/query/react";
import type { StoreFile } from "../../routes/app/app.store-files";

export interface StoreFilesResponse {
  files: StoreFile[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface ListStoreFilesArgs {
  cursor?: string | null;
  query?: string | null;
}

export interface UploadStoreFileResult {
  ok: boolean;
  fileId?: string;
  error?: string;
}

export interface UploadStoreFileStatus {
  fileStatus?: string;
  file?: StoreFile;
  error?: string;
}

export interface EnsureProductTemplateArgs {
  productHandle: string;
  bundleId: string;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: async ({ url, method = "GET", body, headers }: {
    url: string;
    method?: string;
    body?: BodyInit | null;
    headers?: HeadersInit;
  }) => {
    try {
      const response = await fetch(url, { method, body, headers });
      const data = await parseResponse(response);

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data,
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          status: "FETCH_ERROR",
          data: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
  tagTypes: ["StoreFile"],
  endpoints: (builder) => ({
    listStoreFiles: builder.query<StoreFilesResponse, ListStoreFilesArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.cursor) params.set("cursor", args.cursor);
        if (args?.query) params.set("query", args.query);
        const queryString = params.toString();

        return {
          url: queryString ? `/app/store-files?${queryString}` : "/app/store-files",
          method: "GET",
        };
      },
      providesTags: ["StoreFile"],
    }),
    uploadStoreFile: builder.mutation<UploadStoreFileResult, FormData>({
      query: (formData) => ({
        url: "/app/upload-store-file",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["StoreFile"],
    }),
    getUploadStoreFileStatus: builder.query<UploadStoreFileStatus, string>({
      query: (fileId) => ({
        url: `/app/upload-store-file?fileId=${encodeURIComponent(fileId)}`,
        method: "GET",
      }),
    }),
    ensureProductTemplate: builder.mutation<{ ok: boolean; error?: string }, EnsureProductTemplateArgs>({
      query: (body) => ({
        url: "/api/ensure-product-template",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    }),
  }),
});

export const {
  useEnsureProductTemplateMutation,
  useGetUploadStoreFileStatusQuery,
  useLazyGetUploadStoreFileStatusQuery,
  useLazyListStoreFilesQuery,
  useListStoreFilesQuery,
  useUploadStoreFileMutation,
} = adminApi;
