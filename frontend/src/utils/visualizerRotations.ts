import { COLORS, default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { RotationSnapshot } from "../types/savedConfig";

export type Player = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

const base51: Player[] = [
  { id: "OH1", x: 400, y: 100, color: COLORS.OH, label: "OH1", isFrontRow: true },
  { id: "OH2", x: 100, y: 425, color: COLORS.OH, label: "OH2", isFrontRow: false },
  { id: "Setter1", x: 400, y: 425, color: COLORS.S, label: "S1", isFrontRow: false },
  { id: "RS1", x: 100, y: 100, color: COLORS.RS, label: "RS1", isFrontRow: true },
  { id: "MB1", x: 250, y: 425, color: COLORS.MB, label: "MB1", isFrontRow: false },
  { id: "MB2", x: 250, y: 100, color: COLORS.MB, label: "MB2", isFrontRow: true },
];

export function getRoleColorFromId(id: string): string {
  if (id.startsWith("OH")) return COLORS.OH;
  if (id.startsWith("MB")) return COLORS.MB;
  if (id.startsWith("RS")) return COLORS.RS;
  if (id.startsWith("Setter") || id.startsWith("S")) return COLORS.S;
  return "black";
}

function generateRotations(base: Player[], count = 6): Player[][] {
  const first = base.map((p) => ({
    ...p,
    isFrontRow: p.isFrontRow ?? p.y < 300,
  }));
  const rotations: Player[][] = [first];
  for (let i = 1; i < count; i++) {
    const prev = JSON.parse(JSON.stringify(rotations[i - 1])) as Player[];
    const top = prev.filter((p) => p.isFrontRow).sort((a, b) => a.x - b.x);
    const bottom = prev.filter((p) => !p.isFrontRow).sort((a, b) => a.x - b.x);
    const topY = top.length ? top[0].y : 100;
    const bottomY = bottom.length ? bottom[0].y : 425;
    const next = prev.map((p) => ({ ...p }));
    const t0 = top[0];
    next.find((p) => p.id === t0.id)!.x = top[1].x;
    next.find((p) => p.id === t0.id)!.y = topY;
    next.find((p) => p.id === t0.id)!.isFrontRow = true;
    const t1 = top[1];
    next.find((p) => p.id === t1.id)!.x = top[2].x;
    next.find((p) => p.id === t1.id)!.y = topY;
    next.find((p) => p.id === t1.id)!.isFrontRow = true;
    const t2 = top[2];
    next.find((p) => p.id === t2.id)!.y = bottomY;
    next.find((p) => p.id === t2.id)!.isFrontRow = false;
    const b2 = bottom[2];
    next.find((p) => p.id === b2.id)!.x = bottom[1].x;
    next.find((p) => p.id === b2.id)!.y = bottomY;
    next.find((p) => p.id === b2.id)!.isFrontRow = false;
    const b1 = bottom[1];
    next.find((p) => p.id === b1.id)!.x = bottom[0].x;
    next.find((p) => p.id === b1.id)!.y = bottomY;
    next.find((p) => p.id === b1.id)!.isFrontRow = false;
    const b0 = bottom[0];
    next.find((p) => p.id === b0.id)!.y = topY;
    next.find((p) => p.id === b0.id)!.isFrontRow = true;
    rotations.push(next);
  }
  return rotations;
}

function generate62Rotations(): Player[][] {
  const raw = generateRotations(base51);
  return raw.map((rot, index) => {
    const cloned: Player[] = rot.map((p) => ({ ...p }));
    if (index < 3) {
      cloned.forEach((p) => {
        if (p.id === "Setter1" || p.id === "Setter2") {
          p.id = "Setter1";
          p.label = "S1";
          p.color = COLORS.S;
        }
        if (p.id === "RS1" || p.id === "RS2") {
          p.id = "RS1";
          p.label = "RS1";
          p.color = COLORS.RS;
        }
      });
      return cloned;
    }
    const setter = cloned.find((p) => p.id === "Setter1" || p.id === "Setter2");
    const rs = cloned.find((p) => p.id === "RS1" || p.id === "RS2");
    if (setter && rs) {
      const setterOrigin = { x: setter.x, y: setter.y, isFrontRow: setter.isFrontRow };
      const rsOrigin = { x: rs.x, y: rs.y, isFrontRow: rs.isFrontRow };
      setter.id = "Setter2";
      setter.label = "S2";
      setter.color = COLORS.S;
      setter.x = rsOrigin.x;
      setter.y = rsOrigin.y;
      setter.isFrontRow = false;
      rs.id = "RS2";
      rs.label = "RS2";
      rs.color = COLORS.RS;
      rs.x = setterOrigin.x;
      rs.y = setterOrigin.y;
      rs.isFrontRow = true;
    }
    return cloned;
  });
}

export const rotations51 = generateRotations(base51);
export const rotations62 = generate62Rotations();

export function applyLiberoToBackRowMiddle(players: Player[]): Player[] {
  const backRowMiddle = players.find((p) => !p.isFrontRow && (p.id === "MB1" || p.id === "MB2"));
  if (!backRowMiddle) return players;
  const targetId = backRowMiddle.id;
  return players.map((p) =>
    p.id === targetId ? { ...p, label: "L", color: COLORS.L, isLibero: true } : { ...p, isLibero: false }
  );
}

export function getDefaultRotationDataInitial(system: "5-1" | "6-2"): RotationSnapshot[] {
  const defaults = system === "6-2" ? default62Rotations : default51Rotations;
  return [1, 2, 3, 4, 5, 6].map((r) => {
    const cfg = defaults.find((d) => d.rotation === r);
    return {
      players: cfg ? JSON.parse(JSON.stringify(cfg.players)) : [],
      annotations: [],
    };
  });
}

export const TOLERANCE = 2;

export function normalizePlayerId(id: string): string {
  if (id === "S1") return "Setter1";
  if (id === "S2") return "Setter2";
  return id;
}

export function playerIdToLineupKey(id: string): string {
  if (id === "Setter1") return "S1";
  if (id === "Setter2") return "S2";
  return id;
}

type RelativeConstraints = {
  rightOf?: string;
  leftOf?: string;
  inFrontOf?: string;
  behind?: string;
};

function getConstraintsForBase(base: Player[]): Record<string, RelativeConstraints> {
  const ROW_DELTA = 80;
  const COL_DELTA = 100;
  const result: Record<string, RelativeConstraints> = {};
  for (const p of base) {
    const pid = normalizePlayerId(p.id);
    const sameRow = base.filter((o) => o.id !== p.id && Math.abs(o.y - p.y) < ROW_DELTA);
    const leftNeighbor = sameRow.filter((o) => o.x < p.x).sort((a, b) => b.x - a.x)[0];
    const rightNeighbor = sameRow.filter((o) => o.x > p.x).sort((a, b) => a.x - b.x)[0];
    const sameCol = base.filter((o) => o.id !== p.id && Math.abs(o.x - p.x) < COL_DELTA);
    const frontNeighbor = sameCol.filter((o) => o.y < p.y).sort((a, b) => b.y - a.y)[0];
    const backNeighbor = sameCol.filter((o) => o.y > p.y).sort((a, b) => a.y - b.y)[0];
    result[pid] = {};
    if (leftNeighbor) result[pid].rightOf = normalizePlayerId(leftNeighbor.id);
    if (rightNeighbor) result[pid].leftOf = normalizePlayerId(rightNeighbor.id);
    if (frontNeighbor) result[pid].behind = normalizePlayerId(frontNeighbor.id);
    if (backNeighbor) result[pid].inFrontOf = normalizePlayerId(backNeighbor.id);
  }
  return result;
}

const constraintsCache: Record<string, Record<string, RelativeConstraints>> = {};

export function getConstraints(system: "5-1" | "6-2", rotation: number): Record<string, RelativeConstraints> {
  const key = `${system}-${rotation}`;
  if (!constraintsCache[key]) {
    const base = system === "6-2" ? rotations62[rotation - 1] : rotations51[rotation - 1];
    constraintsCache[key] = getConstraintsForBase(base);
  }
  return constraintsCache[key];
}

export function getPosById(players: Player[]): Record<string, { x: number; y: number }> {
  const map: Record<string, { x: number; y: number }> = {};
  for (const p of players) {
    map[normalizePlayerId(p.id)] = { x: p.x, y: p.y };
  }
  return map;
}

export function getBasePositions(system: "5-1" | "6-2", rotation: number): Record<string, { x: number; y: number }> {
  const base = system === "6-2" ? rotations62[rotation - 1] : rotations51[rotation - 1];
  return getPosById(base);
}

export function isValidRotation(players: Player[], system: "5-1" | "6-2", rotation: number): boolean {
  const constraints = getConstraints(system, rotation);
  const pos = getPosById(players);
  if (Object.keys(pos).length !== 6) return false;
  for (const [pid, c] of Object.entries(constraints)) {
    const p = pos[pid];
    if (!p) return false;
    if (c.rightOf != null) {
      const other = pos[c.rightOf];
      if (!other || p.x <= other.x + TOLERANCE) return false;
    }
    if (c.leftOf != null) {
      const other = pos[c.leftOf];
      if (!other || p.x >= other.x - TOLERANCE) return false;
    }
    if (c.inFrontOf != null) {
      const other = pos[c.inFrontOf];
      if (!other || p.y >= other.y - TOLERANCE) return false;
    }
    if (c.behind != null) {
      const other = pos[c.behind];
      if (!other || p.y <= other.y + TOLERANCE) return false;
    }
  }
  const basePos = getBasePositions(system, rotation);
  const pids = Object.keys(basePos);
  for (let i = 0; i < pids.length; i++) {
    for (let j = i + 1; j < pids.length; j++) {
      const a = pids[i];
      const b = pids[j];
      const baseA = basePos[a];
      const baseB = basePos[b];
      const curA = pos[a];
      const curB = pos[b];
      if (!curA || !curB) continue;
      if (baseA.x < baseB.x - TOLERANCE && curA.x >= curB.x - TOLERANCE) return false;
      if (baseB.x < baseA.x - TOLERANCE && curB.x >= curA.x - TOLERANCE) return false;
      if (baseA.y < baseB.y - TOLERANCE && curA.y >= curB.y - TOLERANCE) return false;
      if (baseB.y < baseA.y - TOLERANCE && curB.y >= curA.y - TOLERANCE) return false;
    }
  }
  return true;
}

export function getRotationSet(sys: "5-1" | "6-2"): Player[][] {
  return sys === "5-1" ? rotations51 : rotations62;
}
