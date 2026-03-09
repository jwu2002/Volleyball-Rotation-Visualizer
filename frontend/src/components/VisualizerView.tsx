import React from "react";
import type { RefObject } from "react";
import "../styles/VisualizerView.css";
import "../styles/StartingLineup.css";
import { Court, type Annotation } from "./Court";
import { StartingLineup, type Lineup, type LineupPositionId, type LineupEntry } from "./StartingLineup";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig } from "../types/savedConfig";
import { getRoleColorFromId } from "../utils/visualizerRotations";
import { COURT_WIDTH, COURT_HEIGHT, COURT_TOOLBAR_HEIGHT } from "../constants";

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
  savedLineups: { id: string; name: string; lineup: Lineup; showNumber: boolean; showName: boolean }[];
  selectedLineupId: string | null;
  handleSelectLineup: (id: string | null) => void;
  handleSaveLineupClick: () => void;
  user: { isAnonymous?: boolean; email?: string | null } | null;
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
  showSaveLineupModal: boolean;
  saveLineupName: string;
  setSaveLineupName: (v: string) => void;
  setShowSaveLineupModal: (v: boolean) => void;
  handleSaveLineupSubmit: () => void;
  showSavePlanModal: boolean;
  savePlanName: string;
  setSavePlanName: (v: string) => void;
  setShowSavePlanModal: (v: boolean) => void;
  lineupExplorerOpen: boolean;
  setLineupExplorerOpen: (v: boolean) => void;
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

function undoClick(ctx: VisualizerViewContext) {
  if (ctx.undoStackRef.current.length) {
    ctx.redoStackRef.current.push(JSON.parse(JSON.stringify(ctx.annotations)));
    ctx.setRedoStackLength(ctx.redoStackRef.current.length);
    ctx.setAnnotations(ctx.undoStackRef.current.pop()!);
    ctx.setUndoStackLength(ctx.undoStackRef.current.length);
    ctx.setSelectedAnnotationIndices([]);
  }
}

function redoClick(ctx: VisualizerViewContext) {
  if (ctx.redoStackRef.current.length) {
    ctx.undoStackRef.current.push(JSON.parse(JSON.stringify(ctx.annotations)));
    ctx.setUndoStackLength(ctx.undoStackRef.current.length);
    ctx.setAnnotations(ctx.redoStackRef.current.pop()!);
    ctx.setRedoStackLength(ctx.redoStackRef.current.length);
    ctx.setSelectedAnnotationIndices([]);
  }
}

type Props = { ctx: VisualizerViewContext };

