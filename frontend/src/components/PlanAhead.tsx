import React, { useState, useRef, useLayoutEffect } from "react";
import "../styles/PlanAhead.css";
import { PlanAheadCourt, type PlanAheadPlayer } from "./PlanAheadCourt";
import { LINEUP_POSITIONS, type Lineup, type LineupEntry, type LineupPositionId } from "./StartingLineup";
import { COLORS } from "../data/defaultRotations";
import { COURT_WIDTH } from "../constants";

const PLAN_AHEAD_COURT_WIDTH = COURT_WIDTH;

export type SavedLineupItem = { id: string; name: string; lineup: unknown };
export type SavedConfigItem = { id: string; name: string };

export type PlanAheadProps = {
  serveTeam: "A" | "B";
  onServeTeamChange: (t: "A" | "B") => void;
  systemA: "5-1" | "6-2";
  onSystemAChange: (s: "5-1" | "6-2") => void;
  systemB: "5-1" | "6-2";
  onSystemBChange: (s: "5-1" | "6-2") => void;
  rotationA: number;
  onRotationAChange: (r: number) => void;
  rotationB: number;
  onRotationBChange: (r: number) => void;
  lineupA: Lineup;
  onLineupAChange: (position: LineupPositionId, entry: LineupEntry) => void;
  lineupB: Lineup;
  onLineupBChange: (position: LineupPositionId, entry: LineupEntry) => void;
  playersARotations: PlanAheadPlayer[][];
  playersBRotations: PlanAheadPlayer[][];
  annotationsA?: { type: "path" | "arrow"; points: number[]; stroke?: string; pointerAtBeginning?: boolean; pointerAtEnding?: boolean; tension?: number }[];
  savedLineups?: SavedLineupItem[];
  planAheadLineupIdA?: string | null;
  onPlanAheadLineupASelect?: (id: string | null) => void;
  customConfigs?: SavedConfigItem[];
  planAheadConfigIdA?: string | null;
  onPlanAheadConfigIdAChange?: (id: string | null) => void;
};

const TEAM_A_COLOR = "#dc2626";
const TEAM_B_COLOR = "#2563eb";

function sanitizeJerseyNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

const POSITION_LABELS: Record<LineupPositionId, { label: string; color: string }> = {
  OH1: { label: "OH1", color: COLORS.OH },
  OH2: { label: "OH2", color: COLORS.OH },
  RS1: { label: "RS1", color: COLORS.RS },
  RS2: { label: "RS2", color: COLORS.RS },
  L: { label: "L", color: COLORS.L },
  MB1: { label: "MB1", color: COLORS.MB },
  MB2: { label: "MB2", color: COLORS.MB },
  S1: { label: "S1", color: COLORS.S },
  S2: { label: "S2", color: COLORS.S },
};

