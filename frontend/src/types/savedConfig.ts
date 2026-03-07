/**
 * Data models for saved Visualizer configurations and Plan Ahead plans.
 * Used by the UI and by the storage/API layer. Backend can map these to Postgres.
 *
 * Suggested Postgres schema (10k peak is trivial for Postgres; use JSONB for payloads):
 *
 *   users (id, email, ...)  -- from your auth
 *   saved_visualizer_configs (
 *     id UUID PRIMARY KEY,
 *     user_id UUID NOT NULL REFERENCES users(id),
 *     name TEXT NOT NULL,
 *     system TEXT NOT NULL,  -- '5-1' | '6-2'
 *     payload JSONB NOT NULL,  -- SavedVisualizerConfigPayload
 *     created_at TIMESTAMPTZ NOT NULL,
 *     updated_at TIMESTAMPTZ NOT NULL
 *   )
 *   saved_plans (
 *     id UUID PRIMARY KEY,
 *     user_id UUID NOT NULL REFERENCES users(id),
 *     name TEXT NOT NULL,
 *     payload JSONB NOT NULL,  -- SavedPlanPayload
 *     created_at TIMESTAMPTZ NOT NULL,
 *     updated_at TIMESTAMPTZ NOT NULL
 *   )
 */

import type { Lineup } from "../components/StartingLineup";

/** Single player position (court coordinates + display). */
export type SavedPlayer = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

/** One draw layer item (path or arrow). */
export type SavedAnnotation = {
  type: "path" | "arrow";
  points: number[];
  stroke?: string;
  pointerAtBeginning?: boolean;
  pointerAtEnding?: boolean;
  tension?: number;
};

/** One rotation's snapshot: player positions + annotations for that rotation. */
export type RotationSnapshot = {
  players: SavedPlayer[];
  annotations: SavedAnnotation[];
};

/** Payload for a saved Visualizer config: all 6 rotations. */
export type SavedVisualizerConfigPayload = {
  system: "5-1" | "6-2";
  rotations: RotationSnapshot[]; // length 6, index 0 = rotation 1
};

/** Full saved Visualizer config (payload + metadata; API may add id, userId, timestamps). */
export type SavedVisualizerConfig = SavedVisualizerConfigPayload & {
  name: string;
  id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Payload for a saved Plan Ahead plan. */
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

/** Full saved plan (payload + metadata). */
export type SavedPlan = SavedPlanPayload & {
  name: string;
  id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
