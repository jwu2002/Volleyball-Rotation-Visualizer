import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Annotation } from "../components/Court";
import type { VisualizerViewContext, VisualizerPlayer } from "../components/VisualizerView";
import type { Lineup, LineupEntry, LineupPositionId } from "../components/StartingLineup";
import { auth } from "../firebaseConfig";
import { default51Rotations, default62Rotations, COLORS } from "../data/defaultRotations";
import type { RotationSnapshot, SavedVisualizerConfig } from "../types/savedConfig";
import {
  fetchSavedVisualizerConfigs,
  saveVisualizerConfig,
  updateVisualizerConfig,
  fetchSavedLineups as fetchSavedLineupsFromApi,
  saveLineup as saveLineupToStorage,
  updateLineup,
} from "../storage/configStorage";
import {
  getDefaultRotationDataInitial,
  applyLiberoToBackRowMiddle,
  isValidRotation,
  getOutOfRotationMessage,
  getRotationSet,
  rotations51,
  type Player,
} from "../utils/visualizerRotations";
import {
  LINEUP_STORAGE_KEY,
  COURT_WIDTH,
  COURT_HEIGHT,
  LINEUP_WIDTH,
  MAIN_GAP,
  COURT_TOOLBAR_HEIGHT,
} from "../constants";
import { loadLineupFromStorage, getDisplayLabel } from "../utils/lineupHelpers";

type ToastType = "success" | "error" | "info";

