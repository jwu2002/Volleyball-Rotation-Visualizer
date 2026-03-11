import React, { createContext, useContext, type RefObject } from "react";
import type { Annotation } from "../components/Court";
import type { VisualizerPlayer } from "../components/VisualizerView";
import type { RotationSnapshot } from "../types/savedConfig";

export type CourtContextValue = {
  mainContentRef: RefObject<HTMLDivElement | null>;
  courtContainerRef: RefObject<HTMLDivElement | null>;
  courtScale: number;
  courtContainerReady: boolean;
  serveReceive: boolean;
  setServeReceive: (v: boolean) => void;
  rotation: number;
  rotationData: RotationSnapshot[];
  system: "5-1" | "6-2";
  customConfigKey: string;
  currentConfigDisplayName: string;
  updatePlayers: (sys: "5-1" | "6-2", rot: number, receive: boolean) => void;
  handleServeReceiveChange: (useReceive: boolean) => void;
  handleRotationChange: (r: number) => void;
  handleSystemChange: (sys: "5-1" | "6-2") => void;
  players: VisualizerPlayer[];
  currentLibero: VisualizerPlayer | undefined;
  setPlayers: React.Dispatch<React.SetStateAction<VisualizerPlayer[]>>;
  showLiberoModal: boolean;
  liberoTargetId: string | null;
  setLiberoTargetId: (id: string | null) => void;
  setShowLiberoModal: (v: boolean) => void;
  handleConfirmLiberoSwitch: () => void;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  handleReset: () => void;
  displayPlayers: VisualizerPlayer[];
  handleDragEnd: (id: string, x: number, y: number) => void;
  revertKey: number;
  showOutOfRotation: boolean;
  outOfRotationMessage: string;
  handleRevertOutOfRotation: () => void;
  handleCustomConfigChange: (value: string) => void;
};

const CourtContext = createContext<CourtContextValue | null>(null);

export function useCourtContext(): CourtContextValue {
  const value = useContext(CourtContext);
  if (!value) throw new Error("useCourtContext must be used within VisualizerProvider");
  return value;
}

export { CourtContext };
