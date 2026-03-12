import { useState, useMemo, useCallback, useEffect } from "react";
import { PlanAhead } from "./components/PlanAhead";
import { VisualizerView } from "./components/VisualizerView";
import type { Lineup } from "./components/StartingLineup";
import { SaveConfigModal, SaveLineupModal, LineupExplorerModal, LiberoModal, Toast, ConfirmModal } from "./components/Modals";
import type { ToastType } from "./components/Modals";
import "./App.css";
import "./styles/Modals.css";
import { default51Rotations, default62Rotations } from "./data/defaultRotations";
import { getRotationSet, applyLiberoToBackRowMiddle, applyLiberoToTarget } from "./utils/visualizerRotations";
import { getDisplayLabel } from "./utils/lineupHelpers";
import { AppHeader } from "./components/AppHeader";
import { useAuth } from "./hooks/useAuth";
import { VisualizerProvider } from "./contexts/VisualizerProvider";
import { useCourtContext } from "./contexts/CourtContext";
import { useLineupContext } from "./contexts/LineupContext";
import { useConfigSaveContext } from "./contexts/ConfigSaveContext";
import { useExportContext } from "./contexts/ExportContext";
import { useVisualizerContext } from "./contexts/VisualizerContext";

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
  const [customConfigKey, setCustomConfigKey] = useState("");

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
          onSignOut={() => {
            setCustomConfigKey("");
            handleSignOut();
          }}
        />
        <VisualizerProvider customConfigKey={customConfigKey} onCustomConfigKeyChange={setCustomConfigKey} user={user} activeView={activeView} showToast={showToast} showConfirm={showConfirm}>
          <AppViewContent activeView={activeView} setActiveView={setActiveView} showToast={showToast} />
        </VisualizerProvider>
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

