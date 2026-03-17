import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { convertSolar2Lunar } from "@/lib/lunar-converter";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  canGoPrev,
  canGoNext,
}: CalendarHeaderProps) {

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const lunarStart = convertSolar2Lunar(monthStart.getDate(), monthStart.getMonth() + 1, monthStart.getFullYear());
  const lunarEnd = convertSolar2Lunar(monthEnd.getDate(), monthEnd.getMonth() + 1, monthEnd.getFullYear());
  
  let lunarMonthDisplay = "";

  if (!lunarStart || !lunarEnd) {
      lunarMonthDisplay = "Ngoài phạm vi âm lịch hỗ trợ";
  } else {
      const [, lunarMonthStart, lunarYearStart, , , , , yearCanStart, yearChiStart] = lunarStart;
      const [, lunarMonthEnd, lunarYearEnd, , , , , yearCanEnd, yearChiEnd] = lunarEnd;

      if (lunarYearStart !== lunarYearEnd) {
      lunarMonthDisplay = `Năm ${yearCanStart} ${yearChiStart} — ${yearCanEnd} ${yearChiEnd}`;
      } else if (lunarMonthStart !== lunarMonthEnd) {
      lunarMonthDisplay = `Tháng ${lunarMonthStart} & ${lunarMonthEnd} · ${yearCanStart} ${yearChiStart}`;
      } else {
      lunarMonthDisplay = `Tháng ${lunarMonthStart} · ${yearCanStart} ${yearChiStart}`;
      }
  }

  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-serif capitalize text-foreground">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </h2>
          <p className="text-sm text-primary/80 font-serif italic">{lunarMonthDisplay}</p>
        </div>
        <Button onClick={onGoToToday} variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10 hover:text-primary text-xs">
          Hôm nay
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button onClick={onPrevMonth} variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10 hover:text-primary" disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNextMonth} variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10 hover:text-primary" disabled={!canGoNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}