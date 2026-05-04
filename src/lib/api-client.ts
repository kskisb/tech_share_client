import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_CHANGED_EVENT = "tech-share:auth-token-changed";

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

export function syncAuthToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    setAuthToken(token);
    window.dispatchEvent(
      new CustomEvent(AUTH_TOKEN_CHANGED_EVENT, {
        detail: { token },
      }),
    );
    return;
  }

  setAuthToken(token);
}

export function onAuthTokenChanged(listener: (token: string | null) => void) {
  const handleAuthTokenChanged = (event: Event) => {
    const customEvent = event as CustomEvent<{ token: string | null }>;
    listener(customEvent.detail?.token ?? null);
  };

  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);

  return () => {
    window.removeEventListener(
      AUTH_TOKEN_CHANGED_EVENT,
      handleAuthTokenChanged,
    );
  };
}

// client 初期化時に localStorage から token を読み込み
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  setAuthToken(token);
}