export function VisualizerView({ ctx }: Props) {
  const c = ctx;
  return (
    <>
      <div className="controls">
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={!c.serveReceive}
              onChange={() => { c.setServeReceive(false); c.handleServeReceiveChange(false); }}
            />
            Serve
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.serveReceive}
              onChange={() => { c.setServeReceive(true); c.handleServeReceiveChange(true); }}
            />
            Receive
          </label>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <span className="control-label">Rotation</span>
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn-rotation ${c.rotation === r ? "active" : ""}`}
              onClick={() => c.handleRotationChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.system === "5-1"}
              onChange={() => c.handleSystemChange("5-1")}
            />
            5-1
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={c.system === "6-2"}
              onChange={() => c.handleSystemChange("6-2")}
            />
            6-2
          </label>
        </div>
        <span className="control-divider" />
        <div className="control-group">
          <label className="control-check">
            <input
              type="checkbox"
              checked={!!c.currentLibero}
              onChange={() => {
                if (c.currentLibero) {
                  c.setPlayers((prev) =>
                    prev.map((p) =>
                      p.id !== c.currentLibero!.id
                        ? p
                        : { ...p, label: p.id, color: getRoleColorFromId(p.id), isLibero: false }
                    )
                  );
                } else {
                  const backRow = c.players.filter((p) => !p.isFrontRow);
                  c.setLiberoTargetId(backRow[0]?.id ?? null);
                  c.setShowLiberoModal(true);
                }
              }}
            />
            Libero
          </label>
        </div>
      </div>

      <div ref={c.mainContentRef} className="main-content">
        <StartingLineup
          lineup={c.lineup}
          showNumber={true}
          showName={false}
          onLineupChange={c.handleLineupChange}
          onShowNumberChange={() => {}}
          onShowNameChange={() => {}}
          savedLineups={c.savedLineups}
          selectedLineupId={c.selectedLineupId}
          onSelectLineup={c.handleSelectLineup}
          onSaveLineupClick={c.handleSaveLineupClick}
          user={c.user}
        />
        <div className="court-column">
          <div className="court-toolbar-wrap">
            <div className="court-toolbar court-toolbar-bar" role="toolbar" aria-label="Court and drawing tools">
              <div className="court-toolbar-group court-toolbar-file">
                <div className="court-toolbar-dropdown-wrap">
                  <button
                    type="button"
                    className="court-toolbar-btn"
                    onClick={() => c.setFileMenuOpen((o) => !o)}
                    aria-expanded={c.fileMenuOpen}
                    aria-haspopup="true"
                  >
                    File
                  </button>
                  {c.fileMenuOpen && (
                    <>
                      <div className="court-toolbar-dropdown-backdrop" onClick={() => c.setFileMenuOpen(false)} aria-hidden />
                      <div className="court-toolbar-dropdown" role="menu">
                        {c.activeView === "court" && (
                          <>
                            <button
                              type="button"
                              className="court-toolbar-dropdown-item"
                              role="menuitem"
                              onClick={() => {
                                c.setFileMenuOpen(false);
                                const allDefaults = [...default51Rotations, ...default62Rotations];
                                let sys: "5-1" | "6-2" = c.system;
                                let rot = c.rotation;
                                if (c.customConfigKey.includes("-default")) {
                                  const def = allDefaults.find((d) => d.id === c.customConfigKey);
                                  if (def) {
                                    sys = def.system as "5-1" | "6-2";
                                    rot = def.rotation;
                                  }
                                } else if (c.customConfigKey.startsWith("custom:")) {
                                  const cfg = c.customConfigs.find((cf) => cf.id === c.customConfigKey.split("custom:")[1]);
                                  if (cfg) {
                                    sys = (cfg as SavedVisualizerConfig).system ?? "5-1";
                                    rot = 1;
                                  }
                                }
                                c.setNewSystem(sys);
                                c.setNewRotation(rot);
                                c.setSaveConfigMode("one");
                                c.setSaveRotationOne(c.rotation);
                                c.setSaveRotationsMulti([false, false, false, false, false, false]);
                                c.setShowSaveModal(true);
                              }}
                            >
                              Save as…
                            </button>
                            <button
                              type="button"
                              className="court-toolbar-dropdown-item"
                              role="menuitem"
                              disabled={!c.customConfigKey.startsWith("custom:")}
                              onClick={() => { c.setFileMenuOpen(false); c.handleOverwriteCurrentConfig(); }}
                            >
                              Save
                            </button>
                          </>
                        )}
                        {c.activeView === "planAhead" && (
                          <button
                            type="button"
                            className="court-toolbar-dropdown-item"
                            role="menuitem"
                            onClick={() => {
                              c.setFileMenuOpen(false);
                              c.setSavePlanName("");
                              c.setShowSavePlanModal(true);
                            }}
                          >
                            Save plan…
                          </button>
                        )}
                        <button
                          type="button"
                          className="court-toolbar-dropdown-item"
                          role="menuitem"
                          onClick={() => { c.setFileMenuOpen(false); c.setLineupExplorerOpen(true); }}
                        >
                          Custom rotation…
                        </button>
                        <button type="button" className="court-toolbar-dropdown-item" role="menuitem" onClick={() => c.setFileMenuOpen(false)}>
                          Export…
                        </button>
                        <button type="button" className="court-toolbar-dropdown-item" role="menuitem" onClick={() => c.setFileMenuOpen(false)}>
                          Share…
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
                  className={`court-toolbar-btn court-toolbar-draw-toggle ${c.drawPopoverOpen ? "draw-toggle-open" : ""}`}
                  onClick={() => {
                    if (c.drawMode && c.drawPopoverOpen) {
                      c.setDrawPopoverOpen(false);
                      c.setDrawMode(false);
                      c.setSelectedAnnotationIndices([]);
                    } else if (!c.drawMode) {
                      c.setDrawPopoverOpen(true);
                      c.setDrawMode(true);
                    } else {
                      c.setDrawPopoverOpen(true);
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
                  className={`court-toolbar-btn ${c.isLocked ? "active" : ""}`}
                  onClick={() => c.setIsLocked(!c.isLocked)}
                >
                  {c.isLocked ? "Unlock" : "Lock"}
                </button>
                <button type="button" className="court-toolbar-btn" onClick={c.handleReset}>
                  Reset
                </button>
              </div>
              <span className="court-toolbar-sep" aria-hidden />
              <div className="court-toolbar-group">
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => undoClick(c)}
                  disabled={c.undoStackLength === 0}
                  title="Undo (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  type="button"
                  className="court-toolbar-btn"
                  onClick={() => redoClick(c)}
                  disabled={c.redoStackLength === 0}
                  title="Redo (Ctrl+Y)"
                >
                  Redo
                </button>
                <button type="button" className="court-toolbar-btn" onClick={() => { c.pushUndo(); c.setAnnotations([]); }} title="Clear all annotations">
                  Clear
                </button>
              </div>
            </div>
            {c.drawMode && c.drawPopoverOpen && (
              <div className="draw-toolbar-popover" role="toolbar" aria-label="Drawing tools">
                <div className="draw-toolbar-row">
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "select" ? "active-subtle" : ""}`}
                    onClick={() => { c.setDrawTool("select"); c.setSelectedAnnotationIndices([]); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    title="Select"
                    aria-label="Select"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="1" /></svg>
                  </button>
                  <div className="draw-toolbar-icon-wrap">
                    <button
                      type="button"
                      className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "pencil" ? "active" : ""}`}
                      onClick={() => { c.setDrawTool("pencil"); c.setArrowMenuOpen(false); c.setPencilMenuOpen((o) => !o); }}
                      title="Pencil"
                      aria-label="Pencil"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={c.pencilColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 15.5L13 18l5-5z" /><path d="M2 2l7.5 7.5" /></svg>
                    </button>
                    {c.pencilMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        {DRAW_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`draw-color-swatch ${c.pencilColor === color ? "active" : ""}`}
                            style={{ background: color }}
                            onClick={() => { c.setPencilColor(color); c.setPencilMenuOpen(false); }}
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
                      className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "arrow" ? "active" : ""}`}
                      onClick={() => { c.setDrawTool("arrow"); c.setPencilMenuOpen(false); c.setArrowMenuOpen((o) => !o); }}
                      title="Arrow"
                      aria-label="Arrow"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={c.arrowColor} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                    </button>
                    {c.arrowMenuOpen && (
                      <div className="draw-toolbar-icon-menu" role="menu">
                        <div className="draw-toolbar-icon-menu-colors">
                          {DRAW_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`draw-color-swatch ${c.arrowColor === color ? "active" : ""}`}
                              style={{ background: color }}
                              onClick={() => c.setArrowColor(color)}
                              title={color}
                              aria-label={`Arrow color ${color}`}
                              role="menuitem"
                            />
                          ))}
                        </div>
                        <label className="court-toolbar-check draw-toolbar-icon-menu-curved">
                          <input type="checkbox" checked={c.arrowCurved} onChange={(e) => c.setArrowCurved(e.target.checked)} />
                          Curved
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`court-toolbar-btn court-toolbar-btn-icon ${c.drawTool === "eraser" ? "active-subtle" : ""}`}
                    onClick={() => { c.setDrawTool("eraser"); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    title="Eraser"
                    aria-label="Eraser"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-7 7z" /><path d="M13 7l7 7" /></svg>
                  </button>
                </div>
                {c.drawTool === "select" && c.selectedAnnotationIndices.length > 0 && (
                  <div className="draw-toolbar-row draw-toolbar-options draw-toolbar-colors">
                    <span className="draw-toolbar-label">Color</span>
                    {DRAW_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="draw-color-swatch"
                        style={{ background: color }}
                        onClick={() => {
                          c.pushUndo();
                          c.setAnnotations((prev) =>
                            prev.map((ann, i) =>
                              c.selectedAnnotationIndices.includes(i) ? { ...ann, stroke: color } : ann
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
                  {c.selectedAnnotationIndices.length > 0 && (
                    <button
                      type="button"
                      className="court-toolbar-btn"
                      onClick={() => {
                        c.pushUndo();
                        c.setAnnotations((prev) => prev.filter((_, i) => !c.selectedAnnotationIndices.includes(i)));
                        c.setSelectedAnnotationIndices([]);
                      }}
                    >
                      Delete selected
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="current-config-label-wrap" aria-live="polite">
            Current configuration: {c.currentConfigDisplayName || `Default (${c.system} R${c.rotation})`}
          </div>
          <div className="court-scaled-wrap" ref={c.courtContainerRef}>
            <div
              className="court-scaled-inner"
              style={{
                width: COURT_WIDTH * c.courtScale,
                height: COURT_HEIGHT * c.courtScale,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: COURT_WIDTH,
                  height: COURT_HEIGHT,
                  minWidth: COURT_WIDTH,
                  minHeight: COURT_HEIGHT,
                  transform: `scale(${c.courtScale})`,
                  transformOrigin: "top left",
                }}
              >
                {c.courtContainerReady && (
                  <Court
                    players={c.displayPlayers}
                    isLocked={c.isLocked || c.drawMode}
                    onDragEnd={c.handleDragEnd}
                    onColorChange={() => {}}
                    revertKey={c.revertKey}
                    annotations={c.annotations}
                    drawMode={c.drawMode}
                    drawTool={c.drawTool}
                    pencilColor={c.pencilColor}
                    arrowColor={c.arrowColor}
                    arrowTension={c.arrowCurved ? 1 : 0}
                    selectedAnnotationIndices={c.selectedAnnotationIndices}
                    onAnnotationAdd={(ann) => c.setAnnotations((prev) => { c.pushUndo(); return [...prev, ann]; })}
                    onAnnotationsClear={() => { c.pushUndo(); c.setAnnotations([]); }}
                    onAnnotationRemove={(i) => c.setAnnotations((prev) => { c.pushUndo(); return prev.filter((_, idx) => idx !== i); })}
                    onSelectionChange={c.setSelectedAnnotationIndices}
                    onDrawActionStart={() => { c.setDrawPopoverOpen(false); c.setPencilMenuOpen(false); c.setArrowMenuOpen(false); }}
                    onSelectionDragStart={c.pushUndo}
                    onSelectedAnnotationsMove={(dx, dy) => c.setAnnotations((prev) => prev.map((ann, i) => c.selectedAnnotationIndices.includes(i) ? c.translateAnnotation(ann, dx, dy) : ann))}
                    onAnnotationUpdate={(i, ann) => c.setAnnotations((prev) => prev.map((a, idx) => (idx === i ? ann : a)))}
                    onClearSelection={() => c.setSelectedAnnotationIndices([])}
                  />
                )}
              </div>
            </div>
          </div>
          {c.showOutOfRotation && (
            <div
              className="out-of-rotation-overlay"
              style={{ top: COURT_TOOLBAR_HEIGHT }}
              role="alert"
            >
              <div className="out-of-rotation-card">
                <p className="out-of-rotation-message">{c.outOfRotationMessage || "Out of rotation"}</p>
                <button
                  type="button"
                  className="out-of-rotation-revert-btn"
                  onClick={c.handleRevertOutOfRotation}
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
