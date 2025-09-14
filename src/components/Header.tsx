import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { History, Menu } from "lucide-react";
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
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    }`;

  const MobileNavLink = ({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) => (
    <NavLink to={to} className={cn("block py-2 text-muted-foreground hover:text-foreground", className)} onClick={() => setIsMobileMenuOpen(false)}>
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card text-card-foreground">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu (Hamburger Icon) */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[320px]">
              <div className="mt-8 flex flex-col">
                <MobileNavLink to="/" className="text-base font-semibold">Lịch Tháng</MobileNavLink>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    {/* Tùy chỉnh AccordionTrigger */}
                    <AccordionTrigger className="py-2 text-base font-semibold text-muted-foreground hover:text-foreground no-underline hover:no-underline">
                      <NavLink 
                        to="/tools" 
                        className="flex-1 text-left" 
                        onClick={(e) => {
                          // Không ngăn accordion mở ra, chỉ xử lý việc đóng menu
                          if (e.target === e.currentTarget) {
                             setIsMobileMenuOpen(false);
                          }
                        }}
                      >
                        Công Cụ
                      </NavLink>
                    </AccordionTrigger>
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
        <nav className="hidden md:flex items-center space-x-2">
          <NavLink to="/" className={navLinkClass}>Lịch Tháng</NavLink>
          <NavLink to="/tools" className={navLinkClass}>Công Cụ</NavLink>
        </nav>

        <div className="flex-grow text-center">
          <h1 className="text-xl sm:text-2xl font-bold">Temporal</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={onHistoryToggle}><History className="h-5 w-5" /></Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}