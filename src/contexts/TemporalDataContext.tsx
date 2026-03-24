/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createSavedCountdownEvent,
  loadSavedCountdownEvents,
  persistSavedCountdownEvents,
  sanitizeSavedCountdownEvents,
  sortSavedCountdownEvents,
  subscribeToSavedCountdownEvents,
  toDateKey,
  updateSavedCountdownEvent,
  type SavedCountdownEvent,
} from "@/lib/saved-countdowns";
import {
  loadSavedDayNotes,
  persistSavedDayNotes,
  removeSavedDayNote,
  sanitizeSavedDayNotes,
  subscribeToSavedDayNotes,
  upsertSavedDayNote,
  type SavedDayNote,
} from "@/lib/saved-day-notes";
import {
  loadSavedFavoriteDays,
  persistSavedFavoriteDays,
  sanitizeSavedFavoriteDays,
  subscribeToSavedFavoriteDays,
  toggleSavedFavoriteDay,
  type SavedFavoriteDay,
} from "@/lib/saved-favorite-days";
import {
  createTemporalApiClient,
  getTemporalApiBaseUrl,
  type TemporalApiCountdownItem,
  type TemporalApiDayNoteItem,
  type TemporalApiFavoriteDayItem,
  type TemporalApiSession,
  type TemporalApiUser,
} from "@/lib/temporal-api";

type DataMode = "local" | "cloud";
type AuthStatus = "signed_out" | "authenticating" | "signed_in";
type SyncState = "idle" | "loading" | "syncing" | "error";

interface SyncedDataSnapshot {
  savedCountdowns: SavedCountdownEvent[];
  savedDayNotes: SavedDayNote[];
  savedFavoriteDays: SavedFavoriteDay[];
}

interface TemporalDataContextType extends SyncedDataSnapshot {
  apiConfigured: boolean;
  authStatus: AuthStatus;
  dataMode: DataMode;
  syncState: SyncState;
  sessionUser: TemporalApiUser | null;
  syncError: string | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; displayName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  reloadCloudData: () => Promise<void>;
  addSavedCountdown: (name: string, date: Date, fallbackName: string) => Promise<SavedCountdownEvent>;
  updateSavedCountdown: (eventId: string, name: string, date: Date, fallbackName: string) => Promise<SavedCountdownEvent>;
  deleteSavedCountdown: (eventId: string) => Promise<void>;
  saveDayNote: (date: Date, note: string) => Promise<SavedDayNote | null>;
  clearDayNote: (date: Date) => Promise<void>;
  toggleFavoriteDay: (date: Date) => Promise<boolean>;
  replaceSavedData: (snapshot: SyncedDataSnapshot) => Promise<void>;
}

interface StoredSession extends TemporalApiSession {}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const SESSION_STORAGE_KEY = "temporal-auth-session";

const TemporalDataContext = createContext<TemporalDataContextType | undefined>(undefined);

function loadLocalSnapshot(storage?: StorageLike): SyncedDataSnapshot {
  return {
    savedCountdowns: loadSavedCountdownEvents(storage),
    savedDayNotes: loadSavedDayNotes(storage),
    savedFavoriteDays: loadSavedFavoriteDays(storage),
  };
}

function persistLocalSnapshot(snapshot: SyncedDataSnapshot, storage?: StorageLike) {
  persistSavedCountdownEvents(snapshot.savedCountdowns, storage);
  persistSavedDayNotes(snapshot.savedDayNotes, storage);
  persistSavedFavoriteDays(snapshot.savedFavoriteDays, storage);
}

function parseStoredSession(storage?: StorageLike): StoredSession | null {
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredSession>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.accessExpiresAt !== "string" ||
      typeof parsed.accessExpiresIn !== "number" ||
      !parsed.user ||
      typeof parsed.user !== "object" ||
      typeof parsed.user.id !== "string" ||
      typeof parsed.user.email !== "string" ||
      typeof parsed.user.createdAt !== "string" ||
      typeof parsed.user.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : "Bearer",
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accessExpiresAt: parsed.accessExpiresAt,
      accessExpiresIn: parsed.accessExpiresIn,
      user: {
        id: parsed.user.id,
        email: parsed.user.email,
        displayName: typeof parsed.user.displayName === "string" ? parsed.user.displayName : undefined,
        createdAt: parsed.user.createdAt,
        updatedAt: parsed.user.updatedAt,
      },
    };
  } catch {
    return null;
  }
}