function AppViewContent({
  activeView,
  setActiveView,
  showToast,
}: {
  activeView: "court" | "planAhead";
  setActiveView: (v: "court" | "planAhead") => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const court = useCourtContext();
  const lineup = useLineupContext();
  const configSave = useConfigSaveContext();
  const exportCtx = useExportContext();
  const visualizer = useVisualizerContext();

  const [planAheadServeTeam, setPlanAheadServeTeam] = useState<"A" | "B">("A");
  const [planAheadSystemA, setPlanAheadSystemA] = useState<"5-1" | "6-2">("5-1");
  const [planAheadSystemB, setPlanAheadSystemB] = useState<"5-1" | "6-2">("5-1");
  const [planAheadLineupA, setPlanAheadLineupA] = useState<Lineup>({});
  const [planAheadLineupB, setPlanAheadLineupB] = useState<Lineup>({});
  const [planAheadRotationA, setPlanAheadRotationA] = useState(1);
  const [planAheadRotationB, setPlanAheadRotationB] = useState(1);
  const [planAheadLineupIdA, setPlanAheadLineupIdA] = useState<string | null>(null);
  const [planAheadConfigIdA, setPlanAheadConfigIdA] = useState<string | null>(null);

  useEffect(() => {
    if (!visualizer.user || visualizer.user.isAnonymous) {
      setPlanAheadLineupA({});
      setPlanAheadLineupB({});
      setPlanAheadLineupIdA(null);
      setPlanAheadConfigIdA(null);
    }
  }, [visualizer.user]);
  const [planAheadLiberoTargetIdA, setPlanAheadLiberoTargetIdA] = useState<string | null>(null);
  const [planAheadLiberoTargetIdB, setPlanAheadLiberoTargetIdB] = useState<string | null>(null);
  const [planAheadLiberoModalTeam, setPlanAheadLiberoModalTeam] = useState<"A" | "B" | null>(null);
  const [planAheadLiberoDraftA, setPlanAheadLiberoDraftA] = useState<string | null>(null);
  const [planAheadLiberoDraftB, setPlanAheadLiberoDraftB] = useState<string | null>(null);

  const getPlayersForRotation = useCallback(
    (sys: "5-1" | "6-2", rot: number, useReceiveFormation: boolean = true) => {
      if (useReceiveFormation) {
        const defaults = sys === "6-2" ? default62Rotations : default51Rotations;
        const config = defaults[0];
        const snap = config?.rotations?.[rot - 1];
        if (snap) return applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players)));
      }
      const src = getRotationSet(sys);
      return JSON.parse(JSON.stringify(src[rot - 1]));
    },
    []
  );

  const customConfigsForPlanAhead = useMemo(
    () => [
      { id: "5-1-default", name: "5-1 Default" },
      { id: "6-2-default", name: "6-2 Default" },
      ...configSave.customConfigs.filter((c) => c.id).map((c) => ({ id: c.id!, name: c.name })),
    ],
    [configSave.customConfigs]
  );

  const planAheadPlayersARotations = useMemo(() => {
    const teamAIsReceiving = planAheadServeTeam === "B";
    const useReceiveForA = teamAIsReceiving;
    const defaultConfigA =
      planAheadConfigIdA === "5-1-default"
        ? default51Rotations[0]
        : planAheadConfigIdA === "6-2-default"
          ? default62Rotations[0]
          : null;
    const customConfigA =
      planAheadConfigIdA && teamAIsReceiving
        ? configSave.customConfigs.find((c) => c.id === planAheadConfigIdA)
        : null;
    const configA = defaultConfigA ?? customConfigA;
    let rotations: { id: string; x: number; y: number; color: string; label: string; isFrontRow?: boolean; isLibero?: boolean }[][];
    if (configA?.rotations?.length && teamAIsReceiving) {
      rotations = [1, 2, 3, 4, 5, 6].map((rot) => {
        const snap = configA.rotations[rot - 1];
        const rawPlayers = snap?.players ?? [];
        const players = defaultConfigA
          ? applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(rawPlayers)))
          : rawPlayers;
        return players.map((p: { id: string; x: number; y: number; label: string; color?: string; isFrontRow?: boolean; isLibero?: boolean }) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          color: p.color ?? "#666",
          label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label ?? p.id, planAheadLineupA, true, false),
          isFrontRow: p.isFrontRow,
          isLibero: p.isLibero,
        }));
      });
    } else {
      rotations = [1, 2, 3, 4, 5, 6].map((rot) => {
        const base = getPlayersForRotation(planAheadSystemA, rot, useReceiveForA);
        return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
          ...p,
          label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupA, true, false),
        }));
      });
    }
    if (planAheadLiberoTargetIdA === null) {
      return rotations.map((players) =>
        applyLiberoToTarget(players, null).map((p) => ({ ...p, label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupA, true, false) }))
      );
    }
    return rotations.map((players) => {
      const applied = applyLiberoToTarget(players, planAheadLiberoTargetIdA);
      return applied.map((p) => ({ ...p, label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupA, true, false) }));
    });
  }, [
    planAheadServeTeam,
    planAheadConfigIdA,
    configSave.customConfigs,
    planAheadLineupA,
    planAheadSystemA,
    getPlayersForRotation,
    planAheadLiberoTargetIdA,
  ]);

  const planAheadPlayersBRotations = useMemo(() => {
    const useReceive = planAheadServeTeam !== "B";
    const rotations = [1, 2, 3, 4, 5, 6].map((rot) => {
      const base = getPlayersForRotation(planAheadSystemB, rot, useReceive);
      return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
        ...p,
        label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupB, true, false),
      }));
    });
    if (planAheadLiberoTargetIdB === null) {
      return rotations.map((players) =>
        applyLiberoToTarget(players, null).map((p) => ({ ...p, label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupB, true, false) }))
      );
    }
    return rotations.map((players) => {
      const applied = applyLiberoToTarget(players, planAheadLiberoTargetIdB);
      return applied.map((p) => ({ ...p, label: getDisplayLabel(p.isLibero ? "L" : p.id, p.label, planAheadLineupB, true, false) }));
    });
  }, [planAheadServeTeam, planAheadLineupB, planAheadSystemB, getPlayersForRotation, planAheadLiberoTargetIdB]);

  const planAheadAnnotationsA = useMemo(() => {
    if (!planAheadConfigIdA) return [];
    const config = configSave.customConfigs.find((c) => c.id === planAheadConfigIdA);
    const snap = config?.rotations?.[planAheadRotationA - 1];
    if (!snap) return [];
    if (planAheadServeTeam === "B") {
      return Array.isArray(snap.annotations) ? snap.annotations : [];
    }
    return Array.isArray(snap.serveAnnotations) ? snap.serveAnnotations : [];
  }, [planAheadServeTeam, planAheadConfigIdA, planAheadRotationA, configSave.customConfigs]);

  const handlePlanAheadLineupASelect = useCallback(
    (lineupId: string | null) => {
      setPlanAheadLineupIdA(lineupId);
      if (!lineupId) {
        setPlanAheadLineupA({});
        return;
      }
      const item = lineup.savedLineups.find((l) => l.id === lineupId);
      if (item?.lineup) setPlanAheadLineupA(item.lineup as Lineup);
    },
    [lineup.savedLineups]
  );

  const handlePdfPreviewSave = useCallback(() => {
    const url = exportCtx.previewPdfUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "volleyball-rotations.pdf";
    a.click();
    URL.revokeObjectURL(url);
    exportCtx.setPreviewPdfUrl(null);
    showToast("PDF saved.", "success");
  }, [exportCtx.previewPdfUrl, exportCtx.setPreviewPdfUrl, showToast]);

  const handlePdfPreviewClose = useCallback(() => {
    const url = exportCtx.previewPdfUrl;
    if (url) {
      URL.revokeObjectURL(url);
      exportCtx.setPreviewPdfUrl(null);
    }
  }, [exportCtx.previewPdfUrl, exportCtx.setPreviewPdfUrl]);

  return (
    <>
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
          <VisualizerView />
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
            liberoOnA={planAheadLiberoTargetIdA !== null}
            onLiberoAChange={(on: boolean) => {
              if (on) {
                const players = planAheadPlayersARotations[planAheadRotationA - 1] ?? [];
                const backRow = players.filter((p) => !p.isFrontRow);
                const defaultTarget = planAheadLiberoTargetIdA ?? backRow[0]?.id ?? null;
                setPlanAheadLiberoDraftA(defaultTarget);
                setPlanAheadLiberoModalTeam("A");
              } else {
                setPlanAheadLiberoTargetIdA(null);
              }
            }}
            liberoOnB={planAheadLiberoTargetIdB !== null}
            onLiberoBChange={(on: boolean) => {
              if (on) {
                const players = planAheadPlayersBRotations[planAheadRotationB - 1] ?? [];
                const backRow = players.filter((p) => !p.isFrontRow);
                const defaultTarget = planAheadLiberoTargetIdB ?? backRow[0]?.id ?? null;
                setPlanAheadLiberoDraftB(defaultTarget);
                setPlanAheadLiberoModalTeam("B");
              } else {
                setPlanAheadLiberoTargetIdB(null);
              }
            }}
            lineupA={planAheadLineupA}
            onLineupAChange={(pos, entry) => setPlanAheadLineupA((prev) => ({ ...prev, [pos]: entry }))}
            lineupB={planAheadLineupB}
            onLineupBChange={(pos, entry) => setPlanAheadLineupB((prev) => ({ ...prev, [pos]: entry }))}
            playersARotations={planAheadPlayersARotations}
            playersBRotations={planAheadPlayersBRotations}
            annotationsA={planAheadAnnotationsA}
            savedLineups={lineup.savedLineups}
            planAheadLineupIdA={planAheadLineupIdA}
            onPlanAheadLineupASelect={handlePlanAheadLineupASelect}
            customConfigs={customConfigsForPlanAhead}
            planAheadConfigIdA={planAheadConfigIdA}
            onPlanAheadConfigIdAChange={setPlanAheadConfigIdA}
          />
        </div>
      </div>

      {exportCtx.previewPdfUrl && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="export-preview-title">
          <div className="modal-panel export-preview-modal">
            <h2 id="export-preview-title" className="modal-title">PDF Preview</h2>
            <div className="export-preview-iframe-wrap">
              <iframe title="PDF preview" src={exportCtx.previewPdfUrl} />
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
        open={configSave.showSaveModal}
        name={configSave.newName}
        system={configSave.newSystem}
        saveRotationsMulti={configSave.saveRotationsMulti}
        onNameChange={configSave.setNewName}
        onSystemChange={configSave.setNewSystem}
        onSaveRotationsMultiChange={(index, checked) =>
          configSave.setSaveRotationsMulti((prev: boolean[]) => prev.map((v: boolean, i: number) => (i === index ? checked : v)))
        }
        onCheckAllRotations={(checked) =>
          configSave.setSaveRotationsMulti([checked, checked, checked, checked, checked, checked])
        }
        onSave={configSave.handleSaveNewConfig}
        onClose={() => configSave.setShowSaveModal(false)}
      />
      <SaveLineupModal
        open={lineup.showSaveLineupModal}
        name={lineup.saveLineupName}
        onNameChange={lineup.setSaveLineupName}
        onSave={lineup.handleSaveLineupSubmit}
        onClose={() => {
          lineup.setShowSaveLineupModal(false);
          lineup.setSaveLineupName("");
        }}
      />
      <LineupExplorerModal
        open={lineup.lineupExplorerOpen}
        customConfigKey={configSave.customConfigKey}
        customConfigs={configSave.customConfigs}
        onSelect={configSave.handleCustomConfigChange}
        onDeleteConfig={configSave.handleDeleteConfig}
        onClose={() => lineup.setLineupExplorerOpen(false)}
      />
      <LiberoModal
        open={court.showLiberoModal}
        players={court.players}
        liberoTargetId={court.liberoTargetId}
        onLiberoTargetChange={court.setLiberoTargetId}
        onConfirm={court.handleConfirmLiberoSwitch}
        onClose={() => court.setShowLiberoModal(false)}
      />
      {planAheadLiberoModalTeam && (() => {
          const useReceiveA = planAheadServeTeam === "B";
          const useReceiveB = planAheadServeTeam !== "B";
          const baseA = getPlayersForRotation(planAheadSystemA, planAheadRotationA, useReceiveA);
          const baseB = getPlayersForRotation(planAheadSystemB, planAheadRotationB, useReceiveB);
          const backRowA = applyLiberoToTarget(baseA, null).filter((p: { isFrontRow?: boolean }) => !p.isFrontRow);
          const backRowB = applyLiberoToTarget(baseB, null).filter((p: { isFrontRow?: boolean }) => !p.isFrontRow);
          const modalPlayersA = backRowA.map((p: { id: string }) => ({ id: p.id, label: p.id, isFrontRow: false }));
          const modalPlayersB = backRowB.map((p: { id: string }) => ({ id: p.id, label: p.id, isFrontRow: false }));
          return (
          <LiberoModal
            open
            players={planAheadLiberoModalTeam === "A" ? modalPlayersA : modalPlayersB}
            liberoTargetId={planAheadLiberoModalTeam === "A" ? planAheadLiberoDraftA : planAheadLiberoDraftB}
            onLiberoTargetChange={planAheadLiberoModalTeam === "A" ? setPlanAheadLiberoDraftA : setPlanAheadLiberoDraftB}
            onConfirm={() => {
              if (planAheadLiberoModalTeam === "A") {
                setPlanAheadLiberoTargetIdA(planAheadLiberoDraftA);
              } else {
                setPlanAheadLiberoTargetIdB(planAheadLiberoDraftB);
              }
              setPlanAheadLiberoModalTeam(null);
            }}
            onClose={() => setPlanAheadLiberoModalTeam(null)}
          />
          );
        })()}
    </>
  );
}

export default App;
