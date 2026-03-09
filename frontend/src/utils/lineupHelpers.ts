import type { Lineup, LineupPositionId } from "../components/StartingLineup";
import { playerIdToLineupKey } from "./visualizerRotations";
import { LINEUP_STORAGE_KEY } from "../constants";

export function loadLineupFromStorage(): { lineup: Lineup; showNumber: boolean; showName: boolean } {
  try {
    const s = localStorage.getItem(LINEUP_STORAGE_KEY);
    if (!s) return { lineup: {}, showNumber: false, showName: false };
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") {
      return {
        lineup: (parsed.lineup && typeof parsed.lineup === "object") ? parsed.lineup : {},
        showNumber: !!parsed.showNumber,
        showName: !!parsed.showName,
      };
    }
  } catch (_) {}
  return { lineup: {}, showNumber: false, showName: false };
}

export function getDisplayLabel(
  playerId: string,
  defaultLabel: string,
  lineup: Lineup,
  showNumber: boolean,
  showName: boolean
): string {
  const key = playerIdToLineupKey(playerId) as LineupPositionId;
  const entry = lineup[key];
  if (!entry) return defaultLabel;
  if (showNumber && entry.number.trim() !== "") return entry.number.trim();
  const first = (entry.firstName.trim()[0] ?? "").toUpperCase();
  const last = (entry.lastName.trim()[0] ?? "").toUpperCase();
  const initial = first || last ? first + last : "";
  if (showName && initial !== "") return initial;
  return defaultLabel;
}

/** Cell label for rotation table PDF: no name/no number → role (S1); number only → "OH1 (14)"; name only → "EC"; both → "EC (14)". */
export function getRotationTableLabel(
  playerId: string,
  lineup: Lineup,
  roleLabel: string
): string {
  const key = playerIdToLineupKey(playerId) as LineupPositionId;
  const entry = lineup[key];
  if (!entry) return roleLabel;
  const num = entry.number.trim();
  const first = (entry.firstName.trim()[0] ?? "").toUpperCase();
  const last = (entry.lastName.trim()[0] ?? "").toUpperCase();
  const initial = first || last ? first + last : "";
  const hasNumber = num !== "";
  const hasName = initial !== "";
  if (!hasName && !hasNumber) return roleLabel;
  if (!hasName && hasNumber) return `${roleLabel} (${num})`;
  if (hasName && !hasNumber) return initial;
  return `${initial} (${num})`;
}
