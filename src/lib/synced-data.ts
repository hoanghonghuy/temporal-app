import {
  sanitizeSavedCountdownEvents,
  sortSavedCountdownEvents,
  type SavedCountdownEvent,
} from "./saved-countdowns";
import {
  sanitizeSavedDayNotes,
  type SavedDayNote,
} from "./saved-day-notes";
import {
  sanitizeSavedFavoriteDays,
  type SavedFavoriteDay,
} from "./saved-favorite-days";

export interface SyncedDataSnapshot {
  savedCountdowns: SavedCountdownEvent[];
  savedDayNotes: SavedDayNote[];
  savedFavoriteDays: SavedFavoriteDay[];
}

export interface SyncedDataCounts {
  savedCountdowns: number;
  savedDayNotes: number;
  savedFavoriteDays: number;
}

function normalizeTimestamp(timestamp: string) {
  const parsedTime = Date.parse(timestamp);
  return Number.isNaN(parsedTime) ? Number.NEGATIVE_INFINITY : parsedTime;
}

function normalizeCountdownNameForMerge(name: string) {
  return name.trim().toLocaleLowerCase();
}

function preferLaterTimestamp<T>(
  currentItem: T,
  nextItem: T,
  getTimestamp: (item: T) => string
) {
  const currentTime = normalizeTimestamp(getTimestamp(currentItem));
  const nextTime = normalizeTimestamp(getTimestamp(nextItem));

  if (nextTime !== currentTime) {
    return nextTime > currentTime ? nextItem : currentItem;
  }

  return nextItem;
}

function mergeCountdowns(left: SavedCountdownEvent[], right: SavedCountdownEvent[]) {
  const mergedCountdownMap = new Map<string, SavedCountdownEvent>();

  [...sortSavedCountdownEvents(left), ...sortSavedCountdownEvents(right)].forEach((savedEvent) => {
    const mergeKey = `${savedEvent.dateKey}::${normalizeCountdownNameForMerge(savedEvent.name)}`;
    const currentEvent = mergedCountdownMap.get(mergeKey);

    if (!currentEvent) {
      mergedCountdownMap.set(mergeKey, savedEvent);
      return;
    }

    mergedCountdownMap.set(
      mergeKey,
      preferLaterTimestamp(currentEvent, savedEvent, (item) => item.createdAt)
    );
  });

  return sortSavedCountdownEvents([...mergedCountdownMap.values()]);
}

function mergeDayNotes(left: SavedDayNote[], right: SavedDayNote[]) {
  const mergedNotesMap = new Map<string, SavedDayNote>();

  [...sanitizeSavedDayNotes(left), ...sanitizeSavedDayNotes(right)].forEach((savedNote) => {
    const currentNote = mergedNotesMap.get(savedNote.dateKey);

    if (!currentNote) {
      mergedNotesMap.set(savedNote.dateKey, savedNote);
      return;
    }

    mergedNotesMap.set(
      savedNote.dateKey,
      preferLaterTimestamp(currentNote, savedNote, (item) => item.updatedAt)
    );
  });

  return sanitizeSavedDayNotes([...mergedNotesMap.values()]);
}

function mergeFavoriteDays(left: SavedFavoriteDay[], right: SavedFavoriteDay[]) {
  const mergedFavoriteDaysMap = new Map<string, SavedFavoriteDay>();

  [...sanitizeSavedFavoriteDays(left), ...sanitizeSavedFavoriteDays(right)].forEach((savedFavoriteDay) => {
    const currentFavoriteDay = mergedFavoriteDaysMap.get(savedFavoriteDay.dateKey);

    if (!currentFavoriteDay) {
      mergedFavoriteDaysMap.set(savedFavoriteDay.dateKey, savedFavoriteDay);
      return;
    }

    mergedFavoriteDaysMap.set(
      savedFavoriteDay.dateKey,
      preferLaterTimestamp(currentFavoriteDay, savedFavoriteDay, (item) => item.updatedAt)
    );
  });

  return sanitizeSavedFavoriteDays([...mergedFavoriteDaysMap.values()]);
}

export function normalizeSyncedDataSnapshot(snapshot: SyncedDataSnapshot): SyncedDataSnapshot {
  return {
    savedCountdowns: sanitizeSavedCountdownEvents(snapshot.savedCountdowns),
    savedDayNotes: sanitizeSavedDayNotes(snapshot.savedDayNotes),
    savedFavoriteDays: sanitizeSavedFavoriteDays(snapshot.savedFavoriteDays),
  };
}

export function getSyncedDataSnapshotCounts(snapshot: SyncedDataSnapshot): SyncedDataCounts {
  return {
    savedCountdowns: snapshot.savedCountdowns.length,
    savedDayNotes: snapshot.savedDayNotes.length,
    savedFavoriteDays: snapshot.savedFavoriteDays.length,
  };
}

export function hasSyncedData(snapshot: SyncedDataSnapshot) {
  const counts = getSyncedDataSnapshotCounts(snapshot);
  return counts.savedCountdowns + counts.savedDayNotes + counts.savedFavoriteDays > 0;
}

export function createSyncedDataSignature(snapshot: SyncedDataSnapshot) {
  const normalizedSnapshot = normalizeSyncedDataSnapshot(snapshot);

  return JSON.stringify({
    savedCountdowns: normalizedSnapshot.savedCountdowns.map((event) => ({
      name: normalizeCountdownNameForMerge(event.name),
      dateKey: event.dateKey,
    })),
    savedDayNotes: normalizedSnapshot.savedDayNotes.map((note) => ({
      dateKey: note.dateKey,
      note: note.note,
    })),
    savedFavoriteDays: normalizedSnapshot.savedFavoriteDays.map((day) => day.dateKey),
  });
}

export function mergeSyncedDataSnapshots(left: SyncedDataSnapshot, right: SyncedDataSnapshot): SyncedDataSnapshot {
  return {
    savedCountdowns: mergeCountdowns(left.savedCountdowns, right.savedCountdowns),
    savedDayNotes: mergeDayNotes(left.savedDayNotes, right.savedDayNotes),
    savedFavoriteDays: mergeFavoriteDays(left.savedFavoriteDays, right.savedFavoriteDays),
  };
}