export const PlanAhead: React.FC<PlanAheadProps> = ({
  serveTeam,
  onServeTeamChange,
  systemA,
  onSystemAChange,
  systemB,
  onSystemBChange,
  rotationA,
  onRotationAChange,
  rotationB,
  onRotationBChange,
  lineupA,
  onLineupAChange,
  lineupB,
  onLineupBChange,
  playersARotations,
  playersBRotations,
  annotationsA = [],
  savedLineups = [],
  planAheadLineupIdA = null,
  onPlanAheadLineupASelect,
  customConfigs = [],
  planAheadConfigIdA = null,
  onPlanAheadConfigIdAChange,
}) => {
  const courtWrapRef = useRef<HTMLDivElement>(null);
  const [courtScale, setCourtScale] = useState(1);

  useLayoutEffect(() => {
    const el = courtWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const scale = Math.min(w / PLAN_AHEAD_COURT_WIDTH, 1);
      setCourtScale(scale);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="plan-ahead">
      <div className="plan-ahead-top">
        <div className="plan-ahead-serve-toggle">
          <span className="plan-ahead-label">Serve</span>
          <button
            type="button"
            className={`plan-ahead-serve-btn ${serveTeam === "A" ? "active" : ""}`}
            onClick={() => onServeTeamChange("A")}
            style={{ ["--team-color" as string]: TEAM_A_COLOR }}
          >
            Team A (US)
          </button>
          <button
            type="button"
            className={`plan-ahead-serve-btn ${serveTeam === "B" ? "active" : ""}`}
            onClick={() => onServeTeamChange("B")}
            style={{ ["--team-color" as string]: TEAM_B_COLOR }}
          >
            Team B
          </button>
        </div>
        <div className="plan-ahead-control-group">
          <span className="plan-ahead-label">Team A (US)</span>
          <label className="control-check">
            <input
              type="checkbox"
              checked={systemA === "5-1"}
              onChange={() => onSystemAChange("5-1")}
              aria-label="Team A (US) 5-1"
            />
            5-1
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={systemA === "6-2"}
              onChange={() => onSystemAChange("6-2")}
              aria-label="Team A (US) 6-2"
            />
            6-2
          </label>
        </div>
        <div className="plan-ahead-control-group">
          <span className="plan-ahead-label">Team B</span>
          <label className="control-check">
            <input
              type="checkbox"
              checked={systemB === "5-1"}
              onChange={() => onSystemBChange("5-1")}
              aria-label="Team B 5-1"
            />
            5-1
          </label>
          <label className="control-check">
            <input
              type="checkbox"
              checked={systemB === "6-2"}
              onChange={() => onSystemBChange("6-2")}
              aria-label="Team B 6-2"
            />
            6-2
          </label>
        </div>
      </div>

      <div className="plan-ahead-main">
        <div className="plan-ahead-left-panel">
          {onPlanAheadLineupASelect && (
            <div className="plan-ahead-lineup-select-row">
              <label className="plan-ahead-label" htmlFor="plan-ahead-lineup-a">Lineup (Team A)</label>
              <select
                id="plan-ahead-lineup-a"
                className="plan-ahead-select"
                value={planAheadLineupIdA ?? ""}
                onChange={(e) => onPlanAheadLineupASelect(e.target.value || null)}
                aria-label="Load lineup for Team A"
              >
                <option value="">None</option>
                {savedLineups.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {savedLineups.length === 0 && (
                <span className="plan-ahead-label plan-ahead-hint">Sign in to save and load lineups.</span>
              )}
            </div>
          )}
          <div className="plan-ahead-table-panel">
            <table className="plan-ahead-compact-table" aria-label="Lineups by number">
            <thead>
              <tr className="plan-ahead-compact-table-team-row">
                <th scope="col" className="plan-ahead-pos-header" />
                <th scope="col" className="plan-ahead-team-header" style={{ borderTopColor: TEAM_A_COLOR }}>
                  Team A (US)
                </th>
                <th scope="col" className="plan-ahead-team-header" style={{ borderTopColor: TEAM_B_COLOR }}>
                  Team B
                </th>
              </tr>
            </thead>
            <tbody>
              {LINEUP_POSITIONS.map((pos) => {
                const meta = POSITION_LABELS[pos];
                const entryA = lineupA[pos] ?? { firstName: "", lastName: "", number: "" };
                const entryB = lineupB[pos] ?? { firstName: "", lastName: "", number: "" };
                return (
                  <tr key={pos}>
                    <th scope="row" className="plan-ahead-pos-cell">
                      {meta.label}
                    </th>
                    <td className="plan-ahead-num-cell">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="#"
                        value={entryA.number}
                        onChange={(e) => onLineupAChange(pos, { ...entryA, number: sanitizeJerseyNumber(e.target.value) })}
                        className="plan-ahead-compact-num"
                        aria-label={`Team A (US) ${meta.label} number`}
                      />
                    </td>
                    <td className="plan-ahead-num-cell">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="#"
                        value={entryB.number}
                        onChange={(e) => onLineupBChange(pos, { ...entryB, number: sanitizeJerseyNumber(e.target.value) })}
                        className="plan-ahead-compact-num"
                        aria-label={`Team B ${meta.label} number`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {onPlanAheadConfigIdAChange && (
            <div className="plan-ahead-config-select-row">
              <label className="plan-ahead-label" htmlFor="plan-ahead-config-a">Configuration (Team A)</label>
              <select
                id="plan-ahead-config-a"
                className="plan-ahead-select"
                value={planAheadConfigIdA ?? ""}
                onChange={(e) => onPlanAheadConfigIdAChange(e.target.value || null)}
                aria-label="Configuration for Team A"
              >
                <option value="">Current</option>
                {customConfigs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {customConfigs.length === 0 && (
                <span className="plan-ahead-label plan-ahead-hint">Sign in to save and load configs.</span>
              )}
            </div>
          )}
        </div>
        <div className="plan-ahead-court-row">
          <div className="plan-ahead-court-with-rotations">
            <div className="plan-ahead-rotation-buttons-row">
              <div className="plan-ahead-control-group">
                <span className="plan-ahead-label">Team A (US)</span>
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`btn-rotation ${rotationA === r ? "active" : ""}`}
                    onClick={() => onRotationAChange(r)}
                    aria-label={`Team A rotation ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="plan-ahead-control-group">
                <span className="plan-ahead-label">Team B</span>
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`btn-rotation ${rotationB === r ? "active" : ""}`}
                    onClick={() => onRotationBChange(r)}
                    aria-label={`Team B rotation ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="plan-ahead-court-label-row">
              Team A (US) R{rotationA} · Team B R{rotationB}
            </div>
            <div ref={courtWrapRef} className="plan-ahead-court-wrapper plan-ahead-court-fit">
              <PlanAheadCourt
                playersA={playersARotations[rotationA - 1] ?? []}
                playersB={playersBRotations[rotationB - 1] ?? []}
                annotationsA={annotationsA}
                isLocked={true}
                displayScale={courtScale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
