import type { ComponentProps } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "./button";
import { isWithinInterval } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerWithTodayProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: ComponentProps<typeof Calendar>["disabled"];
}

export function DatePickerWithToday({
  date,
  setDate,
  placeholder,
  minDate,
  maxDate,
  disabled,
}: DatePickerWithTodayProps) {
  const today = new Date();
  const isTodayAllowed = !minDate && !maxDate
    ? true
    : isWithinInterval(today, {
        start: minDate ?? new Date(-8640000000000000),
        end: maxDate ?? new Date(8640000000000000),
      });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex-grow">
        <DatePicker
          date={date}
          setDate={setDate}
          placeholder={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
        />
      </div>
      <Button variant="outline" onClick={() => setDate(today)} disabled={!isTodayAllowed} className="sm:flex-shrink-0">
        Hôm nay
      </Button>
    </div>
  );
}