function persistStoredSession(session: StoredSession | null, storage?: StorageLike) {
  if (!storage) {
    return;
  }

  if (!session) {
    storage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function normalizeRemoteCountdownItem(item: TemporalApiCountdownItem): SavedCountdownEvent {
  return {
    id: item.id,
    name: item.name,
    dateKey: item.dateKey,
    createdAt: item.createdAt,
  };
}

function normalizeRemoteDayNoteItem(item: TemporalApiDayNoteItem): SavedDayNote {
  return {
    dateKey: item.dateKey,
    note: item.note,
    updatedAt: item.updatedAt,
  };
}

function normalizeRemoteFavoriteDayItem(item: TemporalApiFavoriteDayItem): SavedFavoriteDay {
  return {
    dateKey: item.dateKey,
    updatedAt: item.updatedAt,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unable to complete this action right now.";
}

export function TemporalDataProvider({ children }: { children: React.ReactNode }) {
  const apiBaseUrl = useMemo(() => getTemporalApiBaseUrl(), []);
  const apiClient = useMemo(() => (apiBaseUrl ? createTemporalApiClient(apiBaseUrl) : null), [apiBaseUrl]);
  const [savedCountdowns, setSavedCountdowns] = useState<SavedCountdownEvent[]>([]);
  const [savedDayNotes, setSavedDayNotes] = useState<SavedDayNote[]>([]);
  const [savedFavoriteDays, setSavedFavoriteDays] = useState<SavedFavoriteDay[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("signed_out");
  const [dataMode, setDataMode] = useState<DataMode>("local");
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const applySnapshotToState = (snapshot: SyncedDataSnapshot) => {
    setSavedCountdowns(sortSavedCountdownEvents(snapshot.savedCountdowns));
    setSavedDayNotes(sanitizeSavedDayNotes(snapshot.savedDayNotes));
    setSavedFavoriteDays(sanitizeSavedFavoriteDays(snapshot.savedFavoriteDays));
  };

  const loadRemoteSnapshot = async (accessToken: string) => {
    if (!apiClient) {
      throw new Error("API client is not configured.");
    }

    const [countdownsResponse, dayNotesResponse, favoriteDaysResponse] = await Promise.all([
      apiClient.listCountdowns(accessToken),
      apiClient.listDayNotes(accessToken),
      apiClient.listFavoriteDays(accessToken),
    ]);

    return {
      savedCountdowns: sanitizeSavedCountdownEvents(countdownsResponse.items.map(normalizeRemoteCountdownItem)),
      savedDayNotes: sanitizeSavedDayNotes(dayNotesResponse.items.map(normalizeRemoteDayNoteItem)),
      savedFavoriteDays: sanitizeSavedFavoriteDays(favoriteDaysResponse.items.map(normalizeRemoteFavoriteDayItem)),
    };
  };

  const syncSessionState = (nextSession: StoredSession | null) => {
    setSession(nextSession);
    if (typeof window !== "undefined") {
      persistStoredSession(nextSession, window.localStorage);
    }
  };

  const restoreLocalState = () => {
    const localSnapshot = loadLocalSnapshot(typeof window === "undefined" ? undefined : window.localStorage);
    applySnapshotToState(localSnapshot);
    setDataMode("local");
    setAuthStatus("signed_out");
  };

  const refreshAccessSession = async (currentSession: StoredSession) => {
    if (!apiClient) {
      throw new Error("API client is not configured.");
    }

    const refreshedSession = await apiClient.refresh(currentSession.refreshToken);
    syncSessionState(refreshedSession);
    setSession(refreshedSession);
    return refreshedSession;
  };

  const ensureAccessSession = async () => {
    if (!session) {
      throw new Error("Missing session.");
    }

    const expiresAt = Date.parse(session.accessExpiresAt);
    if (!Number.isNaN(expiresAt) && expiresAt > Date.now() + 30_000) {
      return session;
    }

    return refreshAccessSession(session);
  };

  const withCloudSession = async <T,>(task: (activeSession: StoredSession) => Promise<T>) => {
    if (!apiClient) {
      throw new Error("API client is not configured.");
    }

    let activeSession = await ensureAccessSession();

    try {
      return await task(activeSession);
    } catch (error) {
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 401) {
        activeSession = await refreshAccessSession(activeSession);
        return task(activeSession);
      }

      throw error;
    }
  };

  useEffect(() => {
    const storage = typeof window === "undefined" ? undefined : window.localStorage;
    const localSnapshot = loadLocalSnapshot(storage);
    applySnapshotToState(localSnapshot);
    setDataMode("local");
    setSyncState("idle");

    if (!apiClient) {
      return;
    }

    const storedSession = parseStoredSession(storage);
    if (!storedSession) {
      return;
    }

    let isCancelled = false;

    const restoreCloudSession = async () => {
      setAuthStatus("authenticating");
      setSyncState("loading");
      setSyncError(null);

      try {
        const activeSession =
          Date.parse(storedSession.accessExpiresAt) > Date.now() + 30_000 ? storedSession : await apiClient.refresh(storedSession.refreshToken);
        if (isCancelled) {
          return;
        }

        syncSessionState(activeSession);
        const remoteSnapshot = await loadRemoteSnapshot(activeSession.accessToken);
        if (isCancelled) {
          return;
        }

        setSession(activeSession);
        applySnapshotToState(remoteSnapshot);
        setAuthStatus("signed_in");
        setDataMode("cloud");
        setSyncState("idle");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        syncSessionState(null);
        setSession(null);
        setSyncError(getErrorMessage(error));
        restoreLocalState();
        setSyncState("error");
      }
    };

    void restoreCloudSession();

    return () => {
      isCancelled = true;
    };
  }, [apiClient]);

  useEffect(() => {
    if (dataMode !== "local") {
      return;
    }

    const loadSnapshot = () => {
      const snapshot = loadLocalSnapshot(typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(snapshot);
    };

    loadSnapshot();

    const unsubscribeCountdowns = subscribeToSavedCountdownEvents(loadSnapshot);
    const unsubscribeDayNotes = subscribeToSavedDayNotes(loadSnapshot);
    const unsubscribeFavoriteDays = subscribeToSavedFavoriteDays(loadSnapshot);

    return () => {
      unsubscribeCountdowns();
      unsubscribeDayNotes();
      unsubscribeFavoriteDays();
    };
  }, [dataMode]);

  const signIn = async (input: { email: string; password: string }) => {
    if (!apiClient) {
      throw new Error("API client is not configured.");
    }

    setAuthStatus("authenticating");
    setSyncState("loading");
    setSyncError(null);

    try {
      const nextSession = await apiClient.login(input);
      syncSessionState(nextSession);
      const remoteSnapshot = await loadRemoteSnapshot(nextSession.accessToken);
      setSession(nextSession);
      applySnapshotToState(remoteSnapshot);
      setDataMode("cloud");
      setAuthStatus("signed_in");
      setSyncState("idle");
    } catch (error) {
      restoreLocalState();
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const register = async (input: { email: string; password: string; displayName?: string }) => {
    if (!apiClient) {
      throw new Error("API client is not configured.");
    }

    setAuthStatus("authenticating");
    setSyncState("loading");
    setSyncError(null);

    try {
      const nextSession = await apiClient.register(input);
      syncSessionState(nextSession);
      const remoteSnapshot = await loadRemoteSnapshot(nextSession.accessToken);
      setSession(nextSession);
      applySnapshotToState(remoteSnapshot);
      setDataMode("cloud");
      setAuthStatus("signed_in");
      setSyncState("idle");
    } catch (error) {
      restoreLocalState();
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const signOut = async () => {
    const currentSession = session;

    setSyncState("syncing");
    setSyncError(null);

    try {
      if (apiClient && currentSession) {
        await apiClient.logout(currentSession.refreshToken);
      }
    } catch {
      // We still want to sign out locally even if the server call fails.
    } finally {
      syncSessionState(null);
      setSession(null);
      restoreLocalState();
      setSyncState("idle");
    }
  };

  const reloadCloudData = async () => {
    if (dataMode !== "cloud") {
      return;
    }

    setSyncState("syncing");
    setSyncError(null);

    try {
      const remoteSnapshot = await withCloudSession((activeSession) => loadRemoteSnapshot(activeSession.accessToken));
      applySnapshotToState(remoteSnapshot);
      setSyncState("idle");
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const addSavedCountdown = async (name: string, date: Date, fallbackName: string) => {
    if (dataMode === "local") {
      const nextEvent = createSavedCountdownEvent(name, date, fallbackName);
      const nextSnapshot = {
        savedCountdowns: [...savedCountdowns, nextEvent],
        savedDayNotes,
        savedFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return nextEvent;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      const createdEvent = await withCloudSession((activeSession) =>
        apiClient!.createCountdown(activeSession.accessToken, {
          name: name.trim() || fallbackName,
          dateKey: toDateKey(date),
        })
      );

      const nextEvent = normalizeRemoteCountdownItem(createdEvent);
      setSavedCountdowns((currentEvents) => sortSavedCountdownEvents([...currentEvents, nextEvent]));
      setSyncState("idle");
      return nextEvent;
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const updateSavedCountdown = async (eventId: string, name: string, date: Date, fallbackName: string) => {
    if (dataMode === "local") {
      const nextEvents = updateSavedCountdownEvent(savedCountdowns, eventId, name, date, fallbackName);
      const nextSnapshot = {
        savedCountdowns: nextEvents,
        savedDayNotes,
        savedFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return nextEvents.find((event) => event.id === eventId) ?? createSavedCountdownEvent(name, date, fallbackName);
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      const updatedEvent = await withCloudSession((activeSession) =>
        apiClient!.updateCountdown(activeSession.accessToken, eventId, {
          name: name.trim() || fallbackName,
          dateKey: toDateKey(date),
        })
      );

      const nextEvent = normalizeRemoteCountdownItem(updatedEvent);
      setSavedCountdowns((currentEvents) =>
        sortSavedCountdownEvents(
          currentEvents.map((event) => (event.id === eventId ? nextEvent : event))
        )
      );
      setSyncState("idle");
      return nextEvent;
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const deleteSavedCountdown = async (eventId: string) => {
    if (dataMode === "local") {
      const nextSnapshot = {
        savedCountdowns: savedCountdowns.filter((event) => event.id !== eventId),
        savedDayNotes,
        savedFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      await withCloudSession((activeSession) => apiClient!.deleteCountdown(activeSession.accessToken, eventId));
      setSavedCountdowns((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
      setSyncState("idle");
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const saveDayNote = async (date: Date, note: string) => {
    if (dataMode === "local") {
      const nextNotes = upsertSavedDayNote(savedDayNotes, date, note);
      const nextSnapshot = {
        savedCountdowns,
        savedDayNotes: nextNotes,
        savedFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return nextNotes.find((savedNote) => savedNote.dateKey === toDateKey(date)) ?? null;
    }

    if (note.trim().length === 0) {
      await clearDayNote(date);
      return null;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      const nextNote = await withCloudSession((activeSession) =>
        apiClient!.putDayNote(activeSession.accessToken, toDateKey(date), note.trim())
      );

      const normalizedNote = normalizeRemoteDayNoteItem(nextNote);
      setSavedDayNotes((currentNotes) =>
        sanitizeSavedDayNotes([
          ...currentNotes.filter((savedNote) => savedNote.dateKey !== normalizedNote.dateKey),
          normalizedNote,
        ])
      );
      setSyncState("idle");
      return normalizedNote;
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const clearDayNote = async (date: Date) => {
    if (dataMode === "local") {
      const nextNotes = removeSavedDayNote(savedDayNotes, date);
      const nextSnapshot = {
        savedCountdowns,
        savedDayNotes: nextNotes,
        savedFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      await withCloudSession((activeSession) => apiClient!.deleteDayNote(activeSession.accessToken, toDateKey(date)));
      setSavedDayNotes((currentNotes) => currentNotes.filter((savedNote) => savedNote.dateKey !== toDateKey(date)));
      setSyncState("idle");
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const toggleFavoriteDay = async (date: Date) => {
    const dateKey = toDateKey(date);

    if (dataMode === "local") {
      const nextFavoriteDays = toggleSavedFavoriteDay(savedFavoriteDays, date);
      const isFavorite = nextFavoriteDays.some((savedDay) => savedDay.dateKey === dateKey);
      const nextSnapshot = {
        savedCountdowns,
        savedDayNotes,
        savedFavoriteDays: nextFavoriteDays,
      };

      persistLocalSnapshot(nextSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(nextSnapshot);
      return isFavorite;
    }

    const isFavoriteNow = savedFavoriteDays.some((savedDay) => savedDay.dateKey === dateKey);

    setSyncState("syncing");
    setSyncError(null);
    try {
      if (isFavoriteNow) {
        await withCloudSession((activeSession) => apiClient!.deleteFavoriteDay(activeSession.accessToken, dateKey));
        setSavedFavoriteDays((currentDays) => currentDays.filter((savedDay) => savedDay.dateKey !== dateKey));
        setSyncState("idle");
        return false;
      }

      const nextFavoriteDay = await withCloudSession((activeSession) =>
        apiClient!.putFavoriteDay(activeSession.accessToken, dateKey)
      );
      const normalizedFavoriteDay = normalizeRemoteFavoriteDayItem(nextFavoriteDay);
      setSavedFavoriteDays((currentDays) =>
        sanitizeSavedFavoriteDays([
          ...currentDays.filter((savedDay) => savedDay.dateKey !== normalizedFavoriteDay.dateKey),
          normalizedFavoriteDay,
        ])
      );
      setSyncState("idle");
      return true;
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const replaceSavedData = async (snapshot: SyncedDataSnapshot) => {
    const normalizedSnapshot = {
      savedCountdowns: sanitizeSavedCountdownEvents(snapshot.savedCountdowns),
      savedDayNotes: sanitizeSavedDayNotes(snapshot.savedDayNotes),
      savedFavoriteDays: sanitizeSavedFavoriteDays(snapshot.savedFavoriteDays),
    };

    if (dataMode === "local") {
      persistLocalSnapshot(normalizedSnapshot, typeof window === "undefined" ? undefined : window.localStorage);
      applySnapshotToState(normalizedSnapshot);
      return;
    }

    setSyncState("syncing");
    setSyncError(null);
    try {
      await withCloudSession(async (activeSession) => {
        const currentSnapshot = await loadRemoteSnapshot(activeSession.accessToken);

        for (const countdown of currentSnapshot.savedCountdowns) {
          await apiClient!.deleteCountdown(activeSession.accessToken, countdown.id);
        }
        for (const countdown of normalizedSnapshot.savedCountdowns) {
          await apiClient!.createCountdown(activeSession.accessToken, {
            name: countdown.name,
            dateKey: countdown.dateKey,
          });
        }

        for (const note of currentSnapshot.savedDayNotes) {
          await apiClient!.deleteDayNote(activeSession.accessToken, note.dateKey);
        }
        for (const note of normalizedSnapshot.savedDayNotes) {
          await apiClient!.putDayNote(activeSession.accessToken, note.dateKey, note.note);
        }

        for (const favoriteDay of currentSnapshot.savedFavoriteDays) {
          await apiClient!.deleteFavoriteDay(activeSession.accessToken, favoriteDay.dateKey);
        }
        for (const favoriteDay of normalizedSnapshot.savedFavoriteDays) {
          await apiClient!.putFavoriteDay(activeSession.accessToken, favoriteDay.dateKey);
        }
      });

      const remoteSnapshot = await withCloudSession((activeSession) => loadRemoteSnapshot(activeSession.accessToken));
      applySnapshotToState(remoteSnapshot);
      setSyncState("idle");
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setSyncState("error");
      throw error;
    }
  };

  const value = useMemo<TemporalDataContextType>(
    () => ({
      apiConfigured: !!apiClient,
      authStatus,
      dataMode,
      syncState,
      sessionUser: session?.user ?? null,
      syncError,
      savedCountdowns,
      savedDayNotes,
      savedFavoriteDays,
      signIn,
      register,
      signOut,
      reloadCloudData,
      addSavedCountdown,
      updateSavedCountdown,
      deleteSavedCountdown,
      saveDayNote,
      clearDayNote,
      toggleFavoriteDay,
      replaceSavedData,
    }),
    [
      apiClient,
      authStatus,
      dataMode,
      savedCountdowns,
      savedDayNotes,
      savedFavoriteDays,
      session?.user,
      syncError,
      syncState,
    ]
  );

  return <TemporalDataContext.Provider value={value}>{children}</TemporalDataContext.Provider>;
}

export function useTemporalData() {
  const context = useContext(TemporalDataContext);
  if (!context) {
    throw new Error("useTemporalData must be used within a TemporalDataProvider");
  }

  return context;
}
