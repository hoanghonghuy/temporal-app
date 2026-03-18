import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { HistoryPanel } from "./HistoryPanel";
import { useState } from "react";
import { Footer } from "./Footer";
import { useI18n } from "@/contexts/I18nContext";

export function MainLayout() {
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const { dictionary } = useI18n();

  return (
    <HistoryProvider>
      <div className="min-h-screen bg-background font-sans antialiased flex flex-col justify-between parchment-bg">
        <div>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {dictionary.accessibility.skipToContent}
          </a>
          <Header onHistoryToggle={() => setIsHistoryPanelOpen(true)} />
          <main id="main-content" className="container p-4 sm:p-6 md:py-8">
            <Outlet />
          </main>
        </div>
        <Footer />
        <HistoryPanel isOpen={isHistoryPanelOpen} onOpenChange={setIsHistoryPanelOpen} />
      </div>
    </HistoryProvider>
  );
}
