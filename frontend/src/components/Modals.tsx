import "../styles/Modals.css";
import { default51Rotations, default62Rotations } from "../data/defaultRotations";
import type { SavedVisualizerConfig } from "../types/savedConfig";
import { MAX_NAME_LENGTH } from "../utils/nameSanitize";

type Player = { id: string; label: string; isFrontRow?: boolean };

export function SaveConfigModal(props: {
  open: boolean;
  name: string;
  system: "5-1" | "6-2";
  saveRotationsMulti: boolean[];
  onNameChange: (v: string) => void;
  onSystemChange: (v: "5-1" | "6-2") => void;
  onSaveRotationsMultiChange: (index: number, checked: boolean) => void;
  onCheckAllRotations: (checked: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  const selectedCount = props.saveRotationsMulti.filter(Boolean).length;
  const allChecked = selectedCount === 6;
  return (
    <div className="modal-overlay">
      <div className="modal-panel save-config-modal-panel">
        <h3 className="modal-title">Save Configuration</h3>
        <input
          type="text"
          placeholder="Enter name"
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
          <label className="modal-section-label">Rotations to save</label>
          <p className="modal-description" style={{ marginBottom: 8 }}>
            Select which rotations to save (each includes both serve and receive drawings).
          </p>
          <div className="save-config-multi-checkboxes">
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <label key={r} className="save-config-check-label">
                <input
                  type="checkbox"
                  checked={props.saveRotationsMulti[r - 1]}
                  onChange={(e) => props.onSaveRotationsMultiChange(r - 1, e.target.checked)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary save-config-check-all-btn"
            onClick={() => props.onCheckAllRotations(!allChecked)}
          >
            {allChecked ? "Uncheck all" : "Check all"}
          </button>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-success"
            disabled={selectedCount === 0}
            onClick={props.onSave}
          >
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function SaveLineupModal(props: {
  open: boolean;
  name: string;
  title?: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h3 className="modal-title">{props.title ?? "Save lineup as"}</h3>
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
  const rotCount = d.rotations?.length ?? 0;
  return {
    title: d.name,
    detail: `System: ${d.system} · ${rotCount} rotation${rotCount !== 1 ? "s" : ""}`,
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
          onClick={(e) => { e.stopPropagation(); if (c.id) props.onDeleteConfig?.(c.id); }}
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
        <h3 className="modal-title">Custom config</h3>
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
                <span>{p.id} ({p.label})</span>
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

export type ExportOptions = { applyLineup: boolean; lineupId: string | null; configId: string | null; rotations: number[] };

export type SavedLineupItem = { id: string; name: string; lineup: unknown; showNumber: boolean; showName: boolean };

export type SavedConfigItem = { id: string; name: string };

export function ExportModal(props: {
  open: boolean;
  onClose: () => void;
  savedLineups: SavedLineupItem[];
  exportLineupId: string | null;
  onExportLineupIdChange: (id: string | null) => void;
  customConfigs: SavedConfigItem[];
  exportConfigId: string | null;
  onExportConfigIdChange: (id: string | null) => void;
  rotations: boolean[];
  onRotationsChange: (index: number, checked: boolean) => void;
  onExport: (opts: ExportOptions) => Promise<void>;
  exporting: boolean;
}) {
  if (!props.open) return null;
  const selectedRotations = props.rotations.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
  const canExport = selectedRotations.length > 0;
  return (
    <div className="modal-overlay">
      <div className="modal-panel export-modal-panel">
        <h3 className="modal-title">Export as PDF</h3>
        <p className="modal-description">Export a one-page rotation sheet with tables and court diagrams. You can preview the PDF before saving.</p>

        <div className="modal-section">
          <label className="modal-section-label">Configuration</label>
          <select
            className="modal-input"
            value={props.exportConfigId ?? ""}
            onChange={(e) => props.onExportConfigIdChange(e.target.value || null)}
            style={{ marginBottom: 0 }}
          >
            <option value="">Current configuration</option>
            {props.customConfigs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="modal-section">
          <label className="modal-section-label">Lineup</label>
          <select
            className="modal-input"
            value={props.exportLineupId ?? ""}
            onChange={(e) => props.onExportLineupIdChange(e.target.value || null)}
            style={{ marginBottom: 0 }}
          >
            <option value="">None</option>
            {props.savedLineups.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {props.savedLineups.length === 0 && (
            <p className="modal-description export-note" style={{ marginTop: 6 }}>No lineups saved. Save a lineup to apply names/numbers in the export.</p>
          )}
        </div>

        <div className="modal-section">
          <label className="modal-section-label">Rotations to include</label>
          <div className="export-rotations-row">
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <label key={r} className="export-check-row">
                <input
                  type="checkbox"
                  checked={props.rotations[r - 1]}
                  onChange={(e) => props.onRotationsChange(r - 1, e.target.checked)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-success"
            disabled={!canExport || props.exporting}
            onClick={() => props.onExport({ applyLineup: !!props.exportLineupId, lineupId: props.exportLineupId, configId: props.exportConfigId, rotations: selectedRotations })}
          >
            {props.exporting ? "Exporting…" : "Export PDF"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={props.onClose} disabled={props.exporting}>
            Cancel
          </button>
        </div>
      </div>
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
