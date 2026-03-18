import { useState, useMemo } from "react";
import {
  addDays,
  startOfMonth,
  startOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSaturday,
  isSunday,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarHeader } from "@/components/CalendarHeader";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
} from "@/lib/lunar-converter";
import { getVnHolidays } from "@/lib/vn-holidays";
import { DayDetailModal } from "@/components/DayDetailModal";

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const minCalendarMonth = new Date(MIN_SUPPORTED_LUNAR_YEAR, 0, 1);
  const maxCalendarMonth = new Date(MAX_SUPPORTED_LUNAR_YEAR, 11, 1);

  const year = currentDate.getFullYear();
  const holidaysInYear = useMemo(() => getVnHolidays(year), [year]);
  const holidaysInMonth = useMemo(() => {
    const holidayMap = new Map<string, string[]>();
    holidaysInYear.forEach(h => {
        const key = format(h.date, 'yyyy-MM-dd');
        const names = holidayMap.get(key) ?? [];
        names.push(h.name);
        holidayMap.set(key, names);
    });
    return holidayMap;
  }, [holidaysInYear]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const firstDayOfGrid = startOfWeek(firstDayOfMonth, { locale: vi });
  const lastDayOfGrid = addDays(firstDayOfGrid, 41);
  const days = eachDayOfInterval({
    start: firstDayOfGrid,
    end: lastDayOfGrid,
  });

  const canGoPrev = currentDate > minCalendarMonth;
  const canGoNext = currentDate < maxCalendarMonth;

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    const nextDate = today < minCalendarMonth ? minCalendarMonth : today > maxCalendarMonth ? maxCalendarMonth : today;
    setCurrentDate(nextDate);
  };

  const handleMonthYearChange = (year: number, month: number) => {
    const nextDate = new Date(year, month, 1);
    if (nextDate < minCalendarMonth) {
      setCurrentDate(minCalendarMonth);
      return;
    }
    if (nextDate > maxCalendarMonth) {
      setCurrentDate(maxCalendarMonth);
      return;
    }
    setCurrentDate(nextDate);
  };

  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <>
      <div className="p-3 sm:p-5 bg-card text-card-foreground rounded-lg border border-primary/10 gold-glow">
        <CalendarHeader 
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToToday={handleGoToToday}
          onMonthYearChange={handleMonthYearChange}
          minYear={MIN_SUPPORTED_LUNAR_YEAR}
          maxYear={MAX_SUPPORTED_LUNAR_YEAR}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
        <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-serif font-semibold text-muted-foreground border-b border-primary/10 pb-2 mb-1">
          {weekdays.map((day) => (<div key={day} className="py-1">{day}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const lunarInfo = convertSolar2Lunar(day.getDate(), day.getMonth() + 1, day.getFullYear());
            const lunarDay = lunarInfo?.[0];
            const lunarMonth = lunarInfo?.[1];
            const isSpecialLunar = lunarDay === 1 || lunarDay === 15;
            const holidayInfo = holidaysInMonth.get(format(day, 'yyyy-MM-dd')) ?? [];
            const isHoliday = holidayInfo.length > 0;
            const isTodayDate = isToday(day);
            const isWeekend = isSaturday(day) || isSunday(day);
            const isSupportedDay = !!lunarInfo;

            return (
              <div
                key={index}
                onClick={() => isSupportedDay && setSelectedDay(day)}
                className={cn(
                  "day-cell flex flex-col items-center justify-center h-20 md:h-24 border-t border-l border-primary/5",
                  isSupportedDay ? "cursor-pointer transition-all duration-200" : "cursor-not-allowed opacity-60",
                  !isSameMonth(day, currentDate) && "text-muted-foreground/40",
                  isHoliday && "holiday",
                  index % 7 === 6 && "border-r border-primary/5",
                  index >= days.length - 7 && "border-b border-primary/5"
                )}
                 title={holidayInfo.join("\n")}
              >
                <span className={cn(
                  "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full text-sm sm:text-base transition-all duration-200",
                  isTodayDate 
                    ? "bg-primary text-primary-foreground font-bold border-2 border-primary/60 ring-4 ring-primary/20" 
                    : isWeekend && isSameMonth(day, currentDate)
                      ? "text-destructive/80"
                      : ""
                )}>
                  {day.getDate()}
                </span>
                <span className={cn(
                  "lunar-day mt-0.5 text-[10px] sm:text-xs",
                  "text-muted-foreground/70",
                  isSpecialLunar && isSameMonth(day, currentDate) && "special"
                )}>
                  {isSupportedDay ? (lunarDay === 1 ? `${lunarDay}/${lunarMonth}` : lunarDay) : "--"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <DayDetailModal 
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
        holidaysInYear={holidaysInYear}
      />
    </>
  );
}
