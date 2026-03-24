import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { HistoryPanel } from "./HistoryPanel";
import { useState } from "react";
import { Footer } from "./Footer";
import { useI18n } from "@/contexts/I18nContext";
import { AppSidebar } from "./AppSidebar";
import { TemporalDataProvider } from "@/contexts/TemporalDataContext";

export function MainLayout() {
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const { dictionary } = useI18n();

  return (
    <HistoryProvider>
      <TemporalDataProvider>
        <div className="flex min-h-screen flex-col justify-between bg-background font-sans antialiased parchment-bg">
          <div className="flex-1">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {dictionary.accessibility.skipToContent}
            </a>
            <Header onHistoryToggle={() => setIsHistoryPanelOpen(true)} />
            <div className="container p-4 sm:p-6 md:py-8 lg:flex lg:items-start lg:gap-5">
              <aside className="hidden lg:block lg:w-[16rem] xl:w-[17.5rem]">
                <div className="sticky top-24 h-[calc(100vh-7.5rem)]">
                  <AppSidebar onHistoryToggle={() => setIsHistoryPanelOpen(true)} className="h-full" />
                </div>
              </aside>
              <main id="main-content" className="min-w-0 flex-1">
                <Outlet />
              </main>
            </div>
          </div>
          <Footer />
          <HistoryPanel isOpen={isHistoryPanelOpen} onOpenChange={setIsHistoryPanelOpen} />
        </div>
      </TemporalDataProvider>
    </HistoryProvider>
  );
}
