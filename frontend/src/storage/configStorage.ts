import type {
  SavedVisualizerConfig,
  SavedVisualizerConfigPayload,
} from "../types/savedConfig";
import type { Lineup, SavedLineupItem } from "../components/StartingLineup";
import { lineupsApi, configsApi } from "../api/client";

const VISUALIZER_KEY_PREFIX = "vb_visualizer_configs_";
const LINEUPS_KEY_PREFIX = "vb_lineups_";

function getVisualizerKey(userId: string): string {
  return `${VISUALIZER_KEY_PREFIX}${userId}`;
}

function getLineupsKey(userId: string): string {
  return `${LINEUPS_KEY_PREFIX}${userId}`;
}

export function getSavedLineups(userId: string): SavedLineupItem[] {
  try {
    const raw = localStorage.getItem(getLineupsKey(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    return (Array.isArray(arr) ? arr : []).map((item: unknown) => {
      const o = item as Record<string, unknown>;
      return {
        id: typeof o.id === "string" ? o.id : "",
        name: typeof o.name === "string" ? o.name : "Unnamed",
        lineup: (o.lineup && typeof o.lineup === "object" ? o.lineup : {}) as Lineup,
        showNumber: o.showNumber !== false,
        showName: o.showName === true,
      };
    });
  } catch {
    return [];
  }
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

export function saveLineup(
  userId: string,
  name: string,
  lineup: Lineup,
  showNumber: boolean,
  showName: boolean,
  token?: string | null
): SavedLineupItem | Promise<SavedLineupItem> {
  if (token) {
    return lineupsApi.create(token, { name, lineup, showNumber, showName }).then((o) => ({
      id: o.id,
      name: o.name,
      lineup: (o.lineup || {}) as Lineup,
      showNumber: o.showNumber !== false,
      showName: o.showName === true,
    }));
  }
  const list = getSavedLineups(userId);
  const id = `lineup_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const item: SavedLineupItem = { id, name, lineup, showNumber, showName };
  list.push(item);
  localStorage.setItem(getLineupsKey(userId), JSON.stringify(list));
  return item;
}

export function updateLineup(
  userId: string,
  id: string,
  name: string,
  lineup: Lineup,
  showNumber: boolean,
  showName: boolean,
  token?: string | null
): void | Promise<void> {
  if (token) {
    return lineupsApi.update(token, id, { name, lineup, showNumber, showName }).then(() => {});
  }
  const list = getSavedLineups(userId);
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return;
  list[idx] = { id, name, lineup, showNumber, showName };
  localStorage.setItem(getLineupsKey(userId), JSON.stringify(list));
}

export function deleteLineup(userId: string, id: string, token?: string | null): void | Promise<void> {
  if (token) {
    return lineupsApi.delete(token, id).then(() => {});
  }
  const list = getSavedLineups(userId).filter((l) => l.id !== id);
  localStorage.setItem(getLineupsKey(userId), JSON.stringify(list));
}

export function getSavedVisualizerConfigs(userId: string): SavedVisualizerConfig[] {
  try {
    const raw = localStorage.getItem(getVisualizerKey(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    return (Array.isArray(arr) ? arr : []).map(normalizeVisualizerConfig);
  } catch {
    return [];
  }
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

export function saveVisualizerConfig(
  userId: string,
  name: string,
  payload: SavedVisualizerConfigPayload,
  token?: string | null
): SavedVisualizerConfig | Promise<SavedVisualizerConfig> {
  if (token) {
    return configsApi
      .create(token, { name, system: payload.system, rotations: payload.rotations })
      .then((o) => ({
        ...payload,
        name: o.name,
        id: o.id,
        userId,
        createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
      }));
  }
  const configs = getSavedVisualizerConfigs(userId);
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();
  const config: SavedVisualizerConfig = {
    ...payload,
    name,
    id,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  configs.push(config);
  localStorage.setItem(getVisualizerKey(userId), JSON.stringify(configs));
  return config;
}

export function updateVisualizerConfig(
  userId: string,
  id: string,
  payload: SavedVisualizerConfigPayload,
  token?: string | null
): void | Promise<void> {
  if (token) {
    return configsApi
      .update(token, id, { system: payload.system, rotations: payload.rotations })
      .then(() => {});
  }
  const configs = getSavedVisualizerConfigs(userId);
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const now = new Date();
  configs[idx] = {
    ...payload,
    name: configs[idx].name,
    id,
    userId,
    createdAt: configs[idx].createdAt ?? now,
    updatedAt: now,
  };
  localStorage.setItem(getVisualizerKey(userId), JSON.stringify(configs));
}

export function deleteVisualizerConfig(userId: string, id: string, token?: string | null): void | Promise<void> {
  if (token) {
    return configsApi.delete(token, id).then(() => {});
  }
  const configs = getSavedVisualizerConfigs(userId).filter((c) => c.id !== id);
  localStorage.setItem(getVisualizerKey(userId), JSON.stringify(configs));
}

function normalizeVisualizerConfig(raw: unknown): SavedVisualizerConfig {
  const o = raw as Record<string, unknown>;
  const system = (o.system === "6-2" ? "6-2" : "5-1") as "5-1" | "6-2";
  let rotations = Array.isArray(o.rotations) ? o.rotations : [];
  if (rotations.length !== 6) {
    rotations = Array.from({ length: 6 }, (_, i) =>
      rotations[i] && typeof rotations[i] === "object"
        ? rotations[i]
        : { players: [], annotations: [] }
    );
  }
  return {
    name: typeof o.name === "string" ? o.name : "Unnamed",
    system,
    rotations: rotations.map((r: unknown) => normalizeRotationSnapshot(r)),
    id: typeof o.id === "string" ? o.id : undefined,
    userId: typeof o.userId === "string" ? o.userId : undefined,
    createdAt: o.createdAt ? new Date(o.createdAt as string) : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt as string) : undefined,
  };
}

function normalizeRotationSnapshot(raw: unknown): { players: SavedVisualizerConfig["rotations"][0]["players"]; annotations: SavedVisualizerConfig["rotations"][0]["annotations"] } {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const players = Array.isArray(o.players) ? o.players : [];
  const annotations = Array.isArray(o.annotations) ? o.annotations : [];
  return {
    players: players.map((p: unknown) => normalizePlayer(p)),
    annotations: annotations.map((a: unknown) => normalizeAnnotation(a)),
  };
}

function normalizePlayer(raw: unknown): SavedVisualizerConfig["rotations"][0]["players"][0] {
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

function normalizeAnnotation(raw: unknown): SavedVisualizerConfig["rotations"][0]["annotations"][0] {
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
