import { format } from "date-fns";

export interface SavedCountdownEvent {
  id: string;
  name: string;
  dateKey: string;
  createdAt: string;
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const SAVED_COUNTDOWNS_STORAGE_KEY = "temporal-saved-countdowns";
export const SAVED_COUNTDOWNS_UPDATED_EVENT = "temporal-saved-countdowns-updated";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function normalizeSavedCountdownName(name: string, fallbackName: string): string {
  const trimmedName = name.trim();
  return trimmedName || fallbackName;
}

export function createSavedCountdownEvent(
  name: string,
  date: Date,
  fallbackName: string,
  now = new Date()
): SavedCountdownEvent {
  return {
    id: createSavedCountdownId(now),
    name: normalizeSavedCountdownName(name, fallbackName),
    dateKey: toDateKey(date),
    createdAt: now.toISOString(),
  };
}

export function sortSavedCountdownEvents(events: SavedCountdownEvent[]): SavedCountdownEvent[] {
  return [...events].sort((left, right) => {
    const leftTime = fromDateKey(left.dateKey)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = fromDateKey(right.dateKey)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function findDuplicateSavedCountdownEvent(
  events: SavedCountdownEvent[],
  name: string,
  date: Date,
  fallbackName: string
) {
  const normalizedName = normalizeSavedCountdownName(name, fallbackName).toLocaleLowerCase();
  const dateKey = toDateKey(date);

  return events.find(
    (event) => event.dateKey === dateKey && event.name.trim().toLocaleLowerCase() === normalizedName
  );
}

export function sanitizeSavedCountdownEvents(input: unknown): SavedCountdownEvent[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return sortSavedCountdownEvents(
    input.filter(isSavedCountdownEvent).filter((event) => fromDateKey(event.dateKey) !== null)
  );
}

export function loadSavedCountdownEvents(storage?: StorageLike): SavedCountdownEvent[] {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(SAVED_COUNTDOWNS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return sanitizeSavedCountdownEvents(JSON.parse(rawValue));
  } catch (error) {
    console.error("Failed to load saved countdowns from localStorage", error);
    return [];
  }
}

export function persistSavedCountdownEvents(events: SavedCountdownEvent[], storage?: StorageLike) {
  if (!storage) {
    return;
  }

  storage.setItem(SAVED_COUNTDOWNS_STORAGE_KEY, JSON.stringify(sortSavedCountdownEvents(events)));
  notifySavedCountdownEventsUpdated();
}

export function subscribeToSavedCountdownEvents(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SAVED_COUNTDOWNS_STORAGE_KEY) {
      onChange();
    }
  };
  const handleLocalUpdate = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_COUNTDOWNS_UPDATED_EVENT, handleLocalUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_COUNTDOWNS_UPDATED_EVENT, handleLocalUpdate);
  };
}

function isSavedCountdownEvent(value: unknown): value is SavedCountdownEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedCountdownEvent>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.dateKey === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function createSavedCountdownId(now: Date): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${now.toISOString()}-${Math.random().toString(16).slice(2, 10)}`;
}

function notifySavedCountdownEventsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SAVED_COUNTDOWNS_UPDATED_EVENT));
}
