const API_BASE_URL = "http://localhost:3001/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", "Bearer " + token);
  }

  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }

    let messageFromArray: string | null = null;

    if (typeof errorData === "object" && errorData !== null) {
      const maybeObj = errorData as Record<string, unknown>;

      if (Array.isArray(maybeObj.errors) && maybeObj.errors.length > 0) {
        const first = maybeObj.errors[0];
        if (typeof first === "object" && first !== null) {
          const firstObj = first as Record<string, unknown>;
          if (typeof firstObj.message === "string") {
            messageFromArray = firstObj.message;
          }
        }
      }

      const maybeError = maybeObj.error;
      const maybeMessage = maybeObj.message;

      const message =
        messageFromArray ||
        (typeof maybeError === "string"
          ? maybeError
          : typeof maybeMessage === "string"
            ? maybeMessage
            : "APIリクエストに失敗しました");

      throw new Error(message);
    } else {
      throw new Error("APIリクエストに失敗しました");
    }
  }

  return response.json();
}
