import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { History, Menu, Scroll } from "lucide-react";
import { TOOL_DEFINITIONS } from "@/lib/tool-registry";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onHistoryToggle: () => void;
}

export function Header({ onHistoryToggle }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "border-primary/20 bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  const MobileNavLink = ({
    to,
    children,
    className,
  }: {
    to: string;
    children: ReactNode;
    className?: string;
  }) => (
    <NavLink
      to={to}
      className={cn("block py-2 text-muted-foreground transition-colors hover:text-primary", className)}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/15 bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-primary/15">
              <div className="mt-8 flex flex-col">
                <MobileNavLink to="/" className="font-serif text-base font-semibold">
                  {"L\u1ecbch Th\u00e1ng"}
                </MobileNavLink>
                <MobileNavLink to="/iching" className="font-serif text-base font-semibold">
                  {"Gieo Qu\u1ebb"}
                </MobileNavLink>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tools-accordion" className="border-b-0">
                    <div className="flex items-center text-base font-semibold text-muted-foreground">
                      <NavLink
                        to="/tools"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 py-2 text-left font-serif hover:text-primary"
                      >
                        {"Ph\u00e1p Kh\u00ed"}
                      </NavLink>
                      <AccordionTrigger className="-mr-2 p-2 hover:text-primary [&[data-state=open]>svg]:rotate-180" />
                    </div>
                    <AccordionContent className="pl-4">
                      {TOOL_DEFINITIONS.map((tool) => (
                        <MobileNavLink key={tool.slug} to={`/tools/${tool.slug}`}>
                          {tool.title}
                        </MobileNavLink>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <nav className="hidden items-center space-x-1 md:flex">
          <NavLink to="/" className={navLinkClass}>
            {"L\u1ecbch Th\u00e1ng"}
          </NavLink>
          <NavLink to="/iching" className={navLinkClass}>
            {"Gieo Qu\u1ebb"}
          </NavLink>
          <NavLink to="/tools" className={navLinkClass}>
            {"Ph\u00e1p Kh\u00ed"}
          </NavLink>
        </nav>

        <NavLink to="/" className="group flex-grow text-center">
          <div className="inline-flex items-center gap-2">
            <Scroll className="h-5 w-5 text-primary opacity-70 transition-opacity group-hover:opacity-100" />
            <h1 className="font-serif text-xl font-bold tracking-wide text-foreground sm:text-2xl">Temporal</h1>
          </div>
          <p className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:block">
            {"Thi\u00ean C\u01a1 L\u1ecbch"}
          </p>
        </NavLink>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onHistoryToggle}
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
          >
            <History className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
