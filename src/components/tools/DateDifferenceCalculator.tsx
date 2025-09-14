import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/ToolCard";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useHistory } from "@/contexts/HistoryContext";
import { format } from "date-fns";

interface DateDifferenceCalculatorProps { id: string; }

export function DateDifferenceCalculator({ id }: DateDifferenceCalculatorProps) {
  const { addToHistory } = useHistory();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCalculate = () => {
    setError("");
    setResult("");

    if (!startDate || !endDate) {
      setError("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (startDate > endDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let tempEndDate = new Date(endDate);
    let years = tempEndDate.getFullYear() - startDate.getFullYear();
    let months = tempEndDate.getMonth() - startDate.getMonth();
    let days = tempEndDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const resultText = `Khoảng cách là ${years} năm, ${months} tháng, ${days} ngày. (Tổng cộng ${diffDays} ngày)`;
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
          <DatePicker date={startDate} setDate={setStartDate} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="end-date">Ngày kết thúc</Label>
          <DatePicker date={endDate} setDate={setEndDate} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground">{result}</p>
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