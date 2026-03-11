import { createContext, useContext } from "react";

export type VisualizerContextValue = {
  user: { isAnonymous?: boolean; email?: string | null } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  activeView: "court" | "planAhead";
  fileMenuOpen: boolean;
  setFileMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
};

const VisualizerContext = createContext<VisualizerContextValue | null>(null);

export function useVisualizerContext(): VisualizerContextValue {
  const value = useContext(VisualizerContext);
  if (!value) throw new Error("useVisualizerContext must be used within VisualizerProvider");
  return value;
}

export { VisualizerContext };
