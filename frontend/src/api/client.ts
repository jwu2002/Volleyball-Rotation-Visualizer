import type { SavedVisualizerConfig } from "../types/savedConfig";
import type { Lineup, SavedLineupItem } from "../components/StartingLineup";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

function getApiUrl(path: string): string {
  return BASE_URL ? `${BASE_URL}${path}` : path;
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
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text || `HTTP ${res.status}`;
    if (res.status === 401) {
      try {
        const j = JSON.parse(text) as { detail?: string };
        detail = j.detail ? `Unauthorized: ${j.detail}` : "Unauthorized";
      } catch {
        detail = text || "Unauthorized";
      }
    }
    if (res.status === 405) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const wentToWrongServer = url.startsWith(origin) || !url.includes("railway");
      detail = wentToWrongServer
        ? `405: Request went to the wrong server (${url}). Set VITE_API_URL to your Railway URL in Vercel → Settings → Environment Variables, then redeploy.`
        : `405 Method Not Allowed from backend (${url}). Check Railway logs.`;
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const looksLikeHtml = /^\s*</.test(text) || text.trimStart().toLowerCase().startsWith("<!doctype");
    throw new Error(
      looksLikeHtml
        ? `Server returned HTML instead of JSON (request to ${url}). Set VITE_API_URL to your Railway backend URL in Vercel → Settings → Environment Variables and redeploy.`
        : `Server returned ${ct || "non-JSON"} instead of JSON. Check VITE_API_URL and backend.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON from API (${url}). You may be hitting the frontend URL; set VITE_API_URL to your Railway backend.`
    );
  }
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

function normalizeRotationSnapshot(raw: unknown): {
  players: SavedVisualizerConfig["rotations"][0]["players"];
  annotations: SavedVisualizerConfig["rotations"][0]["annotations"];
} {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const players = Array.isArray(o.players) ? o.players : [];
  const annotations = Array.isArray(o.annotations) ? o.annotations : [];
  return {
    players: players.map((p: unknown) => normalizeConfigPlayer(p)),
    annotations: annotations.map((a: unknown) => normalizeConfigAnnotation(a)),
  };
}

function normalizeConfigPlayer(raw: unknown): SavedVisualizerConfig["rotations"][0]["players"][0] {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof p.id === "string" ? p.id : "",
    x: typeof p.x === "number" ? p.x : 0,
    y: typeof p.y === "number" ? p.y : 0,
    color: typeof p.color === "string" ? p.color : "#888",
    label: typeof p.label === "string" ? p.label : "",
    isFrontRow: p.isFrontRow === true,
    isLibero: p.isLibero === true,
  };
}

function normalizeConfigAnnotation(raw: unknown): SavedVisualizerConfig["rotations"][0]["annotations"][0] {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const type = a.type === "arrow" ? "arrow" : "path";
  const points = Array.isArray(a.points) ? (a.points as number[]) : [];
  return {
    type,
    points,
    stroke: typeof a.stroke === "string" ? a.stroke : undefined,
    pointerAtBeginning: a.pointerAtBeginning === true,
    pointerAtEnding: a.pointerAtEnding !== false,
    tension: typeof a.tension === "number" ? a.tension : undefined,
  };
}

export async function fetchSavedLineups(token: string): Promise<SavedLineupItem[]> {
  const list = await lineupsApi.list(token);
  return list.map((o) => ({
    id: o.id,
    name: o.name,
    lineup: (o.lineup || {}) as Lineup,
    showNumber: o.showNumber !== false,
    showName: o.showName === true,
  }));
}

export async function fetchSavedVisualizerConfigs(token: string): Promise<SavedVisualizerConfig[]> {
  const list = await configsApi.list(token);
  return list.map((o) => ({
    id: o.id,
    name: o.name,
    system: (o.system === "6-2" ? "6-2" : "5-1") as "5-1" | "6-2",
    rotations: (o.rotations || []).map((r: unknown) => normalizeRotationSnapshot(r)),
    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
  }));
}

