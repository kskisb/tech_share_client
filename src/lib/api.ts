import { apiClient } from "./api-client";

type JsonResponse = Awaited<ReturnType<Response["json"]>>;

type OpenApiRequestConfig = {
  schemaPath: string;
  params?: {
    path?: Record<string, number | string>;
    query?: Record<string, string>;
  };
};

const FALLBACK_ERROR_MESSAGE = "APIリクエストに失敗しました";

const toNumberOrString = (value: string): number | string => {
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const getMatchedValue = (
  match: RegExpMatchArray | null,
  index: number,
): string => {
  if (!match || !match[index]) {
    throw new Error(FALLBACK_ERROR_MESSAGE);
  }
  return match[index];
};

const parseEndpoint = (endpoint: string): OpenApiRequestConfig => {
  const [pathPart = "", queryPart = ""] = endpoint.split("?", 2);
  const rawPath = pathPart;
  const rawQuery = queryPart;
  const query = new URLSearchParams(rawQuery);

  if (rawPath === "/auth/login") return { schemaPath: "/api/v1/auth/login" };
  if (rawPath === "/auth/me") return { schemaPath: "/api/v1/auth/me" };
  if (rawPath === "/auth/signup") return { schemaPath: "/api/v1/auth/signup" };
  if (rawPath === "/tags") return { schemaPath: "/api/v1/tags" };

  if (rawPath === "/posts") {
    const tag = query.get("tag");
    return {
      schemaPath: "/api/v1/posts",
      params: tag ? { query: { tag } } : undefined,
    };
  }

  const postMatch = rawPath.match(/^\/posts\/(\d+)$/);
  if (postMatch) {
    const id = getMatchedValue(postMatch, 1);
    return {
      schemaPath: "/api/v1/posts/{id}",
      params: { path: { id: toNumberOrString(id) } },
    };
  }

  const commentsMatch = rawPath.match(/^\/posts\/(\d+)\/comments$/);
  if (commentsMatch) {
    const postId = getMatchedValue(commentsMatch, 1);
    return {
      schemaPath: "/api/v1/posts/{post_id}/comments",
      params: { path: { post_id: toNumberOrString(postId) } },
    };
  }

  const commentDeleteMatch = rawPath.match(/^\/posts\/(\d+)\/comments\/(\d+)$/);
  if (commentDeleteMatch) {
    const postId = getMatchedValue(commentDeleteMatch, 1);
    const commentId = getMatchedValue(commentDeleteMatch, 2);
    return {
      schemaPath: "/api/v1/posts/{post_id}/comments/{id}",
      params: {
        path: {
          post_id: toNumberOrString(postId),
          id: toNumberOrString(commentId),
        },
      },
    };
  }

  const likeMatch = rawPath.match(/^\/posts\/(\d+)\/like$/);
  if (likeMatch) {
    const postId = getMatchedValue(likeMatch, 1);
    return {
      schemaPath: "/api/v1/posts/{post_id}/like",
      params: { path: { post_id: toNumberOrString(postId) } },
    };
  }

  throw new Error(`未対応のAPIエンドポイントです: ${endpoint}`);
};

const parseBody = (body: BodyInit | null | undefined): unknown => {
  if (body == null) return undefined;
  if (typeof body !== "string") return body;

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
};

const extractErrorMessage = (errorData: unknown): string => {
  if (typeof errorData !== "object" || errorData === null) {
    return FALLBACK_ERROR_MESSAGE;
  }

  const maybeObj = errorData as Record<string, unknown>;

  if (Array.isArray(maybeObj.errors) && maybeObj.errors.length > 0) {
    const first = maybeObj.errors[0];
    if (typeof first === "object" && first !== null) {
      const firstObj = first as Record<string, unknown>;
      if (typeof firstObj.message === "string") return firstObj.message;
    }
  }

  if (typeof maybeObj.error === "string") return maybeObj.error;
  if (typeof maybeObj.message === "string") return maybeObj.message;

  return FALLBACK_ERROR_MESSAGE;
};

type OpenApiRequest = (
  method: string,
  path: string,
  init: {
    params?: OpenApiRequestConfig["params"];
    body?: unknown;
    headers?: HeadersInit;
  },
) => Promise<{ data?: JsonResponse; error?: unknown }>;

const requestWithOpenApi = apiClient.request as unknown as OpenApiRequest;

export async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
): Promise<JsonResponse> {
  const method = (options.method ?? "GET").toUpperCase();
  const { schemaPath, params } = parseEndpoint(endpoint);
  const body = parseBody(options.body);

  const requestInit = {
    params,
    body,
    headers: options.headers,
  };

  const { data, error } = await requestWithOpenApi(
    method,
    schemaPath,
    requestInit,
  );

  if (error) {
    throw new Error(extractErrorMessage(error));
  }

  return data as JsonResponse;
}
