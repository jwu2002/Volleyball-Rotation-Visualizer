import "../styles/Modals.css";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig } from "../types/savedConfig";
import { MAX_NAME_LENGTH } from "../utils/nameSanitize";

type Player = { id: string; label: string; isFrontRow?: boolean };

export function SaveConfigModal(props: {
  open: boolean;
  name: string;
  system: "5-1" | "6-2";
  currentRotation: number;
  saveMode: "one" | "multi";
  saveRotationOne: number;
  saveRotationsMulti: boolean[];
  onNameChange: (v: string) => void;
  onSystemChange: (v: "5-1" | "6-2") => void;
  onSaveModeChange: (mode: "one" | "multi") => void;
  onSaveRotationOneChange: (r: number) => void;
  onSaveRotationsMultiChange: (index: number, checked: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  const selectedMulti = props.saveRotationsMulti.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
  return (
    <div className="modal-overlay">
      <div className="modal-panel save-config-modal-panel">
        <h3 className="modal-title">Save Configuration</h3>
        <input
          type="text"
          placeholder="Enter name (rotation prefix will be added)"
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          className="modal-input"
          maxLength={MAX_NAME_LENGTH}
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

        <div className="modal-section">
          <label className="modal-section-label">Save 1 rotation</label>
          <label className="save-config-option-row">
            <input
              type="radio"
              name="saveConfigMode"
              checked={props.saveMode === "one"}
              onChange={() => props.onSaveModeChange("one")}
            />
            <span>Save current court as rotation</span>
            <select
              value={props.saveRotationOne}
              onChange={(e) => props.onSaveRotationOneChange(Number(e.target.value))}
              disabled={props.saveMode !== "one"}
            >
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-section">
          <label className="modal-section-label">Save multiple rotations</label>
          <label className="save-config-option-row" style={{ marginBottom: 8 }}>
            <input
              type="radio"
              name="saveConfigMode"
              checked={props.saveMode === "multi"}
              onChange={() => props.onSaveModeChange("multi")}
            />
            <span>Save selected rotations (current configs/drawings for checked slots)</span>
          </label>
          <p className="modal-description" style={{ marginBottom: 8 }}>Check the rotations to save:</p>
          <div className="save-config-multi-checkboxes">
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <label key={r} className="save-config-check-label">
                <input
                  type="checkbox"
                  checked={props.saveRotationsMulti[r - 1]}
                  onChange={(e) => props.onSaveRotationsMultiChange(r - 1, e.target.checked)}
                  disabled={props.saveMode !== "multi"}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-success save-config-all-btn"
            disabled={props.saveMode !== "multi" || selectedMulti.length === 0}
            onClick={props.onSave}
          >
            Save all rotations
          </button>
        </div>

        {props.saveMode === "one" && (
          <div className="modal-actions">
            <button type="button" className="btn btn-success" onClick={props.onSave}>Save</button>
            <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
          </div>
        )}
        {props.saveMode === "multi" && (
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
          </div>
        )}
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
          maxLength={MAX_NAME_LENGTH}
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
          maxLength={MAX_NAME_LENGTH}
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onSave}>Save</button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function getRotationPreviewLabel(
  customConfigKey: string,
  customConfigs: SavedVisualizerConfig[]
): { title: string; detail: string } {
  if (!customConfigKey) {
    return { title: "None", detail: "No rotation loaded." };
  }
  if (customConfigKey.startsWith("custom:")) {
    const id = customConfigKey.replace("custom:", "");
    const cfg = customConfigs.find((c) => c.id === id);
    if (!cfg) return { title: "Custom", detail: "—" };
    const count = Array.isArray(cfg.rotations) ? cfg.rotations.length : 0;
    return {
      title: cfg.name,
      detail: `System: ${cfg.system} · ${count} rotation${count !== 1 ? "s" : ""} saved`,
    };
  }
  const d51 = default51Rotations.find((d) => d.id === customConfigKey);
  const d62 = default62Rotations.find((d) => d.id === customConfigKey);
  const d = d51 ?? d62;
  if (!d) return { title: customConfigKey, detail: "—" };
  return {
    title: d.name,
    detail: `System: ${d.system} · Rotation ${(d as { rotation?: number }).rotation ?? "—"}`,
  };
}

export function LineupExplorerModal(props: {
  open: boolean;
  customConfigKey: string;
  customConfigs: SavedVisualizerConfig[];
  onSelect: (key: string) => void;
  onDeleteConfig?: (id: string) => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  const preview = getRotationPreviewLabel(props.customConfigKey, props.customConfigs);
  const customItem = (c: SavedVisualizerConfig) => (
    <div key={c.id} className="lineup-explorer-item-row">
      <button
        type="button"
        className={`lineup-explorer-item ${props.customConfigKey === `custom:${c.id}` ? "active" : ""}`}
        onClick={() => { props.onSelect(`custom:${c.id}`); props.onClose(); }}
      >
        <span className="lineup-explorer-icon">📄</span>
        <span className="lineup-explorer-item-name" title={c.name}>{c.name}</span>
      </button>
      {props.onDeleteConfig && (
        <button
          type="button"
          className="lineup-explorer-delete"
          onClick={(e) => { e.stopPropagation(); props.onDeleteConfig?.(c.id); }}
          title="Delete configuration"
          aria-label={`Delete ${c.name}`}
        >
          Delete
        </button>
      )}
    </div>
  );
  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal-panel lineup-explorer-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Custom rotation</h3>
        <p className="modal-description" style={{ marginBottom: 8 }}>Choose a rotation to load.</p>
        <div className="lineup-explorer-preview">
          <div className="lineup-explorer-preview-title">{preview.title}</div>
          <div className="lineup-explorer-preview-detail">{preview.detail}</div>
        </div>
        <div className="lineup-explorer">
          <button
            type="button"
            className={`lineup-explorer-item ${!props.customConfigKey ? "active" : ""}`}
            onClick={() => { props.onSelect(""); props.onClose(); }}
          >
            <span className="lineup-explorer-icon">—</span>
            <span className="lineup-explorer-item-name">None</span>
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
                <span className="lineup-explorer-icon">📄</span>
                <span className="lineup-explorer-item-name" title={d.name}>{d.name}</span>
              </button>
            ))}
            {props.customConfigs.filter((c) => c.system === "5-1").map(customItem)}
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
                <span className="lineup-explorer-icon">📄</span>
                <span className="lineup-explorer-item-name" title={d.name}>{d.name}</span>
              </button>
            ))}
            {props.customConfigs.filter((c) => c.system === "6-2").map(customItem)}
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

export type ToastType = "success" | "error" | "info";

export function Toast(props: {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  visible: boolean;
}) {
  if (!props.visible) return null;
  return (
    <div
      className={`toast toast-${props.type}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-message">{props.message}</span>
      <button
        type="button"
        className="toast-dismiss"
        onClick={props.onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ConfirmModal(props: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 1600 }}>
      <div className="modal-panel confirm-modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{props.title}</h3>
        <p className="modal-description" style={{ marginBottom: 16 }}>{props.message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-success" onClick={props.onConfirm}>
            {props.confirmLabel ?? "Continue"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={props.onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
