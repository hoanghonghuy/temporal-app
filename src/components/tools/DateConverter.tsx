import { useState, useEffect } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { convertSolar2Lunar } from "@/lib/lunar-converter";
import { format, parse } from "date-fns";
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

  useEffect(() => {
    if (initialDate) {
      try {
        const parsedDate = parse(initialDate, "dd/MM/yyyy", new Date());
        setSelectedDate(parsedDate);
        handleConvert(parsedDate);
      } catch (error) {
        console.error("Invalid date from URL", error);
      }
    }
  }, [initialDate]);

  const handleConvert = (dateToConvert?: Date) => {
    const date = dateToConvert || selectedDate;
    if (!date) {
        setResults({});
        return;
    };

    const [lunarDay, lunarMonth, , isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = 
      convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
    
    const newResults = {
      "Âm Lịch": `Ngày ${lunarDay}/${lunarMonth}/${date.getFullYear()} ${isLeap ? '(Nhuận)' : ''}`,
      "Can Chi": `Năm ${yearCan} ${yearChi}, Tháng ${monthCan}, Ngày ${dayCan} ${dayChi}`,
      "ISO 8601": format(date, "yyyy-MM-dd"),
      "Văn bản (Việt)": format(date, "eeee, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi }),
    };
    setResults(newResults);

    const historyResult = `Ngày gốc: ${format(date, "dd/MM/yyyy")}\n` + 
                         Object.entries(newResults).map(([key, value]) => `${key}: ${value}`).join('\n');
    addToHistory("Bộ Chuyển Đổi Ngày", historyResult);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setResults({});
  }

  return (
    <ToolCard
      id={id}
      title="Bộ Chuyển Đổi Ngày"
      description="Xem một ngày dưới nhiều định dạng khác nhau, bao gồm cả Âm lịch và Can Chi."
    >
        <div className="flex flex-col space-y-4">
            <DatePickerWithToday date={selectedDate} setDate={setSelectedDate} />
             {Object.keys(results).length > 0 && (
                <ul className="mt-2 space-y-2 rounded-lg border bg-secondary/50 p-3 text-sm">
                    {Object.entries(results).map(([key, value]) => (
                        <li key={key} className="flex justify-between border-b border-border/50 pb-1 last:border-b-0">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono text-right">{value}</span>
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