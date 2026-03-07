import React from "react";
import "../styles/PlanAhead.css";
import { PlanAheadCourt, type PlanAheadPlayer } from "./PlanAheadCourt";
import { LINEUP_POSITIONS, type Lineup, type LineupEntry, type LineupPositionId } from "./StartingLineup";
import { COLORS } from "../data/defaultRotations";
import type { SavedPlan } from "../types/savedConfig";

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
  savedPlans?: SavedPlan[];
  selectedPlanId?: string | null;
  onLoadPlan?: (plan: SavedPlan | null) => void;
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
  savedPlans = [],
  selectedPlanId = null,
  onLoadPlan,
}) => {
  return (
    <div className="plan-ahead">
      <div className="plan-ahead-top">
        {savedPlans.length > 0 && onLoadPlan && (
          <div className="plan-ahead-control-group">
            <span className="plan-ahead-label">Plan</span>
            <select
              className="plan-ahead-select"
              value={selectedPlanId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  onLoadPlan?.(null);
                  return;
                }
                const plan = savedPlans.find((p) => p.id === id);
                if (plan) onLoadPlan(plan);
              }}
              aria-label="Load plan"
            >
              <option value="">Current</option>
              {savedPlans.map((p) => (
                <option key={p.id} value={p.id ?? ""}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <div className="plan-ahead-court-row">
          <div className="plan-ahead-court-with-rotations">
            <div className="plan-ahead-court-wrapper">
              <PlanAheadCourt
                playersA={playersARotations[rotationA - 1]}
                playersB={playersBRotations[rotationB - 1]}
                isLocked={true}
                rotationLabel={`Team A (US) R${rotationA} · Team B R${rotationB}`}
              />
            </div>
            <div className="plan-ahead-court-rotation-sidebar">
              <div className="plan-ahead-court-rotation-block plan-ahead-court-rotation-top">
                <span className="plan-ahead-label">Team B Rotation</span>
                <div className="plan-ahead-rotation-control">
                  <select
                    className="plan-ahead-select"
                    value={rotationB}
                    onChange={(e) => onRotationBChange(Number(e.target.value))}
                    aria-label="Team B Rotation"
                  >
                    {[1, 2, 3, 4, 5, 6].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="plan-ahead-rot-btn"
                    onClick={() => onRotationBChange(rotationB === 6 ? 1 : rotationB + 1)}
                    aria-label="Team B Rotation plus 1"
                    title="Next rotation"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    className="plan-ahead-rot-btn"
                    onClick={() => onRotationBChange(rotationB === 1 ? 6 : rotationB - 1)}
                    aria-label="Team B Rotation minus 1"
                    title="Previous rotation"
                  >
                    −1
                  </button>
                </div>
              </div>
              <div className="plan-ahead-court-rotation-block plan-ahead-court-rotation-bottom">
                <span className="plan-ahead-label">Team A (US) Rotation</span>
                <div className="plan-ahead-rotation-control">
                  <select
                    className="plan-ahead-select"
                    value={rotationA}
                    onChange={(e) => onRotationAChange(Number(e.target.value))}
                    aria-label="Team A (US) Rotation"
                  >
                    {[1, 2, 3, 4, 5, 6].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="plan-ahead-rot-btn"
                    onClick={() => onRotationAChange(rotationA === 6 ? 1 : rotationA + 1)}
                    aria-label="Team A (US) Rotation plus 1"
                    title="Next rotation"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    className="plan-ahead-rot-btn"
                    onClick={() => onRotationAChange(rotationA === 1 ? 6 : rotationA - 1)}
                    aria-label="Team A (US) Rotation minus 1"
                    title="Previous rotation"
                  >
                    −1
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
