/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import {
  appendHistoryItem,
  clearHistoryItems,
  loadHistoryItems,
  persistHistoryItems,
  subscribeToHistoryItems,
  type HistoryItem,
} from "@/lib/history-storage";

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (type: string, result: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { localeTag } = useI18n();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const loadItems = () =>
      setHistory(loadHistoryItems(typeof window === "undefined" ? undefined : window.localStorage));

    loadItems();
    return subscribeToHistoryItems(loadItems);
  }, []);

  const addToHistory = (type: string, result: string) => {
    const newItem: HistoryItem = {
      id: new Date().toISOString(),
      type,
      result,
      timestamp: new Date().toLocaleString(localeTag),
    };
    const newHistory = appendHistoryItem(history, newItem);
    setHistory(newHistory);
    if (typeof window !== "undefined") {
      persistHistoryItems(newHistory, window.localStorage);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      clearHistoryItems(window.localStorage);
    }
  };

  return <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>{children}</HistoryContext.Provider>;
}

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
