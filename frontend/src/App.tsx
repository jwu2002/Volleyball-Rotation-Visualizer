import { useState, useEffect, useMemo, useCallback } from "react";
import type { Annotation } from "./components/Court";
import { PlanAhead } from "./components/PlanAhead";
import { VisualizerView } from "./components/VisualizerView";
import type { Lineup } from "./components/StartingLineup";
import { SaveConfigModal, SaveLineupModal, SavePlanModal, LineupExplorerModal, LiberoModal } from "./components/Modals";
import "./App.css";
import "./styles/Modals.css";
import { auth } from "./firebaseConfig";
import { default51Rotations, default62Rotations } from "./data/defaultRotations";
import type { SavedPlan } from "./types/savedConfig";
import { fetchSavedPlans, savePlan } from "./storage/configStorage";
import { getRotationSet, applyLiberoToBackRowMiddle } from "./utils/visualizerRotations";
import { getDisplayLabel } from "./utils/lineupHelpers";
import { AppHeader } from "./components/AppHeader";
import { useAuth } from "./hooks/useAuth";
import { useVisualizerState } from "./hooks/useVisualizerState";

function App() {
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
  } = useAuth();

  const [activeView, setActiveView] = useState<"court" | "planAhead">("court");
  const visualizerViewCtx = useVisualizerState(user, activeView);

  const [planAheadServeTeam, setPlanAheadServeTeam] = useState<"A" | "B">("A");
  const [planAheadSystemA, setPlanAheadSystemA] = useState<"5-1" | "6-2">("5-1");
  const [planAheadSystemB, setPlanAheadSystemB] = useState<"5-1" | "6-2">("5-1");
  const [planAheadLineupA, setPlanAheadLineupA] = useState<Lineup>({});
  const [planAheadLineupB, setPlanAheadLineupB] = useState<Lineup>({});
  const [planAheadRotationA, setPlanAheadRotationA] = useState(1);
  const [planAheadRotationB, setPlanAheadRotationB] = useState(1);
  const [planAheadAnnotations, setPlanAheadAnnotations] = useState<Annotation[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

  const planAheadPlayersARotations = useMemo(() => {
    const useReceive = planAheadServeTeam !== "A";
    return [1, 2, 3, 4, 5, 6].map((rot) => {
      const base = getPlayersForRotation(planAheadSystemA, rot, useReceive);
      return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
        ...p,
        label: getDisplayLabel(p.id, p.label, planAheadLineupA, true, false),
      }));
    });
  }, [getPlayersForRotation, planAheadSystemA, planAheadLineupA, planAheadServeTeam]);

  const planAheadPlayersBRotations = useMemo(() => {
    const useReceive = planAheadServeTeam !== "B";
    return [1, 2, 3, 4, 5, 6].map((rot) => {
      const base = getPlayersForRotation(planAheadSystemB, rot, useReceive);
      return base.map((p: { id: string; label: string; [k: string]: unknown }) => ({
        ...p,
        label: getDisplayLabel(p.id, p.label, planAheadLineupB, true, false),
      }));
    });
  }, [getPlayersForRotation, planAheadSystemB, planAheadLineupB, planAheadServeTeam]);

  const fetchSavedPlansForPlanAhead = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setSavedPlans([]);
      return;
    }
    try {
      const token = await u.getIdToken();
      const list = await fetchSavedPlans(token);
      setSavedPlans(list);
    } catch {
      setSavedPlans([]);
    }
  }, []);

  useEffect(() => {
    fetchSavedPlansForPlanAhead();
  }, [user, fetchSavedPlansForPlanAhead]);

  const handleSavePlanSubmit = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      alert("Sign in to save plans.");
      return;
    }
    const name = (visualizerViewCtx.savePlanName || "Unnamed plan").trim();
    try {
      const payload = {
        lineupA: planAheadLineupA,
        lineupB: planAheadLineupB,
        systemA: planAheadSystemA,
        systemB: planAheadSystemB,
        serveTeam: planAheadServeTeam,
        rotationA: planAheadRotationA,
        rotationB: planAheadRotationB,
        annotations: JSON.parse(JSON.stringify(planAheadAnnotations)) as Annotation[],
      };
      const token = await u.getIdToken();
      await savePlan(u.uid, name, payload, token);
      visualizerViewCtx.setShowSavePlanModal(false);
      visualizerViewCtx.setSavePlanName("");
      await fetchSavedPlansForPlanAhead();
      alert("Plan saved.");
    } catch (err) {
      console.error("Error saving plan:", err);
      alert("Failed to save plan.");
    }
  }, [
    visualizerViewCtx.savePlanName,
    planAheadLineupA,
    planAheadLineupB,
    planAheadSystemA,
    planAheadSystemB,
    planAheadServeTeam,
    planAheadRotationA,
    planAheadRotationB,
    planAheadAnnotations,
    fetchSavedPlansForPlanAhead,
  ]);

  const handleLoadPlan = useCallback((plan: SavedPlan | null) => {
    if (!plan) {
      setSelectedPlanId(null);
      return;
    }
    setPlanAheadLineupA(plan.lineupA ?? {});
    setPlanAheadLineupB(plan.lineupB ?? {});
    setPlanAheadSystemA(plan.systemA);
    setPlanAheadSystemB(plan.systemB);
    setPlanAheadServeTeam(plan.serveTeam);
    setPlanAheadRotationA(plan.rotationA);
    setPlanAheadRotationB(plan.rotationB);
    setPlanAheadAnnotations(Array.isArray(plan.annotations) ? JSON.parse(JSON.stringify(plan.annotations)) : []);
    setSelectedPlanId(plan.id ?? null);
  }, []);

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
              savedPlans={savedPlans}
              selectedPlanId={selectedPlanId}
              onLoadPlan={handleLoadPlan}
            />
          </div>
        </div>

        <SaveConfigModal
          open={ctx.showSaveModal}
          name={ctx.newName}
          system={ctx.newSystem}
          rotation={ctx.newRotation}
          onNameChange={ctx.setNewName}
          onSystemChange={ctx.setNewSystem}
          onRotationChange={ctx.setNewRotation}
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
        <SavePlanModal
          open={ctx.showSavePlanModal}
          name={ctx.savePlanName}
          onNameChange={ctx.setSavePlanName}
          onSave={handleSavePlanSubmit}
          onClose={() => {
            ctx.setShowSavePlanModal(false);
            ctx.setSavePlanName("");
          }}
        />
        <LineupExplorerModal
          open={ctx.lineupExplorerOpen}
          customConfigKey={ctx.customConfigKey}
          customConfigs={ctx.customConfigs}
          onSelect={ctx.handleCustomConfigChange}
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
      </div>
    </div>
  );
}

export default App;
