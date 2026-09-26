export const API_URL = import.meta.env.VITE_API_URL || "/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "PASSENGER" | "DRIVER";
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed (${response.status})`);
  }
  return body as T;
}

export function money(poysha: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2
  }).format(poysha / 100);
}

export function prettyArea(value: string) {
  return value.replaceAll("_", " ");
}
