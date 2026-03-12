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
  /** When present, annotations for "Serve" mode for this rotation; main `annotations` is for "Receive". */
  serveAnnotations?: SavedAnnotation[];
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
