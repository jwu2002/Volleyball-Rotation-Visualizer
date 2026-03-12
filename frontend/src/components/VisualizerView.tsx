import React, { useState, useRef, useCallback } from "react";
import type { RefObject } from "react";
import "../styles/VisualizerView.css";
import "../styles/StartingLineup.css";
import { Court, type CourtRef, type Annotation } from "./Court";
import { type Lineup, type LineupPositionId, type LineupEntry } from "./StartingLineup";
import { LineupTable } from "./LineupTable";
import { Toggle } from "./Toggle";
import { ExportModal, type ExportOptions } from "./Modals";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig, RotationSnapshot } from "../types/savedConfig";
import { getRoleColorFromId, applyLiberoToBackRowMiddle } from "../utils/visualizerRotations";
import { buildRotationTablePdf } from "../utils/exportPdf";
import { COURT_WIDTH, COURT_HEIGHT, COURT_TOOLBAR_HEIGHT } from "../constants";
import { auth } from "../firebaseConfig";
import { useCourtContext } from "../contexts/CourtContext";
import { useLineupContext } from "../contexts/LineupContext";
import { useConfigSaveContext } from "../contexts/ConfigSaveContext";
import { useAnnotationsContext } from "../contexts/AnnotationsContext";
import { useExportContext } from "../contexts/ExportContext";
import { useVisualizerContext } from "../contexts/VisualizerContext";
import type { AnnotationsContextValue } from "../contexts/AnnotationsContext";

export type VisualizerPlayer = {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  isFrontRow?: boolean;
  isLibero?: boolean;
};

export type VisualizerViewContext = {
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
  lineup: Lineup;
  handleLineupChange: (position: LineupPositionId, entry: LineupEntry) => void;
  lineupShowNumber: boolean;
  lineupShowName: boolean;
  setLineupShowNumber: (v: boolean) => void;
  setLineupShowName: (v: boolean) => void;
  savedLineups: { id: string; name: string; lineup: Lineup; showNumber: boolean; showName: boolean }[];
  selectedLineupId: string | null;
  handleSelectLineup: (id: string | null) => void;
  handleSaveLineupAsClick: () => void;
  handleSaveLineupClick: () => void;
  handleDeleteLineup: (id: string) => void;
  handleDeleteConfig: (id: string) => void;
  user: { isAnonymous?: boolean; email?: string | null } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  fileMenuOpen: boolean;
  setFileMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  activeView: "court" | "planAhead";
  customConfigs: SavedVisualizerConfig[];
  handleCustomConfigChange: (value: string) => void;
  setNewSystem: (v: "5-1" | "6-2") => void;
  setNewRotation: (v: number) => void;
  showSaveModal: boolean;
  newName: string;
  newSystem: "5-1" | "6-2";
  newRotation: number;
  saveRotationsMulti: boolean[];
  setNewName: (v: string) => void;
  setShowSaveModal: (v: boolean) => void;
  setSaveRotationsMulti: React.Dispatch<React.SetStateAction<boolean[]>>;
  handleSaveNewConfig: () => void;
  handleOverwriteCurrentConfig: () => void;
  showSaveLineupModal: boolean;
  saveLineupName: string;
  setSaveLineupName: (v: string) => void;
  setShowSaveLineupModal: (v: boolean) => void;
  handleSaveLineupSubmit: () => void;
  lineupExplorerOpen: boolean;
  setLineupExplorerOpen: (v: boolean) => void;
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
  drawMode: boolean;
  setDrawMode: (v: boolean) => void;
  drawPopoverOpen: boolean;
  setDrawPopoverOpen: (v: boolean) => void;
  drawTool: "select" | "pencil" | "arrow" | "eraser";
  setDrawTool: (v: "select" | "pencil" | "arrow" | "eraser") => void;
  pencilColor: string;
  setPencilColor: (v: string) => void;
  pencilMenuOpen: boolean;
  setPencilMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  arrowColor: string;
  setArrowColor: (v: string) => void;
  arrowMenuOpen: boolean;
  setArrowMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  arrowCurved: boolean;
  setArrowCurved: (v: boolean) => void;
  selectedAnnotationIndices: number[];
  setSelectedAnnotationIndices: React.Dispatch<React.SetStateAction<number[]>>;
  pushUndo: () => void;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  annotations: Annotation[];
  translateAnnotation: (ann: Annotation, dx: number, dy: number) => Annotation;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  handleReset: () => void;
  undoStackRef: React.MutableRefObject<Annotation[][]>;
  redoStackRef: React.MutableRefObject<Annotation[][]>;
  undoStackLength: number;
  redoStackLength: number;
  setUndoStackLength: (n: number) => void;
  setRedoStackLength: (n: number) => void;
  displayPlayers: VisualizerPlayer[];
  handleDragEnd: (id: string, x: number, y: number) => void;
  revertKey: number;
  showOutOfRotation: boolean;
  outOfRotationMessage: string;
  handleRevertOutOfRotation: () => void;
};

