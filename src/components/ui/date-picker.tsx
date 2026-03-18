"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  addMonths,
  format,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  setMonth,
  setYear,
  startOfMonth,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: ComponentProps<typeof Calendar>["disabled"];
}

function clampMonth(month: Date, startMonth: Date, endMonth: Date) {
  const normalizedMonth = startOfMonth(month);

  if (isBefore(normalizedMonth, startMonth)) {
    return startMonth;
  }

  if (isAfter(normalizedMonth, endMonth)) {
    return endMonth;
  }

  return normalizedMonth;
}

export function DatePicker({
  date,
  setDate,
  placeholder,
  minDate,
  maxDate,
  disabled,
}: DatePickerProps) {
  const { dictionary, dateLocale } = useI18n();
  const today = new Date();
  const currentYear = today.getFullYear();
  const copy = dictionary.datePicker;
  const resolvedPlaceholder = placeholder ?? copy.placeholder;
  const minDateTime = minDate?.getTime();
  const maxDateTime = maxDate?.getTime();
  const disabledMatchers: Matcher[] = [disabled]
    .flatMap((matcher) => {
      if (!matcher) return [];
      return Array.isArray(matcher) ? matcher : [matcher];
    })
    .concat(minDate ? [{ before: minDate }] : [])
    .concat(maxDate ? [{ after: maxDate }] : []);

  const calendarStartMonth = useMemo(
    () => startOfMonth(minDate ?? new Date(currentYear - 125, 0, 1)),
    [currentYear, minDateTime]
  );
  const calendarEndMonth = useMemo(
    () => startOfMonth(maxDate ?? new Date(currentYear + 75, 11, 1)),
    [currentYear, maxDateTime]
  );
  const [displayMonth, setDisplayMonth] = useState<Date>(() =>
    clampMonth(startOfMonth(date ?? today), calendarStartMonth, calendarEndMonth)
  );

  useEffect(() => {
    setDisplayMonth((currentMonth) => {
      if (date) {
        return clampMonth(startOfMonth(date), calendarStartMonth, calendarEndMonth);
      }

      return clampMonth(currentMonth, calendarStartMonth, calendarEndMonth);
    });
  }, [date?.getTime(), calendarEndMonth, calendarStartMonth]);

  const years = useMemo(() => {
    const startYear = getYear(calendarStartMonth);
    const endYear = getYear(calendarEndMonth);

    return Array.from({ length: endYear - startYear + 1 }, (_, index) => endYear - index);
  }, [calendarEndMonth, calendarStartMonth]);

  const availableMonths = useMemo(() => {
    const selectedYear = getYear(displayMonth);

    return Array.from({ length: 12 }, (_, monthIndex) => {
      const candidateMonth = new Date(selectedYear, monthIndex, 1);
      const monthName = format(candidateMonth, "MMMM", { locale: dateLocale });
      const label = formatTemplate(copy.monthLabelTemplate, {
        month: monthIndex + 1,
        monthName,
      });

      return { label, monthIndex, candidateMonth };
    }).filter(({ candidateMonth }) => !isBefore(candidateMonth, calendarStartMonth) && !isAfter(candidateMonth, calendarEndMonth));
  }, [calendarEndMonth, calendarStartMonth, copy.monthLabelTemplate, dateLocale, displayMonth]);

  const handleMonthSelect = (value: string) => {
    setDisplayMonth((currentMonth) =>
      clampMonth(startOfMonth(setMonth(currentMonth, Number(value))), calendarStartMonth, calendarEndMonth)
    );
  };

  const handleYearSelect = (value: string) => {
    setDisplayMonth((currentMonth) =>
      clampMonth(startOfMonth(setYear(currentMonth, Number(value))), calendarStartMonth, calendarEndMonth)
    );
  };

  const previousMonth = startOfMonth(addMonths(displayMonth, -1));
  const nextMonth = startOfMonth(addMonths(displayMonth, 1));
  const canGoPreviousMonth = !isBefore(previousMonth, calendarStartMonth);
  const canGoNextMonth = !isAfter(nextMonth, calendarEndMonth);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={copy.openCalendar}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "P", { locale: dateLocale }) : <span>{resolvedPlaceholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[18.25rem] max-w-[calc(100vw-1.5rem)] p-0" align="start">
        <div className="border-b border-border/60 p-3">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Select value={String(getMonth(displayMonth))} onValueChange={handleMonthSelect}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={copy.selectMonth} />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.monthIndex} value={String(month.monthIndex)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(getYear(displayMonth))} onValueChange={handleYearSelect}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder={copy.selectYear} />
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

            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={copy.previousMonth}
                onClick={() => canGoPreviousMonth && setDisplayMonth(previousMonth)}
                disabled={!canGoPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={copy.nextMonth}
                onClick={() => canGoNextMonth && setDisplayMonth(nextMonth)}
                disabled={!canGoNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Calendar
          mode="single"
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          fixedWeeks
          selected={date}
          onSelect={(nextDate) => {
            setDate(nextDate);
            if (nextDate) {
              setDisplayMonth(clampMonth(startOfMonth(nextDate), calendarStartMonth, calendarEndMonth));
            }
          }}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          startMonth={calendarStartMonth}
          endMonth={calendarEndMonth}
          hideNavigation
          locale={dateLocale}
          classNames={{
            root: "w-full",
            month: "flex w-full flex-col gap-2",
            month_caption: "hidden",
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
