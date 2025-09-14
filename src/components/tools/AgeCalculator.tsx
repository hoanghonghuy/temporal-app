import { useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useHistory } from "@/contexts/HistoryContext";
import { format } from "date-fns";

interface AgeCalculatorProps { id: string; }

export function AgeCalculator({ id }: AgeCalculatorProps) {
  const { addToHistory } = useHistory();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCalculate = () => {
    setError("");
    setResult("");
    if (!birthDate) {
      setError("Vui lòng chọn ngày sinh của bạn.");
      return;
    }
    const today = new Date();
    if (birthDate > today) {
      setError("Ngày sinh không thể ở trong tương lai.");
      return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += lastDayOfPreviousMonth;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const resultText = `Tuổi của bạn là: ${years} năm, ${months} tháng, và ${days} ngày.`;
    setResult(resultText);

    addToHistory(
      "Tính Tuổi",
      `Ngày sinh: ${format(birthDate, "dd/MM/yyyy")}\nKết quả: ${years} năm, ${months} tháng, ${days} ngày`
    );
  };

  const handleClear = () => {
    setBirthDate(undefined);
    setResult("");
    setError("");
  };

  return (
    <ToolCard
      id={id}
      title="Tính Tuổi"
      description="Nhập ngày sinh của bạn để tính tuổi chính xác đến từng ngày."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label>Ngày sinh của bạn</Label>
          <DatePicker date={birthDate} setDate={setBirthDate} placeholder="Chọn ngày sinh..."/>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <Button onClick={handleCalculate} disabled={!birthDate}>Tính Tuổi</Button>
      </CardFooter>
    </ToolCard>
  );
}