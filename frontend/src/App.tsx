import { useState, useMemo, useCallback } from "react";
import { PlanAhead } from "./components/PlanAhead";
import { VisualizerView } from "./components/VisualizerView";
import type { Lineup } from "./components/StartingLineup";
import { SaveConfigModal, SaveLineupModal, LineupExplorerModal, LiberoModal, Toast, ConfirmModal } from "./components/Modals";
import type { ToastType } from "./components/Modals";
import "./App.css";
import "./styles/Modals.css";
import { default51Rotations, default62Rotations } from "./data/defaultRotations";
import { getRotationSet, applyLiberoToBackRowMiddle } from "./utils/visualizerRotations";
import { getDisplayLabel } from "./utils/lineupHelpers";
import { AppHeader } from "./components/AppHeader";
import { useAuth } from "./hooks/useAuth";
import { useVisualizerState } from "./hooks/useVisualizerState";

function App() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void; onCancel: () => void } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
      setConfirm({
        title,
        message,
        onConfirm: () => {
          setConfirm(null);
          onConfirm();
        },
        onCancel: () => {
          setConfirm(null);
          onCancel?.();
        },
      });
    },
    []
  );

  const {
    user,
    email,
    setEmail,
    password,
    setPassword,
    showAccountMenu,
    setShowAccountMenu,
    handleGoogleSignIn,
    handleEmailSignUp,
    handleEmailSignIn,
    handleSignOut,
  } = useAuth({ showToast });

  const [activeView, setActiveView] = useState<"court" | "planAhead">("court");
  const visualizerViewCtx = useVisualizerState(user, activeView, { showToast, showConfirm });

  const [planAheadServeTeam, setPlanAheadServeTeam] = useState<"A" | "B">("A");
  const [planAheadSystemA, setPlanAheadSystemA] = useState<"5-1" | "6-2">("5-1");
  const [planAheadSystemB, setPlanAheadSystemB] = useState<"5-1" | "6-2">("5-1");
  const [planAheadLineupA, setPlanAheadLineupA] = useState<Lineup>({});
  const [planAheadLineupB, setPlanAheadLineupB] = useState<Lineup>({});
  const [planAheadRotationA, setPlanAheadRotationA] = useState(1);
  const [planAheadRotationB, setPlanAheadRotationB] = useState(1);
  const [planAheadLineupIdA, setPlanAheadLineupIdA] = useState<string | null>(null);
  const [planAheadConfigIdA, setPlanAheadConfigIdA] = useState<string | null>(null);

  const getPlayersForRotation = useCallback(
    (sys: "5-1" | "6-2", rot: number, useReceiveFormation: boolean = true) => {
      if (useReceiveFormation) {
        const allDefaults = [...default51Rotations, ...default62Rotations];
        const cfg = allDefaults.find((d) => d.system === sys && d.rotation === rot);
        if (cfg) return applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(cfg.players)));
      }
      const src = getRotationSet(sys);
      return JSON.parse(JSON.stringify(src[rot - 1]));
    },
    []
  );

  const customConfigsForPlanAhead = useMemo(
    () => visualizerViewCtx.customConfigs.filter((c) => c.id).map((c) => ({ id: c.id!, name: c.name })),
    [visualizerViewCtx.customConfigs]
  );

  const planAheadPlayersARotations = useMemo(() => {
    const teamAIsReceiving = planAheadServeTeam === "B";
    const useReceiveForA = teamAIsReceiving;
    const configA =
      planAheadConfigIdA && teamAIsReceiving
        ? visualizerViewCtx.customConfigs.find((c) => c.id === planAheadConfigIdA)
        : null;
    if (configA?.rotations?.length) {
      return [1, 2, 3, 4, 5, 6].map((rot) => {
        const snap = configA.rotations[rot - 1];
        const players = snap?.players ?? [];
        return players.map((p: { id: string; x: number; y: number; label: string; color?: string; isFrontRow?: boolean; isLibero?: boolean }) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          color: p.color ?? "#666",
          label: getDisplayLabel(p.id, p.label ?? p.id, planAheadLineupA, true, false),
          isFrontRow: p.isFrontRow,
          isLibero: p.isLibero,
        }));
      });
    }
    return [1, 2, 3, 4, 5, 6].map((rot) => {
      const base = getPlayersForRotation(planAheadSystemA, rot, useReceiveForA);
      return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
        ...p,
        label: getDisplayLabel(p.id, p.label, planAheadLineupA, true, false),
      }));
    });
  }, [
    planAheadServeTeam,
    planAheadConfigIdA,
    visualizerViewCtx.customConfigs,
    planAheadLineupA,
    planAheadSystemA,
    getPlayersForRotation,
  ]);

  const planAheadPlayersBRotations = useMemo(() => {
    const useReceive = planAheadServeTeam !== "B";
    return [1, 2, 3, 4, 5, 6].map((rot) => {
      const base = getPlayersForRotation(planAheadSystemB, rot, useReceive);
      return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
        ...p,
        label: getDisplayLabel(p.id, p.label, planAheadLineupB, true, false),
      }));
    });
  }, [planAheadServeTeam, planAheadLineupB, planAheadSystemB, getPlayersForRotation]);

  const planAheadAnnotationsA = useMemo(() => {
    if (planAheadServeTeam !== "B" || !planAheadConfigIdA) return [];
    const config = visualizerViewCtx.customConfigs.find((c) => c.id === planAheadConfigIdA);
    const snap = config?.rotations?.[planAheadRotationA - 1];
    return Array.isArray(snap?.annotations) ? snap.annotations : [];
  }, [planAheadServeTeam, planAheadConfigIdA, planAheadRotationA, visualizerViewCtx.customConfigs]);

  const handlePlanAheadLineupASelect = useCallback(
    (lineupId: string | null) => {
      setPlanAheadLineupIdA(lineupId);
      if (!lineupId) {
        setPlanAheadLineupA({});
        return;
      }
      const item = visualizerViewCtx.savedLineups.find((l) => l.id === lineupId);
      if (item?.lineup) setPlanAheadLineupA(item.lineup as Lineup);
    },
    [visualizerViewCtx.savedLineups]
  );

  const handlePdfPreviewSave = useCallback(() => {
    const url = visualizerViewCtx.previewPdfUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "volleyball-rotations.pdf";
    a.click();
    URL.revokeObjectURL(url);
    visualizerViewCtx.setPreviewPdfUrl(null);
    showToast("PDF saved.", "success");
  }, [visualizerViewCtx.previewPdfUrl, visualizerViewCtx.setPreviewPdfUrl, showToast]);

  const handlePdfPreviewClose = useCallback(() => {
    const url = visualizerViewCtx.previewPdfUrl;
    if (url) {
      URL.revokeObjectURL(url);
      visualizerViewCtx.setPreviewPdfUrl(null);
    }
  }, [visualizerViewCtx.previewPdfUrl, visualizerViewCtx.setPreviewPdfUrl]);

  const ctx = visualizerViewCtx;

  return (
    <div className="app">
      <div className="app-card">
        <AppHeader
          user={user}
          showAccountMenu={showAccountMenu}
          onToggleAccountMenu={() => setShowAccountMenu((open) => !open)}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onGoogleSignIn={handleGoogleSignIn}
          onEmailSignUp={handleEmailSignUp}
          onEmailSignIn={handleEmailSignIn}
          onSignOut={handleSignOut}
        />

        <div className="view-tabs" role="tablist" aria-label="Main view">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "court"}
            className={`view-tab ${activeView === "court" ? "active" : ""}`}
            onClick={() => setActiveView("court")}
          >
            Visualizer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "planAhead"}
            className={`view-tab ${activeView === "planAhead" ? "active" : ""}`}
            onClick={() => setActiveView("planAhead")}
          >
            Plan ahead
          </button>
        </div>

        <div className="view-content-wrap">
          <div
            className="court-view-wrap"
            style={{ display: activeView === "court" ? "flex" : "none" }}
            aria-hidden={activeView !== "court"}
          >
            <VisualizerView ctx={visualizerViewCtx} />
          </div>
          <div
            style={{
              display: activeView === "planAhead" ? "flex" : "none",
              flex: 1,
              minHeight: 0,
              flexDirection: "column",
              overflow: "hidden",
            }}
            aria-hidden={activeView !== "planAhead"}
          >
            <PlanAhead
              serveTeam={planAheadServeTeam}
              onServeTeamChange={setPlanAheadServeTeam}
              systemA={planAheadSystemA}
              onSystemAChange={setPlanAheadSystemA}
              systemB={planAheadSystemB}
              onSystemBChange={setPlanAheadSystemB}
              rotationA={planAheadRotationA}
              onRotationAChange={setPlanAheadRotationA}
              rotationB={planAheadRotationB}
              onRotationBChange={setPlanAheadRotationB}
              lineupA={planAheadLineupA}
              onLineupAChange={(pos, entry) => setPlanAheadLineupA((prev) => ({ ...prev, [pos]: entry }))}
              lineupB={planAheadLineupB}
              onLineupBChange={(pos, entry) => setPlanAheadLineupB((prev) => ({ ...prev, [pos]: entry }))}
              playersARotations={planAheadPlayersARotations}
              playersBRotations={planAheadPlayersBRotations}
              annotationsA={planAheadAnnotationsA}
              savedLineups={visualizerViewCtx.savedLineups}
              planAheadLineupIdA={planAheadLineupIdA}
              onPlanAheadLineupASelect={handlePlanAheadLineupASelect}
              customConfigs={customConfigsForPlanAhead}
              planAheadConfigIdA={planAheadConfigIdA}
              onPlanAheadConfigIdAChange={setPlanAheadConfigIdA}
            />
          </div>
        </div>

        {ctx.previewPdfUrl && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
            <div className="modal-panel export-preview-modal">
              <h2 id="export-preview-title" className="modal-title">PDF Preview</h2>
              <div className="export-preview-iframe-wrap">
                <iframe title="PDF preview" src={ctx.previewPdfUrl} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-success" onClick={handlePdfPreviewSave}>
                  Save PDF
                </button>
                <button type="button" className="btn btn-secondary" onClick={handlePdfPreviewClose}>
                  Don&apos;t save
                </button>
              </div>
            </div>
          </div>
        )}

        <SaveConfigModal
          open={ctx.showSaveModal}
          name={ctx.newName}
          system={ctx.newSystem}
          currentRotation={ctx.rotation}
          saveMode={ctx.saveConfigMode}
          saveRotationOne={ctx.saveRotationOne}
          saveRotationsMulti={ctx.saveRotationsMulti}
          onNameChange={ctx.setNewName}
          onSystemChange={ctx.setNewSystem}
          onSaveModeChange={ctx.setSaveConfigMode}
          onSaveRotationOneChange={ctx.setSaveRotationOne}
          onSaveRotationsMultiChange={(index, checked) =>
            ctx.setSaveRotationsMulti((prev: boolean[]) => prev.map((v: boolean, i: number) => (i === index ? checked : v)))
          }
          onSave={ctx.handleSaveNewConfig}
          onClose={() => ctx.setShowSaveModal(false)}
        />
        <SaveLineupModal
          open={ctx.showSaveLineupModal}
          name={ctx.saveLineupName}
          onNameChange={ctx.setSaveLineupName}
          onSave={ctx.handleSaveLineupSubmit}
          onClose={() => {
            ctx.setShowSaveLineupModal(false);
            ctx.setSaveLineupName("");
          }}
        />
        <LineupExplorerModal
          open={ctx.lineupExplorerOpen}
          customConfigKey={ctx.customConfigKey}
          customConfigs={ctx.customConfigs}
          onSelect={ctx.handleCustomConfigChange}
          onDeleteConfig={ctx.handleDeleteConfig}
          onClose={() => ctx.setLineupExplorerOpen(false)}
        />
        <LiberoModal
          open={ctx.showLiberoModal}
          players={ctx.players}
          liberoTargetId={ctx.liberoTargetId}
          onLiberoTargetChange={ctx.setLiberoTargetId}
          onConfirm={ctx.handleConfirmLiberoSwitch}
          onClose={() => ctx.setShowLiberoModal(false)}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            visible
            onDismiss={() => setToast(null)}
          />
        )}
        {confirm && (
          <ConfirmModal
            open
            title={confirm.title}
            message={confirm.message}
            onConfirm={confirm.onConfirm}
            onCancel={confirm.onCancel}
          />
        )}
      </div>
    </div>
  );
}

export default App;
