import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSaturday,
  isSunday,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarHeader } from "@/components/CalendarHeader";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
} from "@/lib/lunar-converter";
import { getVnHolidays } from "@/lib/vn-holidays";
import { DayDetailModal } from "@/components/DayDetailModal";
import { useI18n } from "@/contexts/I18nContext";

export function CalendarPage() {
  const { dictionary, dateLocale, locale } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const minCalendarMonth = new Date(MIN_SUPPORTED_LUNAR_YEAR, 0, 1);
  const maxCalendarMonth = new Date(MAX_SUPPORTED_LUNAR_YEAR, 11, 1);

  const year = currentDate.getFullYear();
  const holidaysInYear = useMemo(() => getVnHolidays(year, locale), [year, locale]);
  const holidaysInMonth = useMemo(() => {
    const holidayMap = new Map<string, string[]>();
    holidaysInYear.forEach((holiday) => {
      const key = format(holiday.date, "yyyy-MM-dd");
      const names = holidayMap.get(key) ?? [];
      names.push(holiday.name);
      holidayMap.set(key, names);
    });
    return holidayMap;
  }, [holidaysInYear]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const firstDayOfGrid = startOfWeek(firstDayOfMonth, { locale: dateLocale });
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

  const handleMonthYearChange = (nextYear: number, nextMonth: number) => {
    const nextDate = new Date(nextYear, nextMonth, 1);
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

  return (
    <>
      <div className="gold-glow rounded-lg border border-primary/10 bg-card p-3 text-card-foreground sm:p-5">
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

        <p className="mb-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {dictionary.calendarDataNotice(MIN_SUPPORTED_LUNAR_YEAR, MAX_SUPPORTED_LUNAR_YEAR)}
        </p>

        <div className="mb-1 grid grid-cols-7 border-b border-primary/10 pb-2 text-center font-serif text-xs font-semibold text-muted-foreground sm:text-sm">
          {dictionary.calendarWeekdays.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const lunarInfo = convertSolar2Lunar(day.getDate(), day.getMonth() + 1, day.getFullYear());
            const lunarDay = lunarInfo?.[0];
            const lunarMonth = lunarInfo?.[1];
            const isSpecialLunar = lunarDay === 1 || lunarDay === 15;
            const holidayInfo = holidaysInMonth.get(format(day, "yyyy-MM-dd")) ?? [];
            const isHoliday = holidayInfo.length > 0;
            const isTodayDate = isToday(day);
            const isWeekend = isSaturday(day) || isSunday(day);
            const isSupportedDay = !!lunarInfo;

            const dayAria = `${format(day, "dd/MM/yyyy")} ${holidayInfo.length > 0 ? `- ${holidayInfo.join(", ")}` : ""}`;

            return (
              <button
                key={index}
                type="button"
                onClick={() => isSupportedDay && setSelectedDay(day)}
                disabled={!isSupportedDay}
                aria-label={dayAria}
                className={cn(
                  "day-cell flex h-20 flex-col items-center justify-center border-l border-t border-primary/5 md:h-24",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                  !isSupportedDay && "cursor-not-allowed opacity-60",
                  isSupportedDay && "cursor-pointer transition-all duration-200",
                  !isSameMonth(day, currentDate) && "text-muted-foreground/40",
                  isHoliday && "holiday",
                  index % 7 === 6 && "border-r border-primary/5",
                  index >= days.length - 7 && "border-b border-primary/5"
                )}
                title={holidayInfo.join("\n")}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 sm:h-9 sm:w-9 sm:text-base",
                    isTodayDate
                      ? "border-2 border-primary/60 bg-primary font-bold text-primary-foreground ring-4 ring-primary/20"
                      : isWeekend && isSameMonth(day, currentDate)
                        ? "text-destructive/80"
                        : ""
                  )}
                >
                  {day.getDate()}
                </span>
                <span
                  className={cn(
                    "lunar-day mt-0.5 text-[10px] text-muted-foreground/70 sm:text-xs",
                    isSpecialLunar && isSameMonth(day, currentDate) && "special"
                  )}
                >
                  {isSupportedDay ? (lunarDay === 1 ? `${lunarDay}/${lunarMonth}` : lunarDay) : "--"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DayDetailModal selectedDay={selectedDay} onClose={() => setSelectedDay(null)} holidaysInYear={holidaysInYear} />
    </>
  );
}
