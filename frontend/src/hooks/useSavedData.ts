import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebaseConfig";
import { fetchSavedLineups as fetchSavedLineupsFromApi, fetchSavedVisualizerConfigs } from "../api/client";
import type { SavedVisualizerConfig } from "../types/savedConfig";
import type { SavedLineupItem } from "../components/StartingLineup";

type ToastType = "success" | "error" | "info";

export function useSavedData(
  user: { uid: string; isAnonymous?: boolean; email?: string | null } | null,
  options?: { showToast: (message: string, type?: ToastType) => void }
) {
  const showToast = options?.showToast ?? ((msg: string) => alert(msg));

  const [savedLineups, setSavedLineups] = useState<SavedLineupItem[]>([]);
  const [customConfigs, setCustomConfigs] = useState<SavedVisualizerConfig[]>([]);
  const [selectedLineupId, setSelectedLineupId] = useState<string | null>(null);

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

  const userKey = user ? `${user.uid}-${user.isAnonymous}-${user.email ?? ""}` : "";
  useEffect(() => {
    if (!user) {
      setCustomConfigs([]);
      setSavedLineups([]);
      setSelectedLineupId(null);
      return;
    }
    if (user.isAnonymous) {
      setCustomConfigs([]);
      setSavedLineups([]);
      setSelectedLineupId(null);
      return;
    }
    const loadFromApi = async () => {
      const u = auth.currentUser;
      if (!u || u.isAnonymous) return;
      try {
        const token = await u.getIdToken(true);
        const [configs, list] = await Promise.all([
          fetchSavedVisualizerConfigs(token),
          fetchSavedLineupsFromApi(token),
        ]);
        setCustomConfigs(configs);
        setSavedLineups(list);
        setSelectedLineupId((prev) => (prev && list.some((l) => l.id === prev)) ? prev : null);
      } catch (err) {
        setCustomConfigs([]);
        setSavedLineups([]);
        const msg = err instanceof Error ? err.message : "Could not load saved data.";
        if (!msg.includes("VITE_API_URL") && !msg.includes("Railway")) {
          showToast(msg, "error");
        } else {
          showToast("Backend not configured. " + msg, "error");
        }
      }
    };
    loadFromApi();
  }, [user, userKey, showToast]);

  return {
    savedLineups,
    setSavedLineups,
    customConfigs,
    setCustomConfigs,
    selectedLineupId,
    setSelectedLineupId,
    fetchSavedLineups,
    fetchCustomConfigs,
  };
}
