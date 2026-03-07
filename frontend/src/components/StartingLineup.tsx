import React from "react";
import { COLORS } from "../data/defaultRotations";

export const LINEUP_POSITIONS = [
  "OH1",
  "OH2",
  "RS1",
  "RS2",
  "L",
  "MB1",
  "MB2",
  "S1",
  "S2",
] as const;

export type LineupPositionId = (typeof LINEUP_POSITIONS)[number];

export type LineupEntry = {
  firstName: string;
  lastName: string;
  number: string;
};

export type Lineup = Partial<Record<LineupPositionId, LineupEntry>>;

function sanitizeJerseyNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

const POSITION_LABELS: Record<LineupPositionId, { label: string; color: string; dashed: boolean }> = {
  OH1: { label: "OH1 - Outside Hitter 1", color: COLORS.OH, dashed: true },
  OH2: { label: "OH2 - Outside Hitter 2", color: COLORS.OH, dashed: false },
  RS1: { label: "RS1 - Right Side 1", color: COLORS.RS, dashed: false },
  RS2: { label: "RS2 - Right Side 2", color: COLORS.RS, dashed: true },
  L: { label: "L - Libero", color: COLORS.L, dashed: false },
  MB1: { label: "MB1 - Middle Blocker 1", color: COLORS.MB, dashed: true },
  MB2: { label: "MB2 - Middle Blocker 2", color: COLORS.MB, dashed: false },
  S1: { label: "S1 - Setter 1", color: COLORS.S, dashed: false },
  S2: { label: "S2 - Setter 2", color: COLORS.S, dashed: true },
};

export type SavedLineupItem = {
  id: string;
  name: string;
  lineup: Lineup;
  showNumber: boolean;
  showName: boolean;
};

type Props = {
  lineup: Lineup;
  showNumber: boolean;
  showName: boolean;
  onLineupChange: (position: LineupPositionId, entry: LineupEntry) => void;
  onShowNumberChange: (value: boolean) => void;
  onShowNameChange: (value: boolean) => void;
  savedLineups: SavedLineupItem[];
  selectedLineupId: string | null;
  onSelectLineup: (id: string | null) => void;
  onSaveLineupClick: () => void;
  user: { isAnonymous?: boolean } | null;
};

export const StartingLineup: React.FC<Props> = ({
  lineup,
  onLineupChange,
  savedLineups,
  selectedLineupId,
  onSelectLineup,
  onSaveLineupClick,
  user,
}) => {
  return (
    <div className="lineup-card">
      <div className="lineup-title">Lineup</div>
      <div className="lineup-saved-row">
        <select
          className="lineup-select"
          value={selectedLineupId ?? ""}
          onChange={(e) => onSelectLineup(e.target.value || null)}
          disabled={!user || user.isAnonymous || savedLineups.length === 0}
          aria-label="Saved lineups"
        >
          <option value="">{!user || user.isAnonymous || savedLineups.length === 0 ? "No lineup created" : "— Select lineup —"}</option>
          {savedLineups.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-lineup-save" onClick={onSaveLineupClick}>
          Save lineup
        </button>
      </div>
      <div className="lineup-legend-row">
        <span className="lineup-square" aria-hidden />
        <span>Front row (yellow square)</span>
      </div>
      <ul className="lineup-list">
        {LINEUP_POSITIONS.map((pos) => {
          const meta = POSITION_LABELS[pos];
          const entry = lineup[pos] ?? {
            firstName: "",
            lastName: "",
            number: "",
          };
          return (
            <li key={pos} className="lineup-item">
              <div className="lineup-label-cell">
                <span
                  className={`lineup-dot ${meta.dashed ? "dashed" : "solid"}`}
                  style={{ background: meta.color }}
                  aria-hidden
                />
                <span className="lineup-role-label">{meta.label}</span>
              </div>
              <div className="lineup-fields">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="#"
                  value={entry.number}
                  onChange={(e) =>
                    onLineupChange(pos, { ...entry, number: sanitizeJerseyNumber(e.target.value) })
                  }
                  className="lineup-input lineup-num"
                  autoComplete="off"
                  aria-label={`${meta.label} number`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
