import { useState, useCallback } from "react";
import { auth } from "../firebaseConfig";
import { configsApi } from "../api/client";
import type { RotationSnapshot, SavedVisualizerConfig } from "../types/savedConfig";
import { getDefaultRotationDataInitial, getRotationSet } from "../utils/visualizerRotations";
import { sanitizeName } from "../utils/nameSanitize";
import type { Player } from "../utils/visualizerRotations";
import type { Annotation } from "../components/Court";

type ToastType = "success" | "error" | "info";

export function useConfigSaveState(
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null,
  court: {
    system: "5-1" | "6-2";
    serveReceive: boolean;
    rotationData: RotationSnapshot[];
    serveAnnotationsData: Annotation[][];
    setServeAnnotationsData: React.Dispatch<React.SetStateAction<Annotation[][]>>;
    players: Player[];
    annotations: Annotation[];
    rotation: number;
    customConfigKey: string;
    setSystem: (v: "5-1" | "6-2") => void;
    setRotation: (v: number) => void;
    setRotationData: React.Dispatch<React.SetStateAction<RotationSnapshot[]>>;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
    setCustomConfigKey: (v: string) => void;
    updatePlayers: (sys: "5-1" | "6-2", rot: number) => void;
  },
  savedData: {
    customConfigs: SavedVisualizerConfig[];
    fetchCustomConfigs: () => Promise<void>;
  },
  showToast: (message: string, type?: ToastType) => void,
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void,
  onSaveSuccess?: () => void
) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSystem, setNewSystem] = useState<"5-1" | "6-2">("5-1");
  const [newRotation, setNewRotation] = useState<number>(1);
  const [saveRotationsMulti, setSaveRotationsMulti] = useState<boolean[]>([false, false, false, false, false, false]);

  const handleOverwriteCurrentConfig = useCallback(() => {
    if (!court.customConfigKey.startsWith("custom:")) {
      showToast("Only custom configurations can be overwritten.", "info");
      return;
    }
    const id = court.customConfigKey.split("custom:")[1];
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Not signed in.", "info");
      return;
    }
    showConfirm(
      "Save configuration",
      "Save changes to (current custom config)?",
      async () => {
        try {
          const payload = {
            system: court.system,
            rotations: court.rotationData.map((r, i) => ({
              players: JSON.parse(JSON.stringify(r.players)),
              annotations: JSON.parse(JSON.stringify(r.annotations)),
              serveAnnotations: JSON.parse(JSON.stringify(court.serveAnnotationsData[i] ?? [])),
            })),
          };
          const token = await currentUser.getIdToken(true);
          await configsApi.update(token, id, { system: payload.system, rotations: payload.rotations });
          showToast("Configuration updated.", "success");
          await savedData.fetchCustomConfigs();
        } catch (err) {
          console.error("Error overwriting config:", err);
          showToast("Failed to overwrite configuration.", "error");
        }
      }
    );
  }, [court.customConfigKey, court.system, court.rotationData, savedData.fetchCustomConfigs, showToast, showConfirm]);

  const handleDeleteConfig = useCallback(
    (id: string) => {
      const config = savedData.customConfigs.find((c) => c.id === id);
      if (!config) return;
      if (!user) return;
      showConfirm("Delete configuration", `Delete "${config.name}"? This cannot be undone.`, async () => {
        const u = auth.currentUser;
        if (!u) return;
        try {
          const token = await u.getIdToken(true);
          await configsApi.delete(token, id);
          if (court.customConfigKey === `custom:${id}`) {
            court.setCustomConfigKey("");
            court.updatePlayers(court.system, court.rotation);
          }
          await savedData.fetchCustomConfigs();
          showToast("Configuration deleted.", "success");
        } catch {
          showToast("Failed to delete configuration.", "error");
        }
      });
    },
    [savedData.customConfigs, savedData.fetchCustomConfigs, court.customConfigKey, court.setCustomConfigKey, court.system, court.rotation, court.updatePlayers, user, showToast, showConfirm]
  );

  const handleSaveNewConfig = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Not signed in yet. Please wait a moment or log in.", "info");
      return;
    }
    if (user?.isAnonymous) {
      showToast("Sign in to save configurations.", "info");
      return;
    }
    const trimmedName = (newName || "").trim();
    if (!trimmedName) {
      showToast("Please enter a name for this configuration.", "info");
      return;
    }
    const name = sanitizeName(trimmedName);
    const defaultData = getDefaultRotationDataInitial(newSystem);
    const selected = saveRotationsMulti.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
    if (selected.length === 0) {
      showToast("Select at least one rotation to save.", "info");
      return;
    }
    const rotationsToSave: RotationSnapshot[] = defaultData.map((r, i) =>
      saveRotationsMulti[i]
        ? {
            players: JSON.parse(JSON.stringify(court.rotationData[i].players)),
            annotations: JSON.parse(JSON.stringify(court.rotationData[i].annotations)),
            serveAnnotations: JSON.parse(JSON.stringify(court.serveAnnotationsData[i] ?? [])),
          }
        : { players: JSON.parse(JSON.stringify(r.players)), annotations: [...(r.annotations || [])] }
    );
    try {
      const payload = {
        system: newSystem,
        rotations: rotationsToSave,
      };
      const token = await currentUser.getIdToken(true);
      const o = await configsApi.create(token, {
        name,
        system: payload.system,
        rotations: payload.rotations,
      });
      const saved: SavedVisualizerConfig = {
        ...payload,
        name: o.name,
        id: o.id,
        createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
      };
      showToast("Configuration saved.", "success");
      setShowSaveModal(false);
      setNewName("");
      setSaveRotationsMulti([false, false, false, false, false, false]);
      onSaveSuccess?.();
      await savedData.fetchCustomConfigs();
      court.setCustomConfigKey(`custom:${saved.id}`);
      court.setSystem(newSystem);
      const firstSelected = selected[0] ?? 1;
      court.setRotation(firstSelected);
      court.setRotationData(rotationsToSave.map((r) => ({ players: JSON.parse(JSON.stringify(r.players)), annotations: JSON.parse(JSON.stringify(r.annotations)) })));
      court.setServeAnnotationsData(
        rotationsToSave.map((r) => JSON.parse(JSON.stringify(r.serveAnnotations ?? [])) as Annotation[])
      );
      const snap = rotationsToSave[firstSelected - 1];
      if (court.serveReceive) {
        court.setPlayers(JSON.parse(JSON.stringify(snap.players)) as Player[]);
        court.setAnnotations(JSON.parse(JSON.stringify(snap.annotations)) as Annotation[]);
      } else {
        court.setPlayers(JSON.parse(JSON.stringify(getRotationSet(newSystem)[firstSelected - 1])) as Player[]);
        court.setAnnotations(JSON.parse(JSON.stringify(snap.serveAnnotations ?? [])) as Annotation[]);
      }
    } catch (err: unknown) {
      console.error("Error saving config:", err);
      showToast(err instanceof Error ? err.message : "Failed to save configuration.", "error");
    }
  }, [
    user,
    showToast,
    newName,
    newSystem,
    saveRotationsMulti,
    court.serveReceive,
    court.rotationData,
    court.serveAnnotationsData,
    court.setServeAnnotationsData,
    court.setCustomConfigKey,
    court.setSystem,
    court.setRotation,
    court.setRotationData,
    court.setPlayers,
    court.setAnnotations,
    savedData.fetchCustomConfigs,
    onSaveSuccess,
  ]);

  return {
    showSaveModal,
    setShowSaveModal,
    newName,
    setNewName,
    newSystem,
    setNewSystem,
    newRotation,
    setNewRotation,
    saveRotationsMulti,
    setSaveRotationsMulti,
    handleSaveNewConfig,
    handleOverwriteCurrentConfig,
    handleDeleteConfig,
  };
}
