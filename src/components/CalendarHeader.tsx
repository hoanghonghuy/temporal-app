import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { convertSolar2Lunar } from "@/lib/lunar-converter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onMonthYearChange: (year: number, month: number) => void;
  minYear: number;
  maxYear: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onMonthYearChange,
  minYear,
  maxYear,
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
      lunarMonthDisplay = `Năm ${yearCanStart} ${yearChiStart} - ${yearCanEnd} ${yearChiEnd}`;
    } else if (lunarMonthStart !== lunarMonthEnd) {
      lunarMonthDisplay = `Tháng ${lunarMonthStart} & ${lunarMonthEnd} · ${yearCanStart} ${yearChiStart}`;
    } else {
      lunarMonthDisplay = `Tháng ${lunarMonthStart} · ${yearCanStart} ${yearChiStart}`;
    }
  }

  const handleMonthChange = (value: string) => {
    onMonthYearChange(currentDate.getFullYear(), Number(value));
  };

  const handleYearChange = (value: string) => {
    onMonthYearChange(Number(value), currentDate.getMonth());
  };

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);

  return (
    <div className="mb-4 flex items-center justify-between border-b border-primary/10 pb-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="group h-auto p-0 text-left hover:bg-transparent">
              <div>
                <div className="flex items-center gap-1">
                  <h2 className="font-serif text-xl font-bold capitalize text-foreground md:text-2xl">
                    {format(currentDate, "MMMM yyyy", { locale: vi })}
                  </h2>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground/70 transition-colors group-hover:text-primary" />
                </div>
                <p className="font-serif text-sm italic text-primary/80">{lunarMonthDisplay}</p>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[270px] border-primary/15 bg-card/95 p-3 backdrop-blur-sm sm:w-[290px]"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Chọn nhanh tháng/năm</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={String(currentDate.getMonth())} onValueChange={handleMonthChange}>
                  <SelectTrigger className="border-primary/20 bg-background/80">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, month) => (
                      <SelectItem key={month} value={String(month)}>
                        {`Tháng ${month + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(currentDate.getFullYear())} onValueChange={handleYearChange}>
                  <SelectTrigger className="border-primary/20 bg-background/80">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          onClick={onGoToToday}
          variant="outline"
          size="sm"
          className="border-primary/20 text-xs hover:bg-primary/10 hover:text-primary"
        >
          Hôm nay
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          onClick={onPrevMonth}
          variant="outline"
          size="icon"
          className="border-primary/20 hover:bg-primary/10 hover:text-primary"
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={onNextMonth}
          variant="outline"
          size="icon"
          className="border-primary/20 hover:bg-primary/10 hover:text-primary"
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
