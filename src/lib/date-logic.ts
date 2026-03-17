import { differenceInCalendarDays, endOfDay, intervalToDuration } from "date-fns";

export interface DateDifferenceBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function getDateDifferenceBreakdown(startDate: Date, endDate: Date): DateDifferenceBreakdown {
  const duration = intervalToDuration({ start: startDate, end: endDate });

  return {
    years: duration.years ?? 0,
    months: duration.months ?? 0,
    days: duration.days ?? 0,
    totalDays: differenceInCalendarDays(endDate, startDate),
  };
}

export function getCountdownTargetDate(targetDate: Date) {
  return endOfDay(targetDate);
}