export function useVisualizerState(
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null,
  activeView: "court" | "planAhead",
  options?: {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  }
): VisualizerViewContext {
  const showToast = options?.showToast ?? ((msg: string) => alert(msg));
  const showConfirm = options?.showConfirm ?? ((_t, _m, onConfirm) => { if (window.confirm(_m)) onConfirm(); });
  const mainContentRef = useRef<HTMLDivElement>(null);
  const courtContainerRef = useRef<HTMLDivElement>(null);
  const [courtScale, setCourtScale] = useState(1);
  const [courtContainerReady, setCourtContainerReady] = useState(false);

  const [players, setPlayers] = useState<Player[]>(() => {
    const cfg = default51Rotations.find((d) => d.system === "5-1" && d.rotation === 1);
    if (cfg) return applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(cfg.players)));
    return JSON.parse(JSON.stringify(rotations51[0]));
  });
  const [isLocked, setIsLocked] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSystem, setNewSystem] = useState<"5-1" | "6-2">("5-1");
  const [newRotation, setNewRotation] = useState<number>(1);
  const [saveConfigMode, setSaveConfigMode] = useState<"one" | "multi">("one");
  const [saveRotationOne, setSaveRotationOne] = useState<number>(1);
  const [saveRotationsMulti, setSaveRotationsMulti] = useState<boolean[]>([false, false, false, false, false, false]);
  const [customConfigs, setCustomConfigs] = useState<SavedVisualizerConfig[]>([]);
  const [serveReceive, setServeReceive] = useState(true);
  const [system, setSystem] = useState<"5-1" | "6-2">("5-1");
  const [rotation, setRotation] = useState<number>(1);
  const [rotationData, setRotationData] = useState<RotationSnapshot[]>(() =>
    getDefaultRotationDataInitial("5-1")
  );
  /** Annotations for serve view only, per rotation (receive annotations live in rotationData). */
  const [serveAnnotationsData, setServeAnnotationsData] = useState<Annotation[][]>(() =>
    Array.from({ length: 6 }, () => [])
  );
  const [customConfigKey, setCustomConfigKey] = useState<string>("");
  const [showLiberoModal, setShowLiberoModal] = useState(false);
  const [liberoTargetId, setLiberoTargetId] = useState<string | null>(null);
  const [showOutOfRotation, setShowOutOfRotation] = useState(false);
  const [outOfRotationMessage, setOutOfRotationMessage] = useState("");
  const [revertKey, setRevertKey] = useState(0);
  const [lineup, setLineup] = useState<Lineup>(() => loadLineupFromStorage().lineup);
  const [savedLineups, setSavedLineups] = useState<
    { id: string; name: string; lineup: Lineup; showNumber: boolean; showName: boolean }[]
  >([]);
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);
  const [showSaveLineupModal, setShowSaveLineupModal] = useState(false);
  const [saveLineupName, setSaveLineupName] = useState("");
  const [showSavePlanModal, setShowSavePlanModal] = useState(false);
  const [savePlanName, setSavePlanName] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPopoverOpen, setDrawPopoverOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lineupExplorerOpen, setLineupExplorerOpen] = useState(false);
  const [drawTool, setDrawTool] = useState<"select" | "pencil" | "arrow" | "eraser">("select");
  const [pencilColor, setPencilColor] = useState("#1a1a1a");
  const [arrowColor, setArrowColor] = useState("#1a1a1a");
  const [arrowCurved, setArrowCurved] = useState(false);
  const [pencilMenuOpen, setPencilMenuOpen] = useState(false);
  const [arrowMenuOpen, setArrowMenuOpen] = useState(false);
  const [selectedAnnotationIndices, setSelectedAnnotationIndices] = useState<number[]>([]);

  const undoStackRef = useRef<Annotation[][]>([]);
  const redoStackRef = useRef<Annotation[][]>([]);
  const annotationsRef = useRef<Annotation[]>(annotations);
  const [undoStackLength, setUndoStackLength] = useState(0);
  const [redoStackLength, setRedoStackLength] = useState(0);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const userKey = user ? `${user.uid}-${user.isAnonymous}-${user.email ?? ""}` : "";
  useEffect(() => {
    if (!user) {
      setCustomConfigs([]);
      setSavedLineups([]);
      setSelectedLineupId(null);
      setCustomConfigKey("");
      setSystem("5-1");
      setRotation(1);
      return;
    }
    const loadFromApi = async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        const token = await u.getIdToken(true);
        const [configs, list] = await Promise.all([
          fetchSavedVisualizerConfigs(token),
          fetchSavedLineupsFromApi(token),
        ]);
        setCustomConfigs(configs);
        setSavedLineups(list);
        setSelectedLineupId((prev) => (prev && list.some((l) => l.id === prev)) ? prev : null);
      } catch {
        setCustomConfigs([]);
        setSavedLineups([]);
      }
    };
    loadFromApi();
  }, [user, userKey]);

  useEffect(() => {
    if (!serveReceive) return;
    setRotationData((prev) => {
      const idx = rotation - 1;
      if (idx < 0 || idx >= 6) return prev;
      return prev.map((r, i) =>
        i === idx
          ? {
              players: JSON.parse(JSON.stringify(players)) as Player[],
              annotations: JSON.parse(JSON.stringify(annotations)) as Annotation[],
            }
          : r
      );
    });
  }, [players, annotations, rotation, serveReceive]);

  useEffect(() => {
    if (serveReceive) return;
    setServeAnnotationsData((prev) =>
      prev.map((arr, i) => (i === rotation - 1 ? JSON.parse(JSON.stringify(annotations)) : arr))
    );
  }, [annotations, rotation, serveReceive]);

  const pushUndo = useCallback(() => {
    redoStackRef.current = [];
    setRedoStackLength(0);
    undoStackRef.current.push(JSON.parse(JSON.stringify(annotationsRef.current)));
    setUndoStackLength(undoStackRef.current.length);
  }, []);

  const translateAnnotation = useCallback((ann: Annotation, dx: number, dy: number): Annotation => {
    const points = [...ann.points];
    for (let i = 0; i < points.length; i += 2) {
      points[i] += dx;
      points[i + 1] += dy;
    }
    return { ...ann, points };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undoStackRef.current.length > 0) {
          redoStackRef.current.push(JSON.parse(JSON.stringify(annotations)));
          setRedoStackLength(redoStackRef.current.length);
          setAnnotations(undoStackRef.current.pop()!);
          setUndoStackLength(undoStackRef.current.length);
          setSelectedAnnotationIndices([]);
        }
        return;
      }
      if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        if (redoStackRef.current.length > 0) {
          undoStackRef.current.push(JSON.parse(JSON.stringify(annotations)));
          setUndoStackLength(undoStackRef.current.length);
          setAnnotations(redoStackRef.current.pop()!);
          setRedoStackLength(redoStackRef.current.length);
          setSelectedAnnotationIndices([]);
        }
        return;
      }
      if (!drawMode) return;
      if (e.key === "Backspace" && selectedAnnotationIndices.length > 0) {
        e.preventDefault();
        pushUndo();
        setAnnotations((prev) => prev.filter((_, i) => !selectedAnnotationIndices.includes(i)));
        setSelectedAnnotationIndices([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawMode, selectedAnnotationIndices, annotations, pushUndo]);

  const getDefaultRotationData = useCallback((sys: "5-1" | "6-2"): RotationSnapshot[] => {
    const defaults = sys === "6-2" ? default62Rotations : default51Rotations;
    return [1, 2, 3, 4, 5, 6].map((r) => {
      const cfg = defaults.find((d) => d.rotation === r);
      const pl = cfg ? applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(cfg.players))) : [];
      return { players: pl, annotations: [] as Annotation[] };
    });
  }, []);

  const updatePlayers = useCallback(
    (sys: "5-1" | "6-2", rot: number, useReceiveFormation?: boolean) => {
      const useReceive = useReceiveFormation ?? serveReceive;
      if (useReceive) {
        const allDefaults = [...default51Rotations, ...default62Rotations];
        const defaultConfig = allDefaults.find((d) => d.system === sys && d.rotation === rot);
        if (defaultConfig) {
          setPlayers(applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(defaultConfig.players))));
          return;
        }
      }
      const src = getRotationSet(sys);
      setPlayers(JSON.parse(JSON.stringify(src[rot - 1])));
    },
    [serveReceive]
  );

  const loadConfigFromKey = useCallback(
    (value: string) => {
      if (!value) {
        setAnnotations([]);
        setSelectedAnnotationIndices([]);
        updatePlayers(system, rotation);
        return;
      }
      if (value.includes("-default")) {
        const allDefaults = [...default51Rotations, ...default62Rotations];
        const def = allDefaults.find((d) => d.id === value);
        if (def) setPlayers(JSON.parse(JSON.stringify(def.players)));
        setAnnotations([]);
        setServeAnnotationsData(Array.from({ length: 6 }, () => []));
        return;
      }
      if (value.startsWith("custom:")) {
        const id = value.split("custom:")[1];
        const cfg = customConfigs.find((c) => c.id === id) as SavedVisualizerConfig | undefined;
        if (cfg) {
          let data: RotationSnapshot[];
          if (Array.isArray(cfg.rotations) && cfg.rotations.length === 6) {
            data = cfg.rotations.map((r) => ({
              players: JSON.parse(JSON.stringify(r.players)) as Player[],
              annotations: (Array.isArray(r.annotations) ? r.annotations : []).map((a: { type?: string; points?: number[]; stroke?: string; pointerAtBeginning?: boolean; pointerAtEnding?: boolean; tension?: number }) => ({
                type: a.type === "arrow" ? ("arrow" as const) : ("path" as const),
                points: Array.isArray(a.points) ? a.points : [],
                stroke: typeof a.stroke === "string" ? a.stroke : undefined,
                pointerAtBeginning: a.pointerAtBeginning === true,
                pointerAtEnding: a.pointerAtEnding !== false,
                tension: typeof a.tension === "number" ? a.tension : undefined,
              })),
            }));
          } else {
            const defaultData = getDefaultRotationDataInitial(cfg.system ?? "5-1");
            data = defaultData.map((r, i) =>
              i === 0
                ? {
                    players: JSON.parse(JSON.stringify((cfg as { players?: Player[] }).players ?? r.players)) as Player[],
                    annotations: Array.isArray((cfg as unknown as { annotations?: unknown[] }).annotations)
                      ? ((cfg as unknown as { annotations: unknown[] }).annotations).map((a: unknown) => {
                          const x = a as { type?: string; points?: number[]; stroke?: string; pointerAtBeginning?: boolean; pointerAtEnding?: boolean; tension?: number };
                          return {
                            type: x.type === "arrow" ? ("arrow" as const) : ("path" as const),
                            points: Array.isArray(x.points) ? x.points : [],
                            stroke: typeof x.stroke === "string" ? x.stroke : undefined,
                            pointerAtBeginning: x.pointerAtBeginning === true,
                            pointerAtEnding: x.pointerAtEnding !== false,
                            tension: typeof x.tension === "number" ? x.tension : undefined,
                          };
                        })
                      : [],
                  }
                : r
            );
          }
          setRotationData(data);
          setServeAnnotationsData(Array.from({ length: 6 }, () => []));
          const snap = data[rotation - 1];
          setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
          setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
          setSelectedAnnotationIndices([]);
        }
        return;
      }
      setAnnotations([]);
      setSelectedAnnotationIndices([]);
      const [sys, rotStr] = value.split(":");
      const newSys = (sys === "6-2" ? "6-2" : "5-1") as "5-1" | "6-2";
      const newRot = Number(rotStr);
      updatePlayers(newSys, newRot);
    },
    [customConfigs, rotation, system, updatePlayers]
  );

  const handleSystemChange = useCallback(
    (sys: "5-1" | "6-2") => {
      setSystem(sys);
      setCustomConfigKey("");
      const nextData = getDefaultRotationData(sys);
      setRotationData(nextData);
      const snap = nextData[rotation - 1];
      setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
      setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
      setSelectedAnnotationIndices([]);
    },
    [getDefaultRotationData, rotation]
  );

  const handleRotationChange = useCallback(
    (rot: number) => {
      if (rot === rotation) return;
      const idx = rotation - 1;
      if (serveReceive) {
        const nextData = rotationData.map((r, i) =>
          i === idx
            ? {
                players: JSON.parse(JSON.stringify(players)) as Player[],
                annotations: JSON.parse(JSON.stringify(annotations)) as Annotation[],
              }
            : r
        );
        setRotationData(nextData);
        setRotation(rot);
        const snap = nextData[rot - 1];
        setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
        setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
      } else {
        setServeAnnotationsData((prev) =>
          prev.map((arr, i) => (i === idx ? JSON.parse(JSON.stringify(annotations)) : arr))
        );
        setRotation(rot);
        setPlayers(JSON.parse(JSON.stringify(getRotationSet(system)[rot - 1])));
        setAnnotations(serveAnnotationsData[rot - 1] ? JSON.parse(JSON.stringify(serveAnnotationsData[rot - 1])) : []);
      }
      setSelectedAnnotationIndices([]);
    },
    [rotation, rotationData, players, annotations, serveReceive, system, serveAnnotationsData]
  );

  const handleCustomConfigChange = useCallback(
    (value: string) => {
      setCustomConfigKey(value);
      if (value.includes("-default")) {
        const allDefaults = [...default51Rotations, ...default62Rotations];
        const def = allDefaults.find((d) => d.id === value);
        if (def) {
          setSystem(def.system as "5-1" | "6-2");
          setRotation(def.rotation);
        }
      } else if (value.startsWith("custom:")) {
        const id = value.split("custom:")[1];
        const cfg = customConfigs.find((c) => c.id === id);
        if (cfg) {
          setSystem((cfg.system as "5-1" | "6-2") || "5-1");
          setRotation(1);
        }
      }
      loadConfigFromKey(value);
    },
    [customConfigs, loadConfigFromKey]
  );

  const fetchCustomConfigs = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setCustomConfigs([]);
      return;
    }
    try {
      const token = await u.getIdToken(true);
      const configs = await fetchSavedVisualizerConfigs(token);
      setCustomConfigs(configs);
    } catch {
      setCustomConfigs([]);
    }
  }, []);

  const fetchSavedLineups = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setSavedLineups([]);
      return;
    }
    try {
      const token = await u.getIdToken(true);
      const list = await fetchSavedLineupsFromApi(token);
      setSavedLineups(list);
      setSelectedLineupId((prev) => (prev && list.some((l) => l.id === prev)) ? prev : null);
    } catch {
      setSavedLineups([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        LINEUP_STORAGE_KEY,
        JSON.stringify({ lineup, showNumber: true, showName: false })
      );
    } catch (_) {}
  }, [lineup]);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const availW = w - LINEUP_WIDTH - MAIN_GAP;
      const availH = Math.max(0, h - COURT_TOOLBAR_HEIGHT);
      const scale = Math.min(1, availW / COURT_WIDTH, availH / COURT_HEIGHT);
      setCourtScale(scale);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (activeView !== "court") {
      setCourtContainerReady(false);
      return;
    }
    const el = courtContainerRef.current;
    if (!el) return;
    const check = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setCourtContainerReady(true);
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => {
      ro.disconnect();
      setCourtContainerReady(false);
    };
  }, [activeView]);


  const handleOverwriteCurrentConfig = useCallback(() => {
    if (!customConfigKey.startsWith("custom:")) {
      showToast("Only custom configurations can be overwritten.", "info");
      return;
    }
    const id = customConfigKey.split("custom:")[1];
    const configName = customConfigs.find((c) => c.id === id)?.name ?? "this configuration";
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Not signed in.", "info");
      return;
    }
    showConfirm(
      "Overwrite configuration",
      `The rotation(s) you selected will be overwritten in "${configName}". This cannot be undone.`,
      async () => {
        try {
          const payload = {
            system,
            rotations: rotationData.map((r) => ({
              players: JSON.parse(JSON.stringify(r.players)),
              annotations: JSON.parse(JSON.stringify(r.annotations)),
            })),
          };
          const token = await currentUser.getIdToken(true);
          await updateVisualizerConfig(currentUser.uid, id, payload, token);
          showToast("Configuration updated.", "success");
          await fetchCustomConfigs();
        } catch (err) {
          console.error("Error overwriting config:", err);
          showToast("Failed to overwrite configuration.", "error");
        }
      }
    );
  }, [customConfigKey, customConfigs, system, rotationData, fetchCustomConfigs, showToast, showConfirm]);

  const currentLibero = players.find((p) => p.label === "L");

  const handleLineupChange = useCallback((position: LineupPositionId, entry: LineupEntry) => {
    setLineup((prev) => ({ ...prev, [position]: entry }));
  }, []);

  const displayPlayers = useMemo(
    () =>
      players.map((p) => ({
        ...p,
        label: getDisplayLabel(p.id, p.label, lineup, true, false),
      })),
    [players, lineup]
  );

  const currentConfigDisplayName = useMemo(() => {
    if (!customConfigKey) return `Default (${system} R${rotation})`;
    if (customConfigKey.includes("-default")) {
      const allDefaults = [...default51Rotations, ...default62Rotations];
      const def = allDefaults.find((d) => d.id === customConfigKey);
      return def ? def.name : `Default (${system} R${rotation})`;
    }
    if (customConfigKey.startsWith("custom:")) {
      const id = customConfigKey.split("custom:")[1];
      const cfg = customConfigs.find((c) => c.id === id);
      return cfg ? cfg.name : "";
    }
    return "";
  }, [customConfigKey, customConfigs, system, rotation]);

  const handleServeReceiveChange = useCallback(
    (useReceive: boolean) => {
      if (!customConfigKey) {
        if (useReceive) {
          const snap = rotationData[rotation - 1];
          if (snap?.players?.length) {
            setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
            setAnnotations(snap.annotations?.length ? JSON.parse(JSON.stringify(snap.annotations)) : []);
          } else {
            updatePlayers(system, rotation, true);
          }
        } else {
          setPlayers(JSON.parse(JSON.stringify(getRotationSet(system)[rotation - 1])));
          setAnnotations(serveAnnotationsData[rotation - 1] ? JSON.parse(JSON.stringify(serveAnnotationsData[rotation - 1])) : []);
        }
        return;
      }
      if (customConfigKey.includes("-default")) {
        if (useReceive) {
          const allDefaults = [...default51Rotations, ...default62Rotations];
          const def = allDefaults.find((d) => d.id === customConfigKey);
          if (def) setPlayers(applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(def.players))));
          setAnnotations([]);
        } else {
          setPlayers(JSON.parse(JSON.stringify(getRotationSet(system)[rotation - 1])));
          setAnnotations(serveAnnotationsData[rotation - 1] ? JSON.parse(JSON.stringify(serveAnnotationsData[rotation - 1])) : []);
        }
        return;
      }
      if (customConfigKey.startsWith("custom:")) {
        if (useReceive) {
          const snap = rotationData[rotation - 1];
          if (snap) {
            setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
            setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
          }
        } else {
          setPlayers(JSON.parse(JSON.stringify(getRotationSet(system)[rotation - 1])));
          setAnnotations(serveAnnotationsData[rotation - 1] ? JSON.parse(JSON.stringify(serveAnnotationsData[rotation - 1])) : []);
        }
      }
    },
    [customConfigKey, system, rotation, rotationData, serveAnnotationsData, updatePlayers]
  );

  const handleSelectLineupResolved = useCallback((id: string | null) => {
    setSelectedLineupId(id);
    if (!id) return;
    const saved = savedLineups.find((l) => l.id === id);
    if (saved) setLineup(saved.lineup);
  }, [savedLineups]);

  const handleSaveLineupClick = useCallback(() => {
    if (!user || user.isAnonymous) {
      showToast("Sign in to save lineups.", "info");
      return;
    }
    setSaveLineupName(
      selectedLineupId ? savedLineups.find((l) => l.id === selectedLineupId)?.name ?? "" : ""
    );
    setShowSaveLineupModal(true);
  }, [user, selectedLineupId, savedLineups, showToast]);

  const handleSaveLineupSubmit = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    const name = saveLineupName.trim() || "Unnamed lineup";
    try {
      const token = await u.getIdToken(true);
      if (selectedLineupId) {
        await updateLineup(u.uid, selectedLineupId, name, lineup, true, false, token);
      } else {
        const saved = await saveLineupToStorage(u.uid, name, lineup, true, false, token);
        setSelectedLineupId(saved.id);
      }
      await fetchSavedLineups();
      setShowSaveLineupModal(false);
      setSaveLineupName("");
    } catch (err) {
      console.error("Save lineup error:", err);
      showToast("Failed to save lineup.", "error");
    }
  }, [saveLineupName, selectedLineupId, lineup, fetchSavedLineups, showToast]);

  const handleSaveNewConfig = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Not signed in yet. Please wait a moment or log in.", "info");
      return;
    }
    const trimmedName = (newName || "").trim();
    if (!trimmedName) {
      showToast("Please enter a name for this configuration.", "info");
      return;
    }
    const defaultData = getDefaultRotationDataInitial(newSystem);
    let rotationsToSave: RotationSnapshot[];
    if (saveConfigMode === "one") {
      rotationsToSave = defaultData.map((r, i) =>
        i === saveRotationOne - 1
          ? { players: JSON.parse(JSON.stringify(players)), annotations: JSON.parse(JSON.stringify(annotations)) }
          : { players: JSON.parse(JSON.stringify(r.players)), annotations: [...(r.annotations || [])] }
      );
    } else {
      const selected = saveRotationsMulti.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
      if (selected.length === 0) {
        showToast("Select at least one rotation to save.", "info");
        return;
      }
      rotationsToSave = defaultData.map((r, i) =>
        saveRotationsMulti[i]
          ? { players: JSON.parse(JSON.stringify(rotationData[i].players)), annotations: JSON.parse(JSON.stringify(rotationData[i].annotations)) }
          : { players: JSON.parse(JSON.stringify(r.players)), annotations: [...(r.annotations || [])] }
      );
    }
    try {
      const payload = {
        system: newSystem,
        rotations: rotationsToSave,
      };
      const token = await currentUser.getIdToken(true);
      const saved = await saveVisualizerConfig(currentUser.uid, trimmedName, payload, token);
      showToast("Configuration saved.", "success");
      setShowSaveModal(false);
      setNewName("");
      setSaveRotationsMulti([false, false, false, false, false, false]);
      await fetchCustomConfigs();
      setCustomConfigKey(`custom:${saved.id}`);
      setSystem(newSystem);
      setRotation(saveConfigMode === "one" ? saveRotationOne : 1);
      const snap = rotationsToSave[saveConfigMode === "one" ? saveRotationOne - 1 : 0];
      setRotationData(rotationsToSave.map((r) => ({ players: JSON.parse(JSON.stringify(r.players)), annotations: JSON.parse(JSON.stringify(r.annotations)) })));
      setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
      setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
    } catch (err: unknown) {
      console.error("Error saving config:", err);
      showToast(err instanceof Error ? err.message : "Failed to save configuration.", "error");
    }
  }, [
    showToast,
    newName,
    newSystem,
    saveConfigMode,
    saveRotationOne,
    saveRotationsMulti,
    rotationData,
    players,
    annotations,
    getDefaultRotationDataInitial,
    fetchCustomConfigs,
  ]);

  const handleConfirmLiberoSwitch = useCallback(() => {
    if (!liberoTargetId) {
      setShowLiberoModal(false);
      return;
    }
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === liberoTargetId) {
          return { ...p, label: "L", color: COLORS.L, isLibero: true };
        }
        return { ...p, isLibero: false };
      })
    );
    setShowLiberoModal(false);
  }, [liberoTargetId]);

  const handleReset = useCallback(() => {
    if (customConfigKey) loadConfigFromKey(customConfigKey);
    else updatePlayers(system, rotation);
  }, [customConfigKey, system, rotation, loadConfigFromKey, updatePlayers]);

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const newPlayers = players.map((p) => (p.id === id ? { ...p, x, y } : p));
      // Enforce rotation rules whenever court is unlocked (defaults and saved custom configs)
      if (!isLocked) {
      if (!isValidRotation(newPlayers, system, rotation)) {
          const message =
            getOutOfRotationMessage(id, newPlayers, system, rotation) ?? "Out of rotation";
          setOutOfRotationMessage(message);
          setShowOutOfRotation(true);
          setRevertKey((k) => k + 1);
          setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, x: p.x, y: p.y } : { ...p })));
          return;
        }
      }
      setPlayers(newPlayers);
    },
    [players, isLocked, system, rotation]
  );

  const handleRevertOutOfRotation = useCallback(() => {
    setShowOutOfRotation(false);
    setOutOfRotationMessage("");
    showToast("Reverted to previous position.", "success");
  }, [showToast]);

  return {
    mainContentRef,
    courtContainerRef,
    courtScale,
    courtContainerReady,
    serveReceive,
    setServeReceive,
    rotation,
    system,
    customConfigKey,
    currentConfigDisplayName,
    updatePlayers,
    handleServeReceiveChange,
    handleRotationChange,
    handleSystemChange,
    players: players as VisualizerPlayer[],
    currentLibero: currentLibero as VisualizerPlayer | undefined,
    setPlayers: setPlayers as React.Dispatch<React.SetStateAction<VisualizerPlayer[]>>,
    showLiberoModal,
    liberoTargetId,
    setLiberoTargetId,
    setShowLiberoModal,
    handleConfirmLiberoSwitch,
    lineup,
    handleLineupChange,
    savedLineups,
    selectedLineupId,
    handleSelectLineup: handleSelectLineupResolved,
    handleSaveLineupClick,
    user,
    fileMenuOpen,
    setFileMenuOpen,
    activeView,
    customConfigs,
    handleCustomConfigChange,
    setNewSystem,
    setNewRotation,
    showSaveModal,
    newName,
    newSystem,
    newRotation,
    saveConfigMode,
    saveRotationOne,
    saveRotationsMulti,
    setNewName,
    setShowSaveModal,
    setSaveConfigMode,
    setSaveRotationOne,
    setSaveRotationsMulti,
    handleSaveNewConfig,
    handleOverwriteCurrentConfig,
    showSaveLineupModal,
    saveLineupName,
    setSaveLineupName,
    setShowSaveLineupModal,
    handleSaveLineupSubmit,
    showSavePlanModal,
    savePlanName,
    setSavePlanName,
    setShowSavePlanModal,
    lineupExplorerOpen,
    setLineupExplorerOpen,
    drawMode,
    setDrawMode,
    drawPopoverOpen,
    setDrawPopoverOpen,
    drawTool,
    setDrawTool,
    pencilColor,
    setPencilColor,
    pencilMenuOpen,
    setPencilMenuOpen,
    arrowColor,
    setArrowColor,
    arrowMenuOpen,
    setArrowMenuOpen,
    arrowCurved,
    setArrowCurved,
    selectedAnnotationIndices,
    setSelectedAnnotationIndices,
    pushUndo,
    setAnnotations,
    annotations,
    translateAnnotation,
    isLocked,
    setIsLocked,
    handleReset,
    undoStackRef,
    redoStackRef,
    undoStackLength,
    redoStackLength,
    setUndoStackLength,
    setRedoStackLength,
    displayPlayers: displayPlayers as VisualizerPlayer[],
    handleDragEnd,
    revertKey,
    showOutOfRotation,
    outOfRotationMessage,
    handleRevertOutOfRotation,
  };
}
