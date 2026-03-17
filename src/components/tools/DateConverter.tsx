import { useState, useEffect } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_SOLAR_DATE,
  MAX_SUPPORTED_SOLAR_DATE,
} from "@/lib/lunar-converter";
import { format, isValid, parse } from "date-fns";
import { useHistory } from "@/contexts/HistoryContext";
import { vi } from "date-fns/locale";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";


interface DateConverterProps {
  id: string;
  initialDate?: string | null;
}

export function DateConverter({ id, initialDate }: DateConverterProps) {
  const { addToHistory } = useHistory();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");

  const handleConvert = (dateToConvert?: Date) => {
    const date = dateToConvert || selectedDate;
    if (!date || !isValid(date)) {
        setError("");
        setResults({});
        return;
    }

    const lunarInfo = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
    if (!lunarInfo) {
      setError(`Bộ chuyển đổi Âm lịch hiện chỉ hỗ trợ các năm từ ${MIN_SUPPORTED_LUNAR_YEAR} đến ${MAX_SUPPORTED_LUNAR_YEAR}.`);
      setResults({});
      return;
    }

    setError("");
    const [lunarDay, lunarMonth, lunarYear, isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = lunarInfo;
    
    const newResults = {
      "Âm Lịch": `Ngày ${lunarDay}/${lunarMonth}/${lunarYear} ${isLeap ? '(Nhuận)' : ''}`,
      "Can Chi": `Năm ${yearCan} ${yearChi}, Tháng ${monthCan}, Ngày ${dayCan} ${dayChi}`,
      "ISO 8601": format(date, "yyyy-MM-dd"),
      "Văn bản (Việt)": format(date, "eeee, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi }),
    };
    setResults(newResults);

    const historyResult = `Ngày gốc: ${format(date, "dd/MM/yyyy")}\n` + 
                         Object.entries(newResults).map(([key, value]) => `${key}: ${value}`).join('\n');
    addToHistory("Bộ Chuyển Đổi Ngày", historyResult);
  };

  useEffect(() => {
    if (initialDate) {
      const parsedDate = parse(initialDate, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
        const lunarInfo = convertSolar2Lunar(parsedDate.getDate(), parsedDate.getMonth() + 1, parsedDate.getFullYear());
        if (!lunarInfo) {
          setResults({});
          setError(`Bộ chuyển đổi Âm lịch hiện chỉ hỗ trợ các năm từ ${MIN_SUPPORTED_LUNAR_YEAR} đến ${MAX_SUPPORTED_LUNAR_YEAR}.`);
          return;
        }

        const [lunarDay, lunarMonth, lunarYear, isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = lunarInfo;
        setError("");
        setResults({
          "Âm Lịch": `Ngày ${lunarDay}/${lunarMonth}/${lunarYear} ${isLeap ? '(Nhuận)' : ''}`,
          "Can Chi": `Năm ${yearCan} ${yearChi}, Tháng ${monthCan}, Ngày ${dayCan} ${dayChi}`,
          "ISO 8601": format(parsedDate, "yyyy-MM-dd"),
          "Văn bản (Việt)": format(parsedDate, "eeee, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi }),
        });
      } else {
        setSelectedDate(undefined);
        setResults({});
        setError("");
      }
    } else {
      setSelectedDate(undefined);
      setResults({});
      setError("");
    }
  }, [initialDate]);

  const handleClear = () => {
    setSelectedDate(undefined);
    setResults({});
    setError("");
  }

  return (
    <ToolCard
      id={id}
      title="Bộ Chuyển Đổi Ngày"
      description="Xem một ngày dưới nhiều định dạng khác nhau, bao gồm cả Âm lịch và Can Chi."
    >
        <div className="flex flex-col space-y-4">
            <DatePickerWithToday
              date={selectedDate}
              setDate={setSelectedDate}
              minDate={MIN_SUPPORTED_SOLAR_DATE}
              maxDate={MAX_SUPPORTED_SOLAR_DATE}
            />
             {error && <p className="text-sm text-destructive">{error}</p>}
             {Object.keys(results).length > 0 && (
                <ul className="mt-2 space-y-2 rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm gold-glow animate-in fade-in duration-300">
                    {Object.entries(results).map(([key, value]) => (
                        <li key={key} className="flex justify-between border-b border-primary/10 pb-2 last:border-b-0">
                            <span className="text-muted-foreground font-serif italic">{key}:</span>
                            <span className="font-serif font-semibold text-primary text-right">{value}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <Button onClick={() => handleConvert()} disabled={!selectedDate}>Chuyển đổi</Button>
      </CardFooter>
    </ToolCard>
  );
}

