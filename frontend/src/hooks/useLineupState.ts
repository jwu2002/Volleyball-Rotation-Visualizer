import { useState, useCallback, useEffect } from "react";
import type { Lineup, LineupEntry, LineupPositionId } from "../components/StartingLineup";
import { auth } from "../firebaseConfig";
import { lineupsApi } from "../api/client";
import { loadLineupFromStorage } from "../utils/lineupHelpers";
import { sanitizeName } from "../utils/nameSanitize";

type ToastType = "success" | "error" | "info";
type SavedLineupItem = { id: string; name: string; lineup: Lineup; showNumber: boolean; showName: boolean };

export function useLineupState(
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null,
  savedData: {
    savedLineups: SavedLineupItem[];
    selectedLineupId: string | null;
    setSelectedLineupId: (id: string | null) => void;
    fetchSavedLineups: () => Promise<void>;
  },
  showToast: (message: string, type?: ToastType) => void,
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void
) {
  const { savedLineups, selectedLineupId, setSelectedLineupId, fetchSavedLineups } = savedData;
  const stored = loadLineupFromStorage();
  const [lineup, setLineup] = useState<Lineup>(() => stored.lineup);
  const [lineupShowNumber, setLineupShowNumber] = useState(stored.showNumber);
  const [lineupShowName, setLineupShowName] = useState(stored.showName);
  const [showSaveLineupModal, setShowSaveLineupModal] = useState(false);
  const [saveLineupName, setSaveLineupName] = useState("");
  const [lineupExplorerOpen, setLineupExplorerOpen] = useState(false);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setLineup({});
    }
  }, [user]);

  const handleLineupChange = useCallback((position: LineupPositionId, entry: LineupEntry) => {
    setLineup((prev) => ({ ...prev, [position]: entry }));
  }, []);

  const handleSelectLineup = useCallback((id: string | null) => {
    setSelectedLineupId(id);
    if (!id) {
      setLineup({});
      return;
    }
    const saved = savedLineups.find((l) => l.id === id);
    if (saved) {
      setLineup(saved.lineup);
      setLineupShowNumber(saved.showNumber);
      setLineupShowName(saved.showName);
    }
  }, [savedLineups, setSelectedLineupId]);

  const handleSaveLineupAsClick = useCallback(() => {
    if (!user) {
      showToast("Sign in to save lineups.", "info");
      return;
    }
    if (user.isAnonymous) {
      showToast("Sign in with an account (not guest) to save lineups.", "info");
      return;
    }
    setSaveLineupName("");
    setShowSaveLineupModal(true);
  }, [user, showToast]);

  const handleSaveLineupClick = useCallback(() => {
    if (!user) {
      showToast("Sign in to save lineups.", "info");
      return;
    }
    if (user.isAnonymous) {
      showToast("Sign in with an account (not guest) to save lineups.", "info");
      return;
    }
    if (!selectedLineupId) {
      showToast("Select a lineup to save.", "info");
      return;
    }
    const item = savedLineups.find((l) => l.id === selectedLineupId);
    const name = item?.name ?? "this lineup";
    showConfirm("Save lineup", `Save changes to ${name}?`, async () => {
      const u = auth.currentUser;
      if (!u) return;
      try {
        const token = await u.getIdToken(true);
        await lineupsApi.update(token, selectedLineupId!, {
          name: item!.name,
          lineup,
          showNumber: lineupShowNumber,
          showName: lineupShowName,
        });
        await fetchSavedLineups();
        showToast("Lineup saved.", "success");
      } catch (err) {
        console.error("Save lineup error:", err);
        showToast(err instanceof Error ? err.message : "Failed to save lineup.", "error");
      }
    });
  }, [user, selectedLineupId, savedLineups, lineup, lineupShowNumber, lineupShowName, fetchSavedLineups, showToast, showConfirm]);

  const handleSaveLineupSubmit = useCallback(async () => {
    const u = auth.currentUser;
    if (!u || !user) return;
    if (user.isAnonymous) {
      showToast("Sign in to save lineups.", "info");
      return;
    }
    const name = sanitizeName(saveLineupName.trim() || "Unnamed lineup");
    try {
      const token = await u.getIdToken(true);
      const saved = await lineupsApi.create(token, {
        name,
        lineup,
        showNumber: lineupShowNumber,
        showName: lineupShowName,
      });
      setSelectedLineupId(saved.id);
      await fetchSavedLineups();
      setShowSaveLineupModal(false);
      setSaveLineupName("");
      showToast("Lineup saved.", "success");
    } catch (err) {
      console.error("Save lineup error:", err);
      const msg = err instanceof Error ? err.message : "Failed to save lineup.";
      showToast(msg, "error");
    }
  }, [user, saveLineupName, lineup, lineupShowNumber, lineupShowName, fetchSavedLineups, setSelectedLineupId, showToast]);

  const handleDeleteLineup = useCallback(
    (id: string) => {
      const item = savedLineups.find((l) => l.id === id);
      if (!item) return;
      if (!user) return;
      showConfirm("Delete lineup", `Delete "${item.name}"? This cannot be undone.`, async () => {
        const u = auth.currentUser;
        if (!u) return;
        try {
          const token = await u.getIdToken(true);
          await lineupsApi.delete(token, id);
          if (selectedLineupId === id) {
            setSelectedLineupId(null);
          }
          await fetchSavedLineups();
          showToast("Lineup deleted.", "success");
        } catch {
          showToast("Failed to delete lineup.", "error");
        }
      });
    },
    [savedLineups, user, selectedLineupId, setSelectedLineupId, fetchSavedLineups, showToast, showConfirm]
  );

  return {
    lineup,
    setLineup,
    lineupShowNumber,
    setLineupShowNumber,
    lineupShowName,
    setLineupShowName,
    showSaveLineupModal,
    setShowSaveLineupModal,
    saveLineupName,
    setSaveLineupName,
    lineupExplorerOpen,
    setLineupExplorerOpen,
    handleLineupChange,
    handleSelectLineup,
    handleSaveLineupAsClick,
    handleSaveLineupClick,
    handleSaveLineupSubmit,
    handleDeleteLineup,
  };
}
