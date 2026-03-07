import React from "react";
import "../styles/LineupTable.css";
import { COLORS } from "../data/defaultRotations";
import type { Lineup, LineupEntry, LineupPositionId } from "./StartingLineup";
import { LINEUP_POSITIONS } from "./StartingLineup";

function sanitizeLetters(value: string): string {
  return value.replace(/[^A-Za-z]/g, "");
}
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

type Props = {
  title: string;
  accentColor: string;
  lineup: Lineup;
  onLineupChange: (position: LineupPositionId, entry: LineupEntry) => void;
  showNumber: boolean;
  showName: boolean;
  onShowNumberChange: (v: boolean) => void;
  onShowNameChange: (v: boolean) => void;
};

export const LineupTable: React.FC<Props> = ({
  title,
  accentColor,
  lineup,
  onLineupChange,
  showNumber,
  showName,
  onShowNumberChange,
  onShowNameChange,
}) => {
  return (
    <div className="lineup-table-card" style={{ borderTopColor: accentColor }}>
      <div className="lineup-table-title">{title}</div>
      <div className="lineup-table-options">
        <label className="control-check">
          <input
            type="checkbox"
            checked={showNumber}
            onChange={(e) => {
              const v = e.target.checked;
              onShowNumberChange(v);
              if (v) onShowNameChange(false);
            }}
          />
          Number
        </label>
        <label className="control-check">
          <input
            type="checkbox"
            checked={showName}
            onChange={(e) => {
              const v = e.target.checked;
              onShowNameChange(v);
              if (v) onShowNumberChange(false);
            }}
          />
          Initial
        </label>
      </div>
      <ul className="lineup-table-list">
        {LINEUP_POSITIONS.map((pos) => {
          const meta = POSITION_LABELS[pos];
          const entry = lineup[pos] ?? { firstName: "", lastName: "", number: "" };
          return (
            <li key={pos} className="lineup-table-item">
              <span className="lineup-table-role" style={{ color: meta.color }}>{meta.label}</span>
              <input
                type="text"
                placeholder="First"
                value={entry.firstName}
                onChange={(e) =>
                  onLineupChange(pos, { ...entry, firstName: sanitizeLetters(e.target.value) })
                }
                className="lineup-table-input"
              />
              <input
                type="text"
                placeholder="Last"
                value={entry.lastName}
                onChange={(e) =>
                  onLineupChange(pos, { ...entry, lastName: sanitizeLetters(e.target.value) })
                }
                className="lineup-table-input"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="#"
                value={entry.number}
                onChange={(e) =>
                  onLineupChange(pos, { ...entry, number: sanitizeJerseyNumber(e.target.value) })
                }
                className="lineup-table-input lineup-table-num"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
