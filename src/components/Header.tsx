import { useState } from "react";
import { NavLink } from "react-router-dom";
import { History, Menu, Scroll } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/contexts/I18nContext";
import { AppSidebar } from "./AppSidebar";

interface HeaderProps {
  onHistoryToggle: () => void;
}

export function Header({ onHistoryToggle }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { dictionary } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/15 bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-primary/20"
                aria-label={dictionary.menuAria}
                title={dictionary.menuAria}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[84vw] max-w-[18rem] border-r-primary/15 p-0">
              <div className="h-full p-4 pt-12">
                <AppSidebar
                  onHistoryToggle={onHistoryToggle}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                  className="h-full"
                />
              </div>
            </SheetContent>
          </Sheet>
          </div>

          <NavLink to="/" aria-label={dictionary.homeAria} className="group inline-flex items-center gap-2">
            <Scroll className="h-5 w-5 text-primary opacity-70 transition-opacity group-hover:opacity-100" />
            <div>
              <h1 className="font-serif text-xl font-bold tracking-wide text-foreground sm:text-2xl">Temporal</h1>
              <p className="hidden text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:block">
                {dictionary.appSubtitle}
              </p>
            </div>
          </NavLink>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onHistoryToggle}
            className="border-primary/20 hover:bg-primary/10 hover:text-primary lg:hidden"
            aria-label={dictionary.historyAria}
            title={dictionary.historyAria}
          >
            <History className="h-5 w-5" />
          </Button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
