import { toDateKey } from "./saved-countdowns";

export interface SavedDayNote {
  dateKey: string;
  note: string;
  updatedAt: string;
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const SAVED_DAY_NOTES_STORAGE_KEY = "temporal-day-notes";
export const SAVED_DAY_NOTES_UPDATED_EVENT = "temporal-day-notes-updated";

export function loadSavedDayNotes(storage?: StorageLike): SavedDayNote[] {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(SAVED_DAY_NOTES_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return sanitizeSavedDayNotes(JSON.parse(rawValue));
  } catch (error) {
    console.error("Failed to load saved day notes from localStorage", error);
    return [];
  }
}

export function persistSavedDayNotes(notes: SavedDayNote[], storage?: StorageLike) {
  if (!storage) {
    return;
  }

  storage.setItem(SAVED_DAY_NOTES_STORAGE_KEY, JSON.stringify(sortSavedDayNotes(notes)));
  notifySavedDayNotesUpdated();
}

export function upsertSavedDayNote(notes: SavedDayNote[], date: Date, note: string, now = new Date()): SavedDayNote[] {
  const normalizedNote = note.trim();
  const nextNotes = notes.filter((savedNote) => savedNote.dateKey !== toDateKey(date));

  if (!normalizedNote) {
    return sortSavedDayNotes(nextNotes);
  }

  return sortSavedDayNotes([
    ...nextNotes,
    {
      dateKey: toDateKey(date),
      note: normalizedNote,
      updatedAt: now.toISOString(),
    },
  ]);
}

export function removeSavedDayNote(notes: SavedDayNote[], date: Date): SavedDayNote[] {
  return sortSavedDayNotes(notes.filter((savedNote) => savedNote.dateKey !== toDateKey(date)));
}

export function subscribeToSavedDayNotes(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SAVED_DAY_NOTES_STORAGE_KEY) {
      onChange();
    }
  };
  const handleLocalUpdate = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_DAY_NOTES_UPDATED_EVENT, handleLocalUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_DAY_NOTES_UPDATED_EVENT, handleLocalUpdate);
  };
}

export function sanitizeSavedDayNotes(input: unknown): SavedDayNote[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return sortSavedDayNotes(
    input
      .filter(isSavedDayNote)
      .map((savedNote) => ({
        ...savedNote,
        note: savedNote.note.trim(),
      }))
      .filter((savedNote) => savedNote.note.length > 0)
  );
}

function sortSavedDayNotes(notes: SavedDayNote[]) {
  return [...notes].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function isSavedDayNote(value: unknown): value is SavedDayNote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedDayNote>;

  return (
    typeof candidate.dateKey === "string" &&
    typeof candidate.note === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function notifySavedDayNotesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SAVED_DAY_NOTES_UPDATED_EVENT));
}
