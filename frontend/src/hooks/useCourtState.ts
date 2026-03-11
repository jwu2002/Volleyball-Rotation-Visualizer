import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { RefObject } from "react";
import type { Annotation } from "../components/Court";
import { default51Rotations, default62Rotations, COLORS } from "../data/defaultRotations";
import type { RotationSnapshot, SavedVisualizerConfig } from "../types/savedConfig";
import {
  getDefaultRotationDataInitial,
  applyLiberoToBackRowMiddle,
  isValidRotation,
  getOutOfRotationMessage,
  getRotationSet,
  rotations51,
  type Player,
} from "../utils/visualizerRotations";
import { COURT_WIDTH, COURT_HEIGHT } from "../constants";

type ToastType = "success" | "error" | "info";

export function useCourtState(
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null,
  activeView: "court" | "planAhead",
  customConfigs: SavedVisualizerConfig[],
  options: {
    showToast: (message: string, type?: ToastType) => void;
    clearAnnotationSelectionRef: RefObject<(() => void) | undefined>;
  }
) {
  const { showToast, clearAnnotationSelectionRef } = options;
  const clearSel = () => clearAnnotationSelectionRef.current?.();

  const mainContentRef = useRef<HTMLDivElement>(null);
  const courtContainerRef = useRef<HTMLDivElement>(null);
  const [courtScale, setCourtScale] = useState(1);
  const [courtContainerReady, setCourtContainerReady] = useState(false);
  const [players, setPlayers] = useState<Player[]>(() => {
    const config = default51Rotations[0];
    if (config?.rotations?.[0]) return applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(config.rotations[0].players)));
    return JSON.parse(JSON.stringify(rotations51[0]));
  });
  const [isLocked, setIsLocked] = useState(false);
  const [serveReceive, setServeReceive] = useState(true);
  const [system, setSystem] = useState<"5-1" | "6-2">("5-1");
  const [rotation, setRotation] = useState<number>(1);
  const [rotationData, setRotationData] = useState<RotationSnapshot[]>(() =>
    getDefaultRotationDataInitial("5-1")
  );
  const [serveAnnotationsData, setServeAnnotationsData] = useState<Annotation[][]>(() =>
    Array.from({ length: 6 }, () => [])
  );
  const [customConfigKey, setCustomConfigKey] = useState<string>("");
  const [showLiberoModal, setShowLiberoModal] = useState(false);
  const [liberoTargetId, setLiberoTargetId] = useState<string | null>(null);
  const [showOutOfRotation, setShowOutOfRotation] = useState(false);
  const [outOfRotationMessage, setOutOfRotationMessage] = useState("");
  const [revertKey, setRevertKey] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    if (!user) {
      setCustomConfigKey("");
      setSystem("5-1");
      setRotation(1);
    }
  }, [user]);

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

  const getDefaultRotationData = useCallback((sys: "5-1" | "6-2"): RotationSnapshot[] => {
    const defaults = sys === "6-2" ? default62Rotations : default51Rotations;
    const config = defaults[0];
    if (!config?.rotations?.length) return [];
    return config.rotations.map((snap) => ({
      players: applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players))) as Player[],
      annotations: [] as Annotation[],
    }));
  }, []);

  const updatePlayers = useCallback(
    (sys: "5-1" | "6-2", rot: number, useReceiveFormation?: boolean) => {
      const useReceive = useReceiveFormation ?? serveReceive;
      if (useReceive) {
        const defaults = sys === "6-2" ? default62Rotations : default51Rotations;
        const config = defaults[0];
        const snap = config?.rotations?.[rot - 1];
        if (snap) {
          setPlayers(applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players))));
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
        clearSel();
        updatePlayers(system, rotation);
        return;
      }
      if (value.includes("-default")) {
        const allDefaults = [...default51Rotations, ...default62Rotations];
        const def = allDefaults.find((d) => d.id === value);
        if (def?.rotations?.length) {
          const data = def.rotations.map((snap) => ({
            players: applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players))) as Player[],
            annotations: [] as Annotation[],
          }));
          setRotationData(data);
          setServeAnnotationsData(Array.from({ length: 6 }, () => []));
          const snap = data[rotation - 1];
          setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
          setAnnotations([]);
          clearSel();
        }
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
          clearSel();
        }
        return;
      }
      setAnnotations([]);
      clearSel();
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
      clearSel();
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
      clearSel();
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
          setRotation(1);
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

  useEffect(() => {
    if (activeView !== "court") return;
    const el = courtContainerRef.current;
    if (!el) return;
    const updateScale = () => {
      const target = courtContainerRef.current;
      if (!target) return;
      const w = target.clientWidth;
      const h = target.clientHeight;
      if (w <= 0 || h <= 0) return;
      const rawScale = Math.min(w / COURT_WIDTH, h / COURT_HEIGHT);
      const minScale = w < 400 ? 0.3 : 0.2;
      const scale = Math.max(minScale, rawScale);
      setCourtScale(scale);
    };
    const raf = requestAnimationFrame(() => updateScale());
    const t = window.setTimeout(() => updateScale(), 100);
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    const mainEl = mainContentRef.current;
    if (mainEl) ro.observe(mainEl);
    let resizeTimeouts: ReturnType<typeof setTimeout>[] = [];
    const onWindowResize = () => {
      resizeTimeouts.forEach((id) => window.clearTimeout(id));
      resizeTimeouts = [];
      updateScale();
      requestAnimationFrame(updateScale);
      requestAnimationFrame(() => requestAnimationFrame(updateScale));
      resizeTimeouts.push(window.setTimeout(updateScale, 100));
      resizeTimeouts.push(window.setTimeout(updateScale, 400));
    };
    window.addEventListener("resize", onWindowResize);
    const mql = window.matchMedia("(min-width: 921px)");
    const onMatchChange = () => {
      updateScale();
      window.setTimeout(updateScale, 50);
      window.setTimeout(updateScale, 250);
    };
    mql.addEventListener("change", onMatchChange);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", onWindowResize);
      mql.removeEventListener("change", onMatchChange);
      resizeTimeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [activeView]);

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

  const currentLibero = players.find((p) => p.label === "L");

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
            setAnnotations([]);
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
          const snap = def?.rotations?.[rotation - 1];
          if (snap) setPlayers(applyLiberoToBackRowMiddle(JSON.parse(JSON.stringify(snap.players))));
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
    players,
    setPlayers,
    isLocked,
    setIsLocked,
    serveReceive,
    setServeReceive,
    system,
    setSystem,
    rotation,
    setRotation,
    rotationData,
    setRotationData,
    serveAnnotationsData,
    setServeAnnotationsData,
    customConfigKey,
    setCustomConfigKey,
    showLiberoModal,
    setShowLiberoModal,
    liberoTargetId,
    setLiberoTargetId,
    showOutOfRotation,
    outOfRotationMessage,
    revertKey,
    setRevertKey,
    annotations,
    setAnnotations,
    updatePlayers,
    getDefaultRotationData,
    loadConfigFromKey,
    handleSystemChange,
    handleRotationChange,
    handleCustomConfigChange,
    handleServeReceiveChange,
    handleConfirmLiberoSwitch,
    handleReset,
    handleDragEnd,
    handleRevertOutOfRotation,
    currentLibero,
    currentConfigDisplayName,
  };
}
