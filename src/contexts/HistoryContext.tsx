import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load lịch sử từ localStorage khi component được tạo
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
      timestamp: new Date().toLocaleString("vi-VN"),
    };
    setHistory(prev => {
      const newHistory = [newItem, ...prev].slice(0, 20); // Giữ lại 20 mục gần nhất
      localStorage.setItem("temporal-history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("temporal-history");
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};