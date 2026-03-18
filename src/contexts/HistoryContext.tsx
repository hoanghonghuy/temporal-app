/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

interface HistoryItem {
  id: string;
  type: string;
  result: string;
  timestamp: string;
}

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
    try {
      const savedHistory = localStorage.getItem("temporal-history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  const addToHistory = (type: string, result: string) => {
    const newItem: HistoryItem = {
      id: new Date().toISOString(),
      type,
      result,
      timestamp: new Date().toLocaleString(localeTag),
    };

    setHistory((prev) => {
      const newHistory = [newItem, ...prev].slice(0, 20);
      localStorage.setItem("temporal-history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("temporal-history");
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
