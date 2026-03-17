import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/ToolCard";
import { CardFooter } from "@/components/ui/card";
import { useHistory } from "@/contexts/HistoryContext";
import { format } from "date-fns";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { getDateDifferenceBreakdown } from "@/lib/date-logic";

interface DateDifferenceCalculatorProps { id: string; }

export function DateDifferenceCalculator({ id }: DateDifferenceCalculatorProps) {
  const { addToHistory } = useHistory();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const handleCalculate = () => {
    setError("");
    setResult("");

    if (!startDate || !endDate) {
      const msg = "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.";
      setError(msg);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (startDate > endDate) {
      const msg = "Ngày kết thúc phải sau ngày bắt đầu.";
      setError(msg);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const { years, months, days, totalDays } = getDateDifferenceBreakdown(startDate, endDate);

    const resultText = `Khoảng cách là ${years} năm, ${months} tháng, ${days} ngày. (Tổng cộng ${totalDays} ngày)`;
    setResult(resultText);

    addToHistory(
      "Tính Khoảng Cách 2 Ngày",
      `Từ: ${format(startDate, "dd/MM/yyyy")}\nĐến: ${format(endDate, "dd/MM/yyyy")}\nKết quả: ${years} năm, ${months} tháng, ${days} ngày`
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
      title="Tính Khoảng Cách 2 Ngày"
      description="Chọn hai mốc thời gian để xem khoảng cách chi tiết giữa chúng."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="start-date">Ngày bắt đầu</Label>
          <DatePickerWithToday date={startDate} setDate={setStartDate} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="end-date">Ngày kết thúc</Label>
          <DatePickerWithToday date={endDate} setDate={setEndDate} />
        </div>
        {error && <p ref={errorRef} className="text-sm text-destructive font-serif">{error}</p>}
        {result && (
          <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm gold-glow animate-in fade-in duration-300">
            <p className="font-medium text-foreground font-serif text-center italic leading-relaxed">{result}</p>
          </div>
        )}
      </div>
       <CardFooter className="flex justify-end space-x-2 pt-6 px-0">
          <Button variant="outline" onClick={handleClear}>Xóa</Button>
          <Button onClick={handleCalculate}>Tính toán</Button>
      </CardFooter>
    </ToolCard>
  );
}