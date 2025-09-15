import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "./button";

interface DatePickerWithTodayProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePickerWithToday({ date, setDate, placeholder }: DatePickerWithTodayProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-grow">
        <DatePicker date={date} setDate={setDate} placeholder={placeholder} />
      </div>
      <Button variant="outline" onClick={() => setDate(new Date())}>
        Hôm nay
      </Button>
    </div>
  );
}