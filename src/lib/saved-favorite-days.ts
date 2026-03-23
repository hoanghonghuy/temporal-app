import { toDateKey } from "./saved-countdowns";

export interface SavedFavoriteDay {
  dateKey: string;
  updatedAt: string;
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const SAVED_FAVORITE_DAYS_STORAGE_KEY = "temporal-favorite-days";
export const SAVED_FAVORITE_DAYS_UPDATED_EVENT = "temporal-favorite-days-updated";

export function loadSavedFavoriteDays(storage?: StorageLike): SavedFavoriteDay[] {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(SAVED_FAVORITE_DAYS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return sanitizeSavedFavoriteDays(JSON.parse(rawValue));
  } catch (error) {
    console.error("Failed to load saved favorite days from localStorage", error);
    return [];
  }
}

export function persistSavedFavoriteDays(days: SavedFavoriteDay[], storage?: StorageLike) {
  if (!storage) {
    return;
  }

  storage.setItem(SAVED_FAVORITE_DAYS_STORAGE_KEY, JSON.stringify(sortSavedFavoriteDays(days)));
  notifySavedFavoriteDaysUpdated();
}

export function toggleSavedFavoriteDay(days: SavedFavoriteDay[], date: Date, now = new Date()): SavedFavoriteDay[] {
  const dateKey = toDateKey(date);
  const existing = days.some((savedDay) => savedDay.dateKey === dateKey);

  if (existing) {
    return sortSavedFavoriteDays(days.filter((savedDay) => savedDay.dateKey !== dateKey));
  }

  return sortSavedFavoriteDays([
    ...days,
    {
      dateKey,
      updatedAt: now.toISOString(),
    },
  ]);
}

export function subscribeToSavedFavoriteDays(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SAVED_FAVORITE_DAYS_STORAGE_KEY) {
      onChange();
    }
  };
  const handleLocalUpdate = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_FAVORITE_DAYS_UPDATED_EVENT, handleLocalUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_FAVORITE_DAYS_UPDATED_EVENT, handleLocalUpdate);
  };
}

export function sanitizeSavedFavoriteDays(input: unknown): SavedFavoriteDay[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return sortSavedFavoriteDays(input.filter(isSavedFavoriteDay));
}

function sortSavedFavoriteDays(days: SavedFavoriteDay[]) {
  return [...days].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function isSavedFavoriteDay(value: unknown): value is SavedFavoriteDay {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedFavoriteDay>;

  return typeof candidate.dateKey === "string" && typeof candidate.updatedAt === "string";
}

function notifySavedFavoriteDaysUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SAVED_FAVORITE_DAYS_UPDATED_EVENT));
}
