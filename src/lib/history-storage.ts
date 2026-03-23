export interface HistoryItem {
  id: string;
  type: string;
  result: string;
  timestamp: string;
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const HISTORY_STORAGE_KEY = "temporal-history";
export const HISTORY_UPDATED_EVENT = "temporal-history-updated";
export const HISTORY_LIMIT = 20;

export function loadHistoryItems(storage?: StorageLike): HistoryItem[] {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(HISTORY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return sanitizeHistoryItems(JSON.parse(rawValue));
  } catch (error) {
    console.error("Failed to load history from localStorage", error);
    return [];
  }
}

export function persistHistoryItems(history: HistoryItem[], storage?: StorageLike) {
  if (!storage) {
    return;
  }

  const sanitizedHistory = sanitizeHistoryItems(history);

  if (sanitizedHistory.length === 0) {
    storage.removeItem(HISTORY_STORAGE_KEY);
  } else {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sanitizedHistory));
  }

  notifyHistoryItemsUpdated();
}

export function appendHistoryItem(history: HistoryItem[], item: HistoryItem) {
  return sanitizeHistoryItems([item, ...history]);
}

export function clearHistoryItems(storage?: StorageLike) {
  if (!storage) {
    return;
  }

  storage.removeItem(HISTORY_STORAGE_KEY);
  notifyHistoryItemsUpdated();
}

export function sanitizeHistoryItems(input: unknown): HistoryItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter(isHistoryItem).slice(0, HISTORY_LIMIT);
}

export function subscribeToHistoryItems(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === HISTORY_STORAGE_KEY) {
      onChange();
    }
  };
  const handleLocalUpdate = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(HISTORY_UPDATED_EVENT, handleLocalUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(HISTORY_UPDATED_EVENT, handleLocalUpdate);
  };
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HistoryItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.result === "string" &&
    typeof candidate.timestamp === "string"
  );
}

function notifyHistoryItemsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT));
}
