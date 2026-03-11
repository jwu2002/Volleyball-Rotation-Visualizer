import React, { createContext, useContext } from "react";

export type ExportContextValue = {
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;
  exportRotations: boolean[];
  setExportRotations: React.Dispatch<React.SetStateAction<boolean[]>>;
  exportLineupId: string | null;
  setExportLineupId: (v: string | null) => void;
  exportConfigId: string | null;
  setExportConfigId: (v: string | null) => void;
  exporting: boolean;
  setExporting: (v: boolean) => void;
  previewPdfUrl: string | null;
  setPreviewPdfUrl: (v: string | null) => void;
};

const ExportContext = createContext<ExportContextValue | null>(null);

export function useExportContext(): ExportContextValue {
  const value = useContext(ExportContext);
  if (!value) throw new Error("useExportContext must be used within VisualizerProvider");
  return value;
}

export { ExportContext };
