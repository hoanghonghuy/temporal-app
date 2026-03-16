import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { History, Menu, Scroll } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";

interface HeaderProps {
  onHistoryToggle: () => void;
}

const tools = [
  { href: "/tools#date-converter", label: "Bộ Chuyển Đổi Ngày" },
  { href: "/tools#date-difference", label: "Tính Khoảng Cách Ngày" },
  { href: "/tools#date-calculator", label: "Thêm / Bớt Ngày" },
  { href: "/tools#age-calculator", label: "Tính Tuổi" },
  { href: "/tools#event-countdown", label: "Đếm Ngược Sự Kiện" },
  { href: "/tools#working-days-calculator", label: "Tính Ngày Làm Việc" },
  { href: "/tools#leap-year", label: "Kiểm Tra Năm Nhuận" },
  { href: "/tools#day-of-week-finder", label: "Tìm Thứ Trong Tuần" },
];

export function Header({ onHistoryToggle }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-primary/10 text-primary border border-primary/20"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  const MobileNavLink = ({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) => (
    <NavLink to={to} className={cn("block py-2 text-muted-foreground hover:text-primary transition-colors", className)} onClick={() => setIsMobileMenuOpen(false)}>
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/15 bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-primary/20"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[320px]">
              <div className="mt-8 flex flex-col">
                <MobileNavLink to="/" className="text-base font-semibold font-serif">Lịch Tháng</MobileNavLink>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tools-accordion" className="border-b-0">
                    <div className="flex items-center text-base font-semibold text-muted-foreground">
                      <NavLink 
                        to="/tools" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-2 flex-1 text-left hover:text-primary font-serif"
                      >
                        Pháp Khí
                      </NavLink>
                      <AccordionTrigger className="p-2 -mr-2 hover:text-primary [&[data-state=open]>svg]:rotate-180" />
                    </div>
                    <AccordionContent className="pl-4">
                      {tools.map(tool => (
                        <MobileNavLink key={tool.href} to={tool.href}>{tool.label}</MobileNavLink>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/" className={navLinkClass}>Lịch Tháng</NavLink>
          <NavLink to="/tools" className={navLinkClass}>Pháp Khí</NavLink>
        </nav>

        {/* Logo */}
        <NavLink to="/" className="flex-grow text-center group">
          <div className="inline-flex items-center gap-2">
            <Scroll className="h-5 w-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground tracking-wide">
              Temporal
            </h1>
          </div>
          <p className="hidden sm:block text-xs text-muted-foreground tracking-widest uppercase">
            Thiên Cơ Lịch
          </p>
        </NavLink>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={onHistoryToggle} className="border-primary/20 hover:bg-primary/10 hover:text-primary">
            <History className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}