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
    const errorData = await response.json().catch(() => ({}) as any);

    const messageFromArray =
      Array.isArray(errorData?.errors) && errorData.errors.length > 0
        ? errorData.errors[0]?.message
        : null;

    const message =
      messageFromArray ||
      errorData?.error ||
      errorData?.message ||
      "APIリクエストに失敗しました";

    throw new Error(message);
  }

  return response.json();
}
