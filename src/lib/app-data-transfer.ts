import {
  loadHistoryItems,
  persistHistoryItems,
  sanitizeHistoryItems,
  type HistoryItem,
} from "./history-storage";
import {
  loadSavedCountdownEvents,
  persistSavedCountdownEvents,
  sanitizeSavedCountdownEvents,
  type SavedCountdownEvent,
} from "./saved-countdowns";
import {
  loadSavedDayNotes,
  persistSavedDayNotes,
  sanitizeSavedDayNotes,
  type SavedDayNote,
} from "./saved-day-notes";
import {
  loadSavedFavoriteDays,
  persistSavedFavoriteDays,
  sanitizeSavedFavoriteDays,
  type SavedFavoriteDay,
} from "./saved-favorite-days";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface TemporalDataBundle {
  app: "temporal";
  version: 1;
  exportedAt: string;
  data: {
    history: HistoryItem[];
    savedCountdowns: SavedCountdownEvent[];
    savedDayNotes: SavedDayNote[];
    savedFavoriteDays: SavedFavoriteDay[];
  };
}

export interface TemporalDataSnapshot {
  history: HistoryItem[];
  savedCountdowns: SavedCountdownEvent[];
  savedDayNotes: SavedDayNote[];
  savedFavoriteDays: SavedFavoriteDay[];
}

export function createTemporalDataBundle(storage?: StorageLike, exportedAt = new Date()): TemporalDataBundle {
  return createTemporalDataBundleFromSnapshot(
    {
      history: loadHistoryItems(storage),
      savedCountdowns: loadSavedCountdownEvents(storage),
      savedDayNotes: loadSavedDayNotes(storage),
      savedFavoriteDays: loadSavedFavoriteDays(storage),
    },
    exportedAt
  );
}

export function createTemporalDataBundleFromSnapshot(snapshot: TemporalDataSnapshot, exportedAt = new Date()): TemporalDataBundle {
  return {
    app: "temporal",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    data: {
      history: sanitizeHistoryItems(snapshot.history),
      savedCountdowns: sanitizeSavedCountdownEvents(snapshot.savedCountdowns),
      savedDayNotes: sanitizeSavedDayNotes(snapshot.savedDayNotes),
      savedFavoriteDays: sanitizeSavedFavoriteDays(snapshot.savedFavoriteDays),
    },
  };
}

export function parseTemporalDataBundle(input: unknown): TemporalDataBundle | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<TemporalDataBundle>;

  if (candidate.app !== "temporal" || candidate.version !== 1 || typeof candidate.exportedAt !== "string") {
    return null;
  }

  const data = candidate.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  return {
    app: "temporal",
    version: 1,
    exportedAt: candidate.exportedAt,
    data: {
      history: sanitizeHistoryItems((data as Partial<TemporalDataBundle["data"]>).history),
      savedCountdowns: sanitizeSavedCountdownEvents((data as Partial<TemporalDataBundle["data"]>).savedCountdowns),
      savedDayNotes: sanitizeSavedDayNotes((data as Partial<TemporalDataBundle["data"]>).savedDayNotes),
      savedFavoriteDays: sanitizeSavedFavoriteDays((data as Partial<TemporalDataBundle["data"]>).savedFavoriteDays),
    },
  };
}

export function applyTemporalDataBundle(bundle: TemporalDataBundle, storage?: StorageLike) {
  if (!storage) {
    return;
  }

  persistHistoryItems(bundle.data.history, storage);
  persistSavedCountdownEvents(bundle.data.savedCountdowns, storage);
  persistSavedDayNotes(bundle.data.savedDayNotes, storage);
  persistSavedFavoriteDays(bundle.data.savedFavoriteDays, storage);
}

export function getTemporalDataBundleCounts(bundle: TemporalDataBundle) {
  return {
    history: bundle.data.history.length,
    savedCountdowns: bundle.data.savedCountdowns.length,
    savedDayNotes: bundle.data.savedDayNotes.length,
    savedFavoriteDays: bundle.data.savedFavoriteDays.length,
  };
}

export function getTemporalDataFilename(bundle: TemporalDataBundle) {
  return `temporal-data-${bundle.exportedAt.replace(/[:]/g, "-").replace(/\.\d+Z$/, "Z")}.json`;
}
