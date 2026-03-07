import type {
  SavedVisualizerConfig,
  SavedVisualizerConfigPayload,
  SavedPlan,
  SavedPlanPayload,
} from "../types/savedConfig";
import type { Lineup, SavedLineupItem } from "../components/StartingLineup";

const VISUALIZER_KEY_PREFIX = "vb_visualizer_configs_";
const PLANS_KEY_PREFIX = "vb_plans_";
const LINEUPS_KEY_PREFIX = "vb_lineups_";

function getVisualizerKey(userId: string): string {
  return `${VISUALIZER_KEY_PREFIX}${userId}`;
}

function getPlansKey(userId: string): string {
  return `${PLANS_KEY_PREFIX}${userId}`;
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

export function saveLineup(
  userId: string,
  name: string,
  lineup: Lineup,
  showNumber: boolean,
  showName: boolean
): SavedLineupItem {
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
  showName: boolean
): void {
  const list = getSavedLineups(userId);
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return;
  list[idx] = { id, name, lineup, showNumber, showName };
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

export function saveVisualizerConfig(
  userId: string,
  name: string,
  payload: SavedVisualizerConfigPayload
): SavedVisualizerConfig {
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
  payload: SavedVisualizerConfigPayload
): void {
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

export function getSavedPlans(userId: string): SavedPlan[] {
  try {
    const raw = localStorage.getItem(getPlansKey(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    return (Array.isArray(arr) ? arr : []).map(normalizePlan);
  } catch {
    return [];
  }
}

export function savePlan(userId: string, name: string, payload: SavedPlanPayload): SavedPlan {
  const plans = getSavedPlans(userId);
  const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();
  const plan: SavedPlan = {
    ...payload,
    name,
    id,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  plans.push(plan);
  localStorage.setItem(getPlansKey(userId), JSON.stringify(plans));
  return plan;
}

export function updatePlan(userId: string, id: string, payload: SavedPlanPayload): void {
  const plans = getSavedPlans(userId);
  const idx = plans.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const now = new Date();
  plans[idx] = {
    ...payload,
    name: plans[idx].name,
    id,
    userId,
    createdAt: plans[idx].createdAt ?? now,
    updatedAt: now,
  };
  localStorage.setItem(getPlansKey(userId), JSON.stringify(plans));
}

function normalizePlan(raw: unknown): SavedPlan {
  const o = raw as Record<string, unknown>;
  const lineupA = (o.lineupA && typeof o.lineupA === "object" ? o.lineupA : {}) as SavedPlanPayload["lineupA"];
  const lineupB = (o.lineupB && typeof o.lineupB === "object" ? o.lineupB : {}) as SavedPlanPayload["lineupB"];
  const annotations = Array.isArray(o.annotations) ? (o.annotations as unknown[]).map(normalizeAnnotation) : [];
  return {
    name: typeof o.name === "string" ? o.name : "Unnamed plan",
    lineupA,
    lineupB,
    systemA: o.systemA === "6-2" ? "6-2" : "5-1",
    systemB: o.systemB === "6-2" ? "6-2" : "5-1",
    serveTeam: o.serveTeam === "B" ? "B" : "A",
    rotationA: typeof o.rotationA === "number" && o.rotationA >= 1 && o.rotationA <= 6 ? o.rotationA : 1,
    rotationB: typeof o.rotationB === "number" && o.rotationB >= 1 && o.rotationB <= 6 ? o.rotationB : 1,
    annotations,
    id: typeof o.id === "string" ? o.id : undefined,
    userId: typeof o.userId === "string" ? o.userId : undefined,
    createdAt: o.createdAt ? new Date(o.createdAt as string) : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt as string) : undefined,
  };
}
