/**
 * Backend API client. All methods require a Firebase ID token.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

function getApiUrl(path: string): string {
  const url = BASE_URL ? `${BASE_URL}${path}` : path;
  if (typeof window !== "undefined") {
    if (!BASE_URL || BASE_URL === window.location.origin) {
      throw new Error(
        "VITE_API_URL must be your Railway backend URL (e.g. https://xxx.up.railway.app). Set it in Vercel → Settings → Environment Variables and redeploy."
      );
    }
    if (url.startsWith(window.location.origin)) {
      throw new Error(
        "VITE_API_URL must be your Railway backend URL, not the frontend URL. Fix it in Vercel environment variables and redeploy."
      );
    }
  }
  return url;
}

async function request<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<T> {
  const url = getApiUrl(path);
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    if (res.status === 401) {
      try {
        const j = JSON.parse(text) as { detail?: string };
        detail = j.detail ? `Unauthorized: ${j.detail}` : "Unauthorized";
      } catch {
        detail = text || "Unauthorized";
      }
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type SavedLineupItemApi = {
  id: string;
  name: string;
  lineup: Record<string, unknown>;
  showNumber: boolean;
  showName: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const lineupsApi = {
  list: (token: string) =>
    request<SavedLineupItemApi[]>("GET", "/lineups", token),

  create: (
    token: string,
    body: { name: string; lineup: Record<string, unknown>; showNumber: boolean; showName: boolean }
  ) => request<SavedLineupItemApi>("POST", "/lineups", token, body),

  update: (
    token: string,
    id: string,
    body: { name: string; lineup: Record<string, unknown>; showNumber: boolean; showName: boolean }
  ) => request<SavedLineupItemApi>("PUT", `/lineups/${id}`, token, body),

  delete: (token: string, id: string) =>
    request<void>("DELETE", `/lineups/${id}`, token),
};

export type SavedVisualizerConfigApi = {
  id: string;
  name: string;
  system: string;
  rotations: unknown[];
  createdAt?: string;
  updatedAt?: string;
};

export const configsApi = {
  list: (token: string) =>
    request<SavedVisualizerConfigApi[]>("GET", "/configs", token),

  create: (
    token: string,
    body: { name: string; system: string; rotations: unknown[] }
  ) => request<SavedVisualizerConfigApi>("POST", "/configs", token, body),

  update: (
    token: string,
    id: string,
    body: { name?: string; system?: string; rotations?: unknown[] }
  ) => request<SavedVisualizerConfigApi>("PUT", `/configs/${id}`, token, body),

  delete: (token: string, id: string) =>
    request<void>("DELETE", `/configs/${id}`, token),
};

export type SavedPlanApi = {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export const plansApi = {
  list: (token: string) =>
    request<SavedPlanApi[]>("GET", "/plans", token),

  create: (token: string, body: { name: string; payload: Record<string, unknown> }) =>
    request<SavedPlanApi>("POST", "/plans", token, body),

  update: (token: string, id: string, body: { name?: string; payload?: Record<string, unknown> }) =>
    request<SavedPlanApi>("PUT", `/plans/${id}`, token, body),

  delete: (token: string, id: string) =>
    request<void>("DELETE", `/plans/${id}`, token),
};
