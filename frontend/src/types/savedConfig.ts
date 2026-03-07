import type { Lineup } from "../components/StartingLineup";

export type SavedPlayer = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

export type SavedAnnotation = {
  type: "path" | "arrow";
  points: number[];
  stroke?: string;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
  tension?: number;
};

export type RotationSnapshot = {
  players: SavedPlayer[];
  annotations: SavedAnnotation[];
};

export type SavedVisualizerConfigPayload = {
  system: "5-1" | "6-2";
  rotations: RotationSnapshot[];
};

export type SavedVisualizerConfig = SavedVisualizerConfigPayload & {
  name: string;
  id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SavedPlanPayload = {
  lineupA: Lineup;
  lineupB: Lineup;
  systemA: "5-1" | "6-2";
  systemB: "5-1" | "6-2";
  serveTeam: "A" | "B";
  rotationA: number;
  rotationB: number;
  annotations: SavedAnnotation[];
};

export type SavedPlan = SavedPlanPayload & {
  name: string;
  id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
