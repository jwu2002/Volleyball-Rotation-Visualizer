import React, { createContext, useContext } from "react";
import type { SavedVisualizerConfig } from "../types/savedConfig";

export type ConfigSaveContextValue = {
  showSaveModal: boolean;
  newName: string;
  newSystem: "5-1" | "6-2";
  newRotation: number;
  saveConfigMode: "one" | "multi";
  saveRotationOne: number;
  saveRotationsMulti: boolean[];
  setNewName: (v: string) => void;
  setShowSaveModal: (v: boolean) => void;
  setSaveConfigMode: (v: "one" | "multi") => void;
  setSaveRotationOne: (v: number) => void;
  setSaveRotationsMulti: React.Dispatch<React.SetStateAction<boolean[]>>;
  handleSaveNewConfig: () => void;
  handleOverwriteCurrentConfig: () => void;
  handleDeleteConfig: (id: string) => void;
  customConfigs: SavedVisualizerConfig[];
  customConfigKey: string;
  handleCustomConfigChange: (value: string) => void;
  setNewSystem: (v: "5-1" | "6-2") => void;
  setNewRotation: (v: number) => void;
  rotation: number;
};

const ConfigSaveContext = createContext<ConfigSaveContextValue | null>(null);

export function useConfigSaveContext(): ConfigSaveContextValue {
  const value = useContext(ConfigSaveContext);
  if (!value) throw new Error("useConfigSaveContext must be used within VisualizerProvider");
  return value;
}

export { ConfigSaveContext };
