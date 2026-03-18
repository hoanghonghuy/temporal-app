import { useState, useEffect } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getVnHolidays } from "@/lib/vn-holidays";
import { isSaturday, isSunday, eachDayOfInterval, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useHistory } from "@/contexts/HistoryContext";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { MAX_SUPPORTED_SOLAR_DATE, MIN_SUPPORTED_SOLAR_DATE } from "@/lib/lunar-converter";
import { ToolResultDisplay } from "@/components/ui/tool-result-display";


interface WorkingDaysCalculatorProps { id: string; }

interface HolidayInRange {
  date: string;
  names: string[];
  checked: boolean;
}

export function WorkingDaysCalculator({ id }: WorkingDaysCalculatorProps) {
  const { addToHistory } = useHistory();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [holidaysInRange, setHolidaysInRange] = useState<HolidayInRange[]>([]);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const allHolidays = [];
      for (let year = startYear; year <= endYear; year++) {
        allHolidays.push(...getVnHolidays(year));
      }

      const holidaysByDate = new Map<string, HolidayInRange>();
      allHolidays
        .filter((holiday) => holiday.isDayOff)
        .filter(h => h.date >= startDate && h.date <= endDate)
        .forEach(h => {
          const dateKey = format(h.date, "yyyy-MM-dd");
          const currentHoliday = holidaysByDate.get(dateKey);
          if (currentHoliday) {
            if (!currentHoliday.names.includes(h.name)) {
              currentHoliday.names.push(h.name);
            }
            return;
          }

          holidaysByDate.set(dateKey, { date: dateKey, names: [h.name], checked: true });
        });

      const foundHolidays = Array.from(holidaysByDate.values());
      setHolidaysInRange(foundHolidays);
    } else {
      setHolidaysInRange([]);
    }
  }, [startDate, endDate]);

  const handleHolidayToggle = (date: string) => {
    setHolidaysInRange(prev => 
      prev.map(h => h.date === date ? { ...h, checked: !h.checked } : h)
    );
  };

  const handleCalculate = () => {
    setError("");
    if (!startDate || !endDate) {
      setError("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (startDate > endDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const excludedHolidays = new Set(
      holidaysInRange.filter(h => h.checked).map(h => h.date)
    );
    
    let workingDays = 0;
    for (const day of daysInterval) {
      const isWeekend = isSaturday(day) || isSunday(day);
      const isHoliday = excludedHolidays.has(format(day, 'yyyy-MM-dd'));
      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
    }
    const resultText = `Có tổng cộng ${workingDays} ngày làm việc trong khoảng thời gian đã chọn.`;
    setResult(resultText);

    addToHistory(
      "Tính Ngày Làm Việc",
      `Từ: ${format(startDate, "dd/MM/yyyy")}\nĐến: ${format(endDate, "dd/MM/yyyy")}\nKết quả: ${workingDays} ngày làm việc`
    );
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setResult("");
    setError("");
  };

  return (
    <ToolCard
      id={id}
      title="Tính Ngày Làm Việc"
      description="Tính số ngày làm việc giữa hai mốc thời gian, tự động loại trừ cuối tuần và ngày lễ."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label>Ngày bắt đầu</Label>
          <DatePickerWithToday
            date={startDate}
            setDate={setStartDate}
            minDate={MIN_SUPPORTED_SOLAR_DATE}
            maxDate={MAX_SUPPORTED_SOLAR_DATE}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label>Ngày kết thúc</Label>
          <DatePickerWithToday
            date={endDate}
            setDate={setEndDate}
            minDate={MIN_SUPPORTED_SOLAR_DATE}
            maxDate={MAX_SUPPORTED_SOLAR_DATE}
          />
        </div>
        {holidaysInRange.length > 0 && (
          <div className="space-y-2 pt-2">
            <Label>Loại trừ các ngày nghỉ/lễ sau:</Label>
            <div className="themed-scrollbar max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
              {holidaysInRange.map(holiday => (
                <div key={holiday.date} className="flex items-center space-x-2">
                  <Checkbox 
                    id={holiday.date} checked={holiday.checked}
                    onCheckedChange={() => handleHolidayToggle(holiday.date)}
                  />
                  <Label htmlFor={holiday.date} className="text-sm font-normal cursor-pointer">
                    {holiday.names.join(" · ")} ({format(new Date(holiday.date), 'dd/MM')})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <ToolResultDisplay>
            {result}
          </ToolResultDisplay>
        )}
      </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <Button onClick={handleCalculate} disabled={!startDate || !endDate}>Tính toán</Button>
      </CardFooter>
    </ToolCard>
  );
}
