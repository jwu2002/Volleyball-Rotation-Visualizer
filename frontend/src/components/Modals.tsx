import "../styles/Modals.css";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig } from "../types/savedConfig";

type Player = { id: string; label: string; isFrontRow?: boolean };

export function SaveConfigModal(props: {
  open: boolean;
  name: string;
  system: "5-1" | "6-2";
  rotation: number;
  onNameChange: (v: string) => void;
  onSystemChange: (v: "5-1" | "6-2") => void;
  onRotationChange: (v: number) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="modal-title">Save Configuration</h3>
        <input
          type="text"
          placeholder="Enter name (rotation prefix will be added)"
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
        />
        <div className="modal-section">
          <label>5-1 or 6-2</label>
          <div className="modal-radio-group">
            <label>
              <input type="radio" name="system" value="5-1" checked={props.system === "5-1"} onChange={() => props.onSystemChange("5-1")} />
              <span>5–1</span>
            </label>
            <label>
              <input type="radio" name="system" value="6-2" checked={props.system === "6-2"} onChange={() => props.onSystemChange("6-2")} />
              <span>6–2</span>
            </label>
          </div>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: "0.8125rem" }}>Rotation</label>
          <select value={props.rotation} onChange={(e) => props.onRotationChange(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function SaveLineupModal(props: {
  open: boolean;
  name: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="modal-title">Save lineup</h3>
        <input
          type="text"
          placeholder="Lineup name"
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function SavePlanModal(props: {
  open: boolean;
  name: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="modal-title">Save plan</h3>
        <input
          type="text"
          placeholder="Plan name"
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function LineupExplorerModal(props: {
  open: boolean;
  customConfigKey: string;
  customConfigs: SavedVisualizerConfig[];
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal-panel lineup-explorer-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Custom rotation</h3>
        <p className="modal-description" style={{ marginBottom: 12 }}>Choose a lineup to load.</p>
        <div className="lineup-explorer">
          <button
            type="button"
            className={`lineup-explorer-item ${!props.customConfigKey ? "active" : ""}`}
            onClick={() => { props.onSelect(""); props.onClose(); }}
          >
            <span className="lineup-explorer-icon">—</span> None
          </button>
          <div className="lineup-explorer-section">
            <div className="lineup-explorer-section-title">5-1</div>
            {default51Rotations.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`lineup-explorer-item ${props.customConfigKey === d.id ? "active" : ""}`}
                onClick={() => { props.onSelect(d.id); props.onClose(); }}
              >
                <span className="lineup-explorer-icon">📄</span> {d.name}
              </button>
            ))}
            {props.customConfigs.filter((c) => c.system === "5-1").map((c) => (
              <button
                key={c.id}
                type="button"
                className={`lineup-explorer-item ${props.customConfigKey === `custom:${c.id}` ? "active" : ""}`}
                onClick={() => { props.onSelect(`custom:${c.id}`); props.onClose(); }}
              >
                <span className="lineup-explorer-icon">📄</span> {c.name}
              </button>
            ))}
          </div>
          <div className="lineup-explorer-section">
            <div className="lineup-explorer-section-title">6-2</div>
            {default62Rotations.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`lineup-explorer-item ${props.customConfigKey === d.id ? "active" : ""}`}
                onClick={() => { props.onSelect(d.id); props.onClose(); }}
              >
                <span className="lineup-explorer-icon">📄</span> {d.name}
              </button>
            ))}
            {props.customConfigs.filter((c) => c.system === "6-2").map((c) => (
              <button
                key={c.id}
                type="button"
                className={`lineup-explorer-item ${props.customConfigKey === `custom:${c.id}` ? "active" : ""}`}
                onClick={() => { props.onSelect(`custom:${c.id}`); props.onClose(); }}
              >
                <span className="lineup-explorer-icon">📄</span> {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function LiberoModal(props: {
  open: boolean;
  players: Player[];
  liberoTargetId: string | null;
  onLiberoTargetChange: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  const backRow = props.players.filter((p) => !p.isFrontRow);
  return (
    <div className="modal-overlay" style={{ zIndex: 1400 }}>
      <div className="modal-panel">
        <h3 className="modal-title">Switch Libero</h3>
        <p className="modal-description">Choose which back-row player should become the libero in this rotation.</p>
        {backRow.length === 0 ? (
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>There are no back-row players in this configuration.</div>
        ) : (
          <div className="modal-radio-group" style={{ marginTop: 8 }}>
            {backRow.map((p) => (
              <label key={p.id}>
                <input
                  type="radio"
                  name="liberoTarget"
                  value={p.id}
                  checked={props.liberoTargetId === p.id}
                  onChange={() => props.onLiberoTargetChange(p.id)}
                />
                <span>{p.label} ({p.id})</span>
              </label>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onConfirm} disabled={!props.liberoTargetId}>Apply</button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
