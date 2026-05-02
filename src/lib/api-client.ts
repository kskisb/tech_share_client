import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = "http://localhost:3001";

export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});

let authToken: string | null = null;

const authMiddleware: Middleware = {
  onRequest: ({ request }) => {
    const headers = new Headers(request.headers);
    const tokenFromStorage =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const token = tokenFromStorage ?? authToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }

    return new Request(request, { headers });
  },
};

apiClient.use(authMiddleware);

// token を middleware で自動付与する
export function setAuthToken(token: string | null) {
  authToken = token;
}

// client 初期化時に localStorage から token を読み込み
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  setAuthToken(token);
}
