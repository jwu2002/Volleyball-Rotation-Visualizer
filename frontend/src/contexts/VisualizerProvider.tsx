import React, { useRef, useEffect, useMemo } from "react";
import { useSavedData } from "../hooks/useSavedData";
import { useCourtState } from "../hooks/useCourtState";
import { useAnnotationsState } from "../hooks/useAnnotationsState";
import { useLineupState } from "../hooks/useLineupState";
import { useConfigSaveState } from "../hooks/useConfigSaveState";
import { useExportState } from "../hooks/useExportState";
import { getDisplayLabel } from "../utils/lineupHelpers";
import type { VisualizerPlayer } from "../components/VisualizerView";
import { CourtContext } from "./CourtContext";
import { LineupContext } from "./LineupContext";
import { ConfigSaveContext } from "./ConfigSaveContext";
import { AnnotationsContext } from "./AnnotationsContext";
import { ExportContext } from "./ExportContext";
import { VisualizerContext } from "./VisualizerContext";

type ToastType = "success" | "error" | "info";

type Props = {
  children: React.ReactNode;
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null;
  activeView: "court" | "planAhead";
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
};

export function VisualizerProvider({ children, user, activeView, showToast, showConfirm }: Props) {
  const {
    savedLineups,
    customConfigs,
    selectedLineupId,
    setSelectedLineupId,
    fetchSavedLineups,
    fetchCustomConfigs,
  } = useSavedData(user, { showToast });

  const clearAnnotationSelectionRef = useRef<(() => void) | undefined>(undefined);
  const courtState = useCourtState(user, activeView, customConfigs, {
    showToast,
    clearAnnotationSelectionRef,
  });

  const annotationsState = useAnnotationsState(courtState.annotations, courtState.setAnnotations);
  useEffect(() => {
    clearAnnotationSelectionRef.current = () => annotationsState.setSelectedAnnotationIndices([]);
    return () => {
      clearAnnotationSelectionRef.current = undefined;
    };
  }, [annotationsState.setSelectedAnnotationIndices]);

  const lineupState = useLineupState(
    user,
    { savedLineups, selectedLineupId, setSelectedLineupId, fetchSavedLineups },
    showToast,
    showConfirm
  );

  const configSaveState = useConfigSaveState(
    user,
    {
      system: courtState.system,
      rotationData: courtState.rotationData,
      players: courtState.players,
      annotations: courtState.annotations,
      rotation: courtState.rotation,
      customConfigKey: courtState.customConfigKey,
      setSystem: courtState.setSystem,
      setRotation: courtState.setRotation,
      setRotationData: courtState.setRotationData,
      setPlayers: courtState.setPlayers,
      setAnnotations: courtState.setAnnotations,
      setCustomConfigKey: courtState.setCustomConfigKey,
      updatePlayers: courtState.updatePlayers,
    },
    { customConfigs, fetchCustomConfigs },
    showToast,
    showConfirm
  );

  const exportState = useExportState();
  const [fileMenuOpen, setFileMenuOpen] = React.useState(false);

  const displayPlayers = useMemo(
    () =>
      courtState.players.map((p) => ({
        ...p,
        label: getDisplayLabel(
          p.isLibero ? "L" : p.id,
          p.label,
          lineupState.lineup,
          lineupState.lineupShowNumber,
          lineupState.lineupShowName
        ),
      })) as VisualizerPlayer[],
    [courtState.players, lineupState.lineup, lineupState.lineupShowNumber, lineupState.lineupShowName]
  );

  const courtValue = useMemo(
    (): React.ContextType<typeof CourtContext> => ({
      mainContentRef: courtState.mainContentRef,
      courtContainerRef: courtState.courtContainerRef,
      courtScale: courtState.courtScale,
      courtContainerReady: courtState.courtContainerReady,
      serveReceive: courtState.serveReceive,
      setServeReceive: courtState.setServeReceive,
      rotation: courtState.rotation,
      rotationData: courtState.rotationData,
      system: courtState.system,
      customConfigKey: courtState.customConfigKey,
      currentConfigDisplayName: courtState.currentConfigDisplayName,
      updatePlayers: courtState.updatePlayers,
      handleServeReceiveChange: courtState.handleServeReceiveChange,
      handleRotationChange: courtState.handleRotationChange,
      handleSystemChange: courtState.handleSystemChange,
      players: courtState.players as VisualizerPlayer[],
      currentLibero: courtState.currentLibero as VisualizerPlayer | undefined,
      setPlayers: courtState.setPlayers as React.Dispatch<React.SetStateAction<VisualizerPlayer[]>>,
      showLiberoModal: courtState.showLiberoModal,
      liberoTargetId: courtState.liberoTargetId,
      setLiberoTargetId: courtState.setLiberoTargetId,
      setShowLiberoModal: courtState.setShowLiberoModal,
      handleConfirmLiberoSwitch: courtState.handleConfirmLiberoSwitch,
      annotations: courtState.annotations,
      setAnnotations: courtState.setAnnotations,
      isLocked: courtState.isLocked,
      setIsLocked: courtState.setIsLocked,
      handleReset: courtState.handleReset,
      displayPlayers,
      handleDragEnd: courtState.handleDragEnd,
      revertKey: courtState.revertKey,
      showOutOfRotation: courtState.showOutOfRotation,
      outOfRotationMessage: courtState.outOfRotationMessage,
      handleRevertOutOfRotation: courtState.handleRevertOutOfRotation,
      handleCustomConfigChange: courtState.handleCustomConfigChange,
    }),
    [courtState, displayPlayers]
  );

  const lineupValue = useMemo(
    (): React.ContextType<typeof LineupContext> => ({
      ...lineupState,
      savedLineups,
      selectedLineupId,
    }),
    [lineupState, savedLineups, selectedLineupId]
  );
  const configSaveValue = useMemo(
    (): React.ContextType<typeof ConfigSaveContext> => ({
      ...configSaveState,
      customConfigs,
      customConfigKey: courtState.customConfigKey,
      handleCustomConfigChange: courtState.handleCustomConfigChange,
      rotation: courtState.rotation,
    }),
    [configSaveState, customConfigs, courtState.customConfigKey, courtState.handleCustomConfigChange, courtState.rotation]
  );
  const annotationsValue = useMemo(
    (): React.ContextType<typeof AnnotationsContext> => ({
      ...annotationsState,
      annotations: courtState.annotations,
      setAnnotations: courtState.setAnnotations,
    }),
    [annotationsState, courtState.annotations, courtState.setAnnotations]
  );
  const exportValue = useMemo(() => exportState, [exportState]);
  const visualizerValue = useMemo(
    () => ({
      user,
      showToast,
      activeView,
      fileMenuOpen,
      setFileMenuOpen,
    }),
    [user, showToast, activeView, fileMenuOpen]
  );

  return (
    <CourtContext.Provider value={courtValue}>
      <LineupContext.Provider value={lineupValue}>
        <ConfigSaveContext.Provider value={configSaveValue}>
          <AnnotationsContext.Provider value={annotationsValue}>
            <ExportContext.Provider value={exportValue}>
              <VisualizerContext.Provider value={visualizerValue}>
                {children}
              </VisualizerContext.Provider>
            </ExportContext.Provider>
          </AnnotationsContext.Provider>
        </ConfigSaveContext.Provider>
      </LineupContext.Provider>
    </CourtContext.Provider>
  );
}
