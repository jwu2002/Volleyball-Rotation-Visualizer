import { createContext, useContext } from "react";
import type { Lineup, LineupPositionId, LineupEntry } from "../components/StartingLineup";

export type SavedLineupItem = {
  id: string;
  name: string;
  lineup: Lineup;
  showNumber: boolean;
  showName: boolean;
};

export type LineupContextValue = {
  lineup: Lineup;
  handleLineupChange: (position: LineupPositionId, entry: LineupEntry) => void;
  lineupShowNumber: boolean;
  lineupShowName: boolean;
  setLineupShowNumber: (v: boolean) => void;
  setLineupShowName: (v: boolean) => void;
  savedLineups: SavedLineupItem[];
  selectedLineupId: string | null;
  handleSelectLineup: (id: string | null) => void;
  handleSaveLineupAsClick: () => void;
  handleSaveLineupClick: () => void;
  handleDeleteLineup: (id: string) => void;
  showSaveLineupModal: boolean;
  saveLineupName: string;
  setSaveLineupName: (v: string) => void;
  setShowSaveLineupModal: (v: boolean) => void;
  handleSaveLineupSubmit: () => void;
  lineupExplorerOpen: boolean;
  setLineupExplorerOpen: (v: boolean) => void;
};

const LineupContext = createContext<LineupContextValue | null>(null);

export function useLineupContext(): LineupContextValue {
  const value = useContext(LineupContext);
  if (!value) throw new Error("useLineupContext must be used within VisualizerProvider");
  return value;
}

export { LineupContext };
