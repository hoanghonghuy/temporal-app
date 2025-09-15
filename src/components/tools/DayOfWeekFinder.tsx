import { useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useHistory } from "@/contexts/HistoryContext";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";


interface DayOfWeekFinderProps { id: string; }

export function DayOfWeekFinder({ id }: DayOfWeekFinderProps) {
  const { addToHistory } = useHistory();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");

  const handleFindDay = () => {
    if (!selectedDate) return;
    
    const dayName = format(selectedDate, 'eeee', { locale: vi });
    const resultText = `Ngày đó là: ${dayName}`;
    setResult(resultText);

    addToHistory(
      "Tìm Thứ Trong Tuần",
      `Ngày: ${format(selectedDate, "dd/MM/yyyy")}\nKết quả: ${dayName}`
    );
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setResult("");
  };

  return (
    <ToolCard
      id={id}
      title="Tìm Thứ Trong Tuần"
      description="Chọn một ngày bất kỳ để biết chính xác đó là thứ mấy."
    >
      <div className="flex flex-col space-y-4">
        <DatePickerWithToday date={selectedDate} setDate={setSelectedDate} />
        {result && (
          <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground text-center">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <Button onClick={handleFindDay} disabled={!selectedDate}>Tìm Thứ</Button>
      </CardFooter>
    </ToolCard>
  );
}