import { useState } from "react";

export function useExportState() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRotations, setExportRotations] = useState<boolean[]>([true, true, true, true, true, true]);
  const [exportLineupId, setExportLineupId] = useState<string | null>(null);
  const [exportConfigId, setExportConfigId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  return {
    showExportModal,
    setShowExportModal,
    exportRotations,
    setExportRotations,
    exportLineupId,
    setExportLineupId,
    exportConfigId,
    setExportConfigId,
    exporting,
    setExporting,
    previewPdfUrl,
    setPreviewPdfUrl,
  };
}
