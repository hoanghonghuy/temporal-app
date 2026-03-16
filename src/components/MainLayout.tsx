import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { HistoryPanel } from "./HistoryPanel";
import { useState } from "react";
import { Footer } from "./Footer";

export function MainLayout() {
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  return (
    <HistoryProvider>
      <div className="min-h-screen bg-background font-sans antialiased flex flex-col justify-between parchment-bg">
        <div>
          <Header onHistoryToggle={() => setIsHistoryPanelOpen(true)} />
          <main className="container p-4 sm:p-6 md:py-8">
            <Outlet />
          </main>
        </div>
        <Footer />
        <HistoryPanel isOpen={isHistoryPanelOpen} onOpenChange={setIsHistoryPanelOpen} />
      </div>
    </HistoryProvider>
  );
}