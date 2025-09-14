import { useState, useMemo } from "react";
import {
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
  addDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarHeader } from "@/components/CalendarHeader";
import { convertSolar2Lunar } from "@/lib/lunar-converter";
import { getVnHolidays } from "@/lib/vn-holidays";
import { DayDetailModal } from "@/components/DayDetailModal";

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const holidaysInYear = useMemo(() => getVnHolidays(currentDate.getFullYear()), [currentDate.getFullYear()]);
  const holidaysInMonth = useMemo(() => {
    const holidayMap = new Map<string, string>();
    holidaysInYear.forEach(h => {
        const key = format(h.date, 'yyyy-MM-dd');
        holidayMap.set(key, h.name);
    });
    return holidayMap;
  }, [holidaysInYear]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const firstDayOfGrid = startOfWeek(firstDayOfMonth, { locale: vi });
  // Luôn tính toán để có 35 ngày (5 hàng)
  const lastDayOfGrid = addDays(firstDayOfGrid, 34); 
  const days = eachDayOfInterval({
    start: firstDayOfGrid,
    end: lastDayOfGrid,
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleGoToToday = () => setCurrentDate(new Date());

  const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <>
      <div className="p-2 sm:p-4 bg-card text-card-foreground rounded-xl shadow-lg">
        {}
        <CalendarHeader 
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToToday={handleGoToToday}
        />
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground border-b pb-2 mb-2">
          {weekdays.map((day) => (<div key={day}>{day}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const [lunarDay, lunarMonth] = convertSolar2Lunar(day.getDate(), day.getMonth() + 1, day.getFullYear());
            const isSpecialLunar = lunarDay === 1 || lunarDay === 15;
            const holidayInfo = holidaysInMonth.get(format(day, 'yyyy-MM-dd'));
            const isHoliday = !!holidayInfo;

            return (
              <div
                key={index}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "day-cell flex flex-col items-center justify-center h-20 md:h-24 border-t border-l", // Giảm chiều cao một chút
                  "cursor-pointer hover:bg-muted/50 transition-colors relative",
                  !isSameMonth(day, currentDate) && "text-muted-foreground/50",
                  isHoliday && "holiday",
                  index % 7 === 6 && "border-r",
                  index >= days.length - 7 && "border-b"
                )}
                 title={holidayInfo}
              >
                <span className={cn(
                  "flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full text-sm sm:text-base",
                  isToday(day) && "bg-primary text-primary-foreground font-bold",
                  (isSaturday(day) || isSunday(day)) && !isToday(day) && "text-red-500"
                )}>
                  {day.getDate()}
                </span>
                <span className={cn(
                  "lunar-day mt-1 text-[10px] sm:text-xs",
                  "text-muted-foreground",
                  isSpecialLunar && isSameMonth(day, currentDate) && "special"
                )}>
                  {lunarDay === 1 ? `${lunarDay}/${lunarMonth}` : lunarDay}
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