const DRAW_COLORS = ["#1a1a1a", "#e11d48", "#2563eb", "#16a34a"];

function undoClick(ann: AnnotationsContextValue) {
  if (ann.undoStackRef.current.length) {
    ann.redoStackRef.current.push(JSON.parse(JSON.stringify(ann.annotations)));
    ann.setRedoStackLength(ann.redoStackRef.current.length);
    ann.setAnnotations(ann.undoStackRef.current.pop()!);
    ann.setUndoStackLength(ann.undoStackRef.current.length);
    ann.setSelectedAnnotationIndices([]);
  }
}

function redoClick(ann: AnnotationsContextValue) {
  if (ann.redoStackRef.current.length) {
    ann.undoStackRef.current.push(JSON.parse(JSON.stringify(ann.annotations)));
    ann.setUndoStackLength(ann.undoStackRef.current.length);
    ann.setAnnotations(ann.redoStackRef.current.pop()!);
    ann.setRedoStackLength(ann.redoStackRef.current.length);
    ann.setSelectedAnnotationIndices([]);
  }
}

export function VisualizerView() {
  const court = useCourtContext();
  const lineup = useLineupContext();
  const configSave = useConfigSaveContext();
  const annotations = useAnnotationsContext();
  const exportCtx = useExportContext();
  const visualizer = useVisualizerContext();

  const courtRef = useRef<CourtRef>(null);
  const [signInTooltip, setSignInTooltip] = useState<"lineup" | "saveAs" | null>(null);
  const [lineupMenuOpen, setLineupMenuOpen] = useState(false);
  const needSignIn = !visualizer.user || visualizer.user.isAnonymous;
  const selectedLineupName = lineup.selectedLineupId ? lineup.savedLineups.find((l) => l.id === lineup.selectedLineupId)?.name ?? "" : "";

  const handleExportRequest = useCallback(
    async (opts: ExportOptions) => {
      const { applyLineup, lineupId, configId, rotations } = opts;
      if (rotations.length === 0) return;
      const rotationBefore = court.rotation;
      const lineupData =
        applyLineup && lineupId
          ? (lineup.savedLineups.find((l) => l.id === lineupId)?.lineup as Lineup) ?? {}
          : lineup.lineup;
      let rotationData: RotationSnapshot[];
      let configName: string;
      if (configId === "5-1-default" || configId === "6-2-default") {
        const def = configId === "5-1-default" ? default51Rotations[0] : default62Rotations[0];
        rotationData = (def?.rotations ?? []).map((snap) => ({
          players: applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players))),
          annotations: [] as { type: "path" | "arrow"; points: number[]; stroke?: string; pointerAtBeginning?: boolean; pointerAtEnding?: boolean; tension?: number }[],
        }));
        configName = def?.name ?? configId;
      } else {
        const config = configId ? configSave.customConfigs.find((cf) => cf.id === configId) : null;
        rotationData = config?.rotations ?? court.rotationData;
        configName = config?.name ?? (court.currentConfigDisplayName || `Default (${court.system} R${court.rotation})`);
      }
      exportCtx.setExporting(true);
      try {
        const pdfBytes = await buildRotationTablePdf({
          configName,
          rotationData,
          lineup: lineupData,
          applyLineup,
          rotations: rotations.sort((a, b) => a - b),
        });
        const blob = new Blob([pdfBytes.slice(0)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        exportCtx.setPreviewPdfUrl(url);
        exportCtx.setShowExportModal(false);
        visualizer.showToast("PDF ready. Preview below, then Save or Don't save.", "info");
      } catch (e) {
        console.error(e);
        visualizer.showToast(e instanceof Error ? e.message : "Export failed.", "error");
      } finally {
        exportCtx.setExporting(false);
        court.handleRotationChange(rotationBefore);
      }
    },
    [court, lineup, configSave, exportCtx, visualizer]
  );

  return (
    <>
      <div className="controls">
        <div className="control-group">
          <div className="segmented-control" role="group" aria-label="Serve or receive">
            <button
              type="button"
              className={`btn-segment ${!court.serveReceive ? "active" : ""}`}
              onClick={() => { court.setServeReceive(false); court.handleServeReceiveChange(false); }}
            >
              Serve
            </button>
            <button
              type="button"
              className={`btn-segment ${court.serveReceive ? "active" : ""}`}
              onClick={() => { court.setServeReceive(true); court.handleServeReceiveChange(true); }}
            >
              Receive
            </button>
          </div>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <span className="control-label">Rotation</span>
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn-rotation ${court.rotation === r ? "active" : ""}`}
              onClick={() => court.handleRotationChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <div className="segmented-control" role="group" aria-label="System">
            <button
              type="button"
              className={`btn-segment ${court.system === "5-1" ? "active" : ""}`}
              onClick={() => court.handleSystemChange("5-1")}
            >
              5-1
            </button>
            <button
              type="button"
              className={`btn-segment ${court.system === "6-2" ? "active" : ""}`}
              onClick={() => court.handleSystemChange("6-2")}
            >
              6-2
            </button>
          </div>
        </div>
        <span className="control-divider" />
        <div className="control-group control-group-libero">
          <span className="control-label">Libero</span>
          <Toggle
            checked={!!court.currentLibero}
            onChange={(checked) => {
              if (checked) {
                const backRow = court.players.filter((p) => !p.isFrontRow);
                court.setLiberoTargetId(backRow[0]?.id ?? null);
                court.setShowLiberoModal(true);
              } else if (court.currentLibero) {
                court.setPlayers((prev) =>
                  prev.map((p) =>
                    p.id !== court.currentLibero!.id
                      ? p
                      : { ...p, label: p.id, color: getRoleColorFromId(p.id), isLibero: false }
                  )
                );
              }
            }}
            aria-label="Libero on or off"
          />
        </div>
      </div>

      <div ref={court.mainContentRef} className="main-content">
        <div className="lineup-card">
          <div className="lineup-title">Lineup</div>
          <div className="lineup-saved-row">
            <div className="lineup-dropdown-wrap">
              <button
                type="button"
                className="lineup-dropdown-trigger"
                onClick={() => setLineupMenuOpen((o) => !o)}
                disabled={false}
                aria-expanded={lineupMenuOpen}
                aria-haspopup="listbox"
                aria-label="Saved lineups"
                title={lineup.selectedLineupId ? selectedLineupName : "New lineup"}
              >
                <span className="lineup-dropdown-trigger-text">
                  {lineup.selectedLineupId ? (selectedLineupName || "No lineup selected") : "New lineup"}
                </span>
                <span className="lineup-dropdown-trigger-arrow" aria-hidden>▼</span>
              </button>
              {lineupMenuOpen && (
                <>
                  <div className="court-toolbar-dropdown-backdrop" onClick={() => setLineupMenuOpen(false)} aria-hidden />
                  <div className="court-toolbar-dropdown lineup-dropdown-menu" role="listbox">
                    <div className="lineup-dropdown-item-row">
                      <button
                        type="button"
                        className={`lineup-dropdown-item ${!lineup.selectedLineupId ? "active" : ""}`}
                        role="option"
                        aria-selected={!lineup.selectedLineupId}
                        onClick={() => { lineup.handleSelectLineup(null); setLineupMenuOpen(false); }}
                        title="Clear lineup table and start fresh"
                      >
                        <span className="lineup-dropdown-item-name">Create new lineup</span>
                      </button>
                    </div>
                    {lineup.savedLineups.map((l) => (
                      <div key={l.id} className="lineup-dropdown-item-row">
                        <button
                          type="button"
                          className={`lineup-dropdown-item ${lineup.selectedLineupId === l.id ? "active" : ""}`}
                          role="option"
                          aria-selected={lineup.selectedLineupId === l.id}
                          onClick={() => { lineup.handleSelectLineup(l.id); setLineupMenuOpen(false); }}
                          title={l.name}
                        >
                          <span className="lineup-dropdown-item-name">{l.name}</span>
                        </button>
                        <button
                          type="button"
                          className="lineup-dropdown-delete"
                          onClick={(e) => { e.stopPropagation(); lineup.handleDeleteLineup(l.id); setLineupMenuOpen(false); }}
                          title="Delete lineup"
                          aria-label={`Delete ${l.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span
              className="btn-tooltip-wrap"
              onMouseEnter={() => needSignIn && setSignInTooltip("lineup")}
              onMouseLeave={() => setSignInTooltip(null)}
            >
              {needSignIn && <span className="btn-tooltip-overlay" aria-hidden />}
              <button
                type="button"
                className="btn-lineup-save"
                disabled={!visualizer.user || visualizer.user?.isAnonymous === true}
                onClick={lineup.handleSaveLineupAsClick}
              >
                Save as…
              </button>
              {needSignIn && signInTooltip === "lineup" && (
                <span className="signin-tooltip signin-tooltip-lineup" role="tooltip">Sign in to save lineup</span>
              )}
            </span>
            <button
              type="button"
              className="btn-lineup-save"
              disabled={!visualizer.user || visualizer.user?.isAnonymous === true || !lineup.selectedLineupId}
              onClick={lineup.handleSaveLineupClick}
            >
              Save
            </button>
          </div>
          <LineupTable
            title="Lineup"
            lineup={lineup.lineup}
            onLineupChange={lineup.handleLineupChange}
            showNumber={lineup.lineupShowNumber}
            showName={lineup.lineupShowName}
            onShowNumberChange={lineup.setLineupShowNumber}
            onShowNameChange={lineup.setLineupShowName}
          />
        </div>
        <div className="court-column">
          <div className="court-toolbar-wrap">
            <div className="court-toolbar court-toolbar-bar" role="toolbar" aria-label="Court and drawing tools">
              <div className="court-toolbar-group court-toolbar-file">
                <div className="court-toolbar-dropdown-wrap">
                  <button
                    type="button"
                    className="court-toolbar-btn"
                    onClick={() => visualizer.setFileMenuOpen((o) => !o)}
                    aria-expanded={visualizer.fileMenuOpen}
                    aria-haspopup="true"
                  >
                    File
                  </button>
                  {visualizer.fileMenuOpen && (
                    <>
                      <div className="court-toolbar-dropdown-backdrop" onClick={() => visualizer.setFileMenuOpen(false)} aria-hidden />
                      <div className="court-toolbar-dropdown" role="menu">
                        {visualizer.activeView === "court" && (
                          <>
                            <span
                              className="court-toolbar-dropdown-item-wrap"
                              onMouseEnter={() => needSignIn && setSignInTooltip("saveAs")}
                              onMouseLeave={() => setSignInTooltip(null)}
                            >
                              {needSignIn && <span className="court-toolbar-dropdown-item-overlay" aria-hidden />}
                              <button
                                type="button"
                                className="court-toolbar-dropdown-item"
                                role="menuitem"
                                disabled={!visualizer.user || visualizer.user.isAnonymous === true}
                                onClick={() => {
                                visualizer.setFileMenuOpen(false);
                                const currentUser = auth.currentUser;
                                if (!currentUser || currentUser.isAnonymous) {
                                  visualizer.showToast("Sign in to save configurations.", "info");
                                  return;
                                }
                                const allDefaults = [...default51Rotations, ...default62Rotations];
                                let sys: "5-1" | "6-2" = court.system;
                                let rot = court.rotation;
                                if (configSave.customConfigKey.includes("-default")) {
                                  const def = allDefaults.find((d) => d.id === configSave.customConfigKey);
                                  if (def) sys = def.system as "5-1" | "6-2";
                                  rot = court.rotation;
                                } else if (configSave.customConfigKey.startsWith("custom:")) {
                                  const cfg = configSave.customConfigs.find((cf) => cf.id === configSave.customConfigKey.split("custom:")[1]);
                                  if (cfg) {
                                    sys = (cfg as SavedVisualizerConfig).system ?? "5-1";
                                    rot = 1;
                                  }
                                }
                                configSave.setNewSystem(sys);
                                configSave.setNewRotation(rot);
                                const r = court.rotation;
                                configSave.setSaveRotationsMulti([r === 1, r === 2, r === 3, r === 4, r === 5, r === 6]);
                                configSave.setShowSaveModal(true);
                              }}
                              >
                                Save as…
                              </button>
                              {needSignIn && signInTooltip === "saveAs" && (
                                <span className="signin-tooltip signin-tooltip-saveas" role="tooltip">Sign in to save configurations</span>
                              )}
                            </span>
                            <button
                              type="button"
                              className="court-toolbar-dropdown-item"
                              role="menuitem"
                              disabled={!visualizer.user || !configSave.customConfigKey.startsWith("custom:")}
                              onClick={() => { visualizer.setFileMenuOpen(false); configSave.handleOverwriteCurrentConfig(); }}
                            >
                              Save
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="court-toolbar-dropdown-item"
                          role="menuitem"
                          onClick={() => { visualizer.setFileMenuOpen(false); lineup.setLineupExplorerOpen(true); }}
                        >
                          Custom config…
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="court-toolbar-sep" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className={`court-toolbar-btn court-toolbar-draw-toggle ${annotations.drawPopoverOpen ? "draw-toggle-open" : ""}`}
                  onClick={() => {
                    if (annotations.drawMode && annotations.drawPopoverOpen) {
                      annotations.setDrawPopoverOpen(false);
                      annotations.setDrawMode(false);
                      annotations.setSelectedAnnotationIndices([]);
                    } else if (!annotations.drawMode) {
                      annotations.setDrawPopoverOpen(true);
                      annotations.setDrawMode(true);
                    } else {
                      annotations.setDrawPopoverOpen(true);
                    }
                  }}
                >
                  Draw
                </button>
              </div>
              <span className="court-toolbar-sep court-toolbar-sep-main" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className={`court-toolbar-btn ${court.isLocked ? "active" : ""}`}
                  onClick={() => court.setIsLocked(!court.isLocked)}
                >
                  {court.isLocked ? "Unlock" : "Lock"}
                </button>
                <button type="button" className="court-toolbar-btn" onClick={court.handleReset}>
                  Reset
                </button>
              </div>
              <span className="court-toolbar-sep" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => undoClick(annotations)}
                  disabled={annotations.undoStackLength === 0}
                  title="Undo (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => redoClick(annotations)}
                  disabled={annotations.redoStackLength === 0}
                  title="Redo (Ctrl+Y)"
                >
                  Redo
                </button>
                <button type="button" className="court-toolbar-btn" onClick={() => { annotations.pushUndo(); annotations.setAnnotations([]); }} title="Clear all annotations">
                  Clear
                </button>
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => {
                    exportCtx.setExportLineupId(lineup.selectedLineupId);
                    exportCtx.setShowExportModal(true);
                  }}
                  title="Export as PDF"
                >
                  Export
                </button>
              </div>
              <span className="court-toolbar-sep court-toolbar-sep-fill" aria-hidden />
              <div className="court-toolbar-config-badge" aria-live="polite">
                <span className="court-toolbar-config-badge-label">Config</span>
                <span className="court-toolbar-config-badge-value" title={court.currentConfigDisplayName || `Default (${court.system} R${court.rotation})`}>
                  {court.currentConfigDisplayName || `Default (${court.system} R${court.rotation})`}
                </span>
              </div>
            </div>
            {annotations.drawMode && annotations.drawPopoverOpen && (
              <div className="draw-toolbar-popover" role="toolbar" aria-label="Drawing tools">
                <div className="draw-toolbar-row">
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${annotations.drawTool === "select" ? "active-subtle" : ""}`}
                    onClick={() => { annotations.setDrawTool("select"); annotations.setSelectedAnnotationIndices([]); annotations.setPencilMenuOpen(false); annotations.setArrowMenuOpen(false); }}
                    title="Select"
                    aria-label="Select"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>
                  </button>
                  <div className="draw-toolbar-icon-wrap">
                    <button
                      type="button"
                      className={`court-toolbar-btn court-toolbar-btn-icon ${annotations.drawTool === "pencil" ? "active" : ""}`}
                      onClick={() => { annotations.setDrawTool("pencil"); annotations.setArrowMenuOpen(false); annotations.setPencilMenuOpen((o) => !o); }}
                      title="Pencil"
                      aria-label="Pencil"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={annotations.pencilColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 15.5L13 18l5-5z" /><path d="M2 2l7.5 7.5" /></svg>
                    </button>
                    {annotations.pencilMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        {DRAW_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`draw-color-swatch ${annotations.pencilColor === color ? "active" : ""}`}
                            style={{ background: color }}
                            onClick={() => { annotations.setPencilColor(color); annotations.setPencilMenuOpen(false); }}
                            title={color}
                            aria-label={`Color ${color}`}
                            role="menuitem"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="draw-toolbar-icon-wrap">
                    <button
                      type="button"
                      className={`court-toolbar-btn court-toolbar-btn-icon ${annotations.drawTool === "arrow" ? "active" : ""}`}
                      onClick={() => { annotations.setDrawTool("arrow"); annotations.setPencilMenuOpen(false); annotations.setArrowMenuOpen((o) => !o); }}
                      title="Arrow"
                      aria-label="Arrow"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={annotations.arrowColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                    </button>
                    {annotations.arrowMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        <div className="draw-toolbar-icon-menu-colors">
                          {DRAW_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`draw-color-swatch ${annotations.arrowColor === color ? "active" : ""}`}
                              style={{ background: color }}
                              onClick={() => annotations.setArrowColor(color)}
                              title={color}
                              aria-label={`Arrow color ${color}`}
                              role="menuitem"
                            />
                          ))}
                        </div>
                        <label className="court-toolbar-check draw-toolbar-icon-menu-curved">
                          <input type="checkbox" checked={annotations.arrowCurved} onChange={(e) => annotations.setArrowCurved(e.target.checked)} />
                          Curved
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${annotations.drawTool === "eraser" ? "active-subtle" : ""}`}
                    onClick={() => { annotations.setDrawTool("eraser"); annotations.setPencilMenuOpen(false); annotations.setArrowMenuOpen(false); }}
                    title="Eraser"
                    aria-label="Eraser"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-7 7z" /><path d="M13 7l7 7" /></svg>
                  </button>
                </div>
                {annotations.drawTool === "select" && annotations.selectedAnnotationIndices.length > 0 && (
                  <div className="draw-toolbar-row draw-toolbar-options draw-toolbar-colors">
                    <span className="draw-toolbar-label">Color</span>
                    {DRAW_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="draw-color-swatch"
                        style={{ background: color }}
                        onClick={() => {
                          annotations.pushUndo();
                          annotations.setAnnotations((prev) =>
                            prev.map((ann, i) =>
                              annotations.selectedAnnotationIndices.includes(i) ? { ...ann, stroke: color } : ann
                            )
                          );
                        }}
                        title={color}
                        aria-label={`Change color to ${color}`}
                      />
                    ))}
                  </div>
                )}
                <div className="draw-toolbar-row draw-toolbar-actions">
                  {annotations.selectedAnnotationIndices.length > 0 && (
                    <button
                      type="button"
                      className="court-toolbar-btn"
                      onClick={() => {
                        annotations.pushUndo();
                        annotations.setAnnotations((prev) => prev.filter((_, i) => !annotations.selectedAnnotationIndices.includes(i)));
                        annotations.setSelectedAnnotationIndices([]);
                      }}
                    >
                      Delete selected
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="court-scaled-wrap" ref={court.courtContainerRef}>
            <div
              className="court-scaled-inner"
              style={{
                width: COURT_WIDTH * court.courtScale,
                height: COURT_HEIGHT * court.courtScale,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: COURT_WIDTH,
                  height: COURT_HEIGHT,
                  minWidth: COURT_WIDTH,
                  minHeight: COURT_HEIGHT,
                  transform: `scale(${court.courtScale})`,
                  transformOrigin: "top left",
                }}
              >
                {court.courtContainerReady && (
                  <Court
                    ref={courtRef}
                    players={court.displayPlayers}
                    isLocked={court.isLocked || annotations.drawMode}
                    onDragEnd={court.handleDragEnd}
                    onColorChange={() => {}}
                    revertKey={court.revertKey}
                    annotations={court.annotations}
                    drawMode={annotations.drawMode}
                    drawTool={annotations.drawTool}
                    pencilColor={annotations.pencilColor}
                    arrowColor={annotations.arrowColor}
                    arrowTension={annotations.arrowCurved ? 1 : 0}
                    selectedAnnotationIndices={annotations.selectedAnnotationIndices}
                    onAnnotationAdd={(ann) => annotations.setAnnotations((prev) => { annotations.pushUndo(); return [...prev, ann]; })}
                    onAnnotationsClear={() => { annotations.pushUndo(); annotations.setAnnotations([]); }}
                    onAnnotationRemove={(i) => annotations.setAnnotations((prev) => { annotations.pushUndo(); return prev.filter((_, idx) => idx !== i); })}
                    onSelectionChange={annotations.setSelectedAnnotationIndices}
                    onDrawActionStart={() => { annotations.setDrawPopoverOpen(false); annotations.setPencilMenuOpen(false); annotations.setArrowMenuOpen(false); }}
                    onSelectionDragStart={annotations.pushUndo}
                    onSelectedAnnotationsMove={(dx, dy) => annotations.setAnnotations((prev) => prev.map((ann, i) => annotations.selectedAnnotationIndices.includes(i) ? annotations.translateAnnotation(ann, dx, dy) : ann))}
                    onAnnotationUpdate={(i, ann) => annotations.setAnnotations((prev) => prev.map((a, idx) => (idx === i ? ann : a)))}
                    onClearSelection={() => annotations.setSelectedAnnotationIndices([])}
                  />
                )}
              </div>
            </div>
          </div>
          <ExportModal
            open={exportCtx.showExportModal}
            onClose={() => exportCtx.setShowExportModal(false)}
            savedLineups={lineup.savedLineups}
            exportLineupId={exportCtx.exportLineupId}
            onExportLineupIdChange={exportCtx.setExportLineupId}
            customConfigs={[
              { id: "5-1-default", name: "5-1 Default" },
              { id: "6-2-default", name: "6-2 Default" },
              ...configSave.customConfigs.filter((cf) => cf.id).map((cf) => ({ id: cf.id!, name: cf.name })),
            ]}
            exportConfigId={exportCtx.exportConfigId}
            onExportConfigIdChange={exportCtx.setExportConfigId}
            rotations={exportCtx.exportRotations}
            onRotationsChange={(i, v) => exportCtx.setExportRotations((prev) => prev.map((x, j) => (j === i ? v : x)))}
            onExport={handleExportRequest}
            exporting={exportCtx.exporting}
          />
          {court.showOutOfRotation && (
            <div
              className="out-of-rotation-overlay"
              style={{ top: COURT_TOOLBAR_HEIGHT }}
              role="alert"
            >
              <div className="out-of-rotation-card">
                <p className="out-of-rotation-message">{court.outOfRotationMessage || "Out of rotation"}</p>
                <button
                  type="button"
                  className="out-of-rotation-revert-btn"
                  onClick={court.handleRevertOutOfRotation}
                >
                  Ok
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
