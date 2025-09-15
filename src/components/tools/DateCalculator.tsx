import { useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { add, sub, format } from 'date-fns';
import { useHistory } from "@/contexts/HistoryContext";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";

interface DateCalculatorProps { id: string; }

export function DateCalculator({ id }: DateCalculatorProps) {
  const { addToHistory } = useHistory();
  const [baseDate, setBaseDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<number>(1);
  const [unit, setUnit] = useState<string>('days');
  const [result, setResult] = useState<string>("");

  const handleCalculate = (operation: 'add' | 'subtract') => {
    if (!baseDate) return;

    let newDate: Date;
    const options = { [unit]: amount };

    if (operation === 'add') {
      newDate = add(baseDate, options);
    } else {
      newDate = sub(baseDate, options);
    }

    const formattedDate = newDate.toLocaleDateString("vi-VN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    setResult(`Ngày kết quả là: ${formattedDate}`);

    const unitMap: { [key: string]: string } = { days: 'Ngày', weeks: 'Tuần', months: 'Tháng', years: 'Năm' };
    addToHistory(
      "Thêm / Bớt Ngày",
      `Ngày gốc: ${format(baseDate, "dd/MM/yyyy")}\nThao tác: ${operation === 'add' ? 'Thêm' : 'Bớt'} ${amount} ${unitMap[unit]}\nKết quả: ${format(newDate, "dd/MM/yyyy")}`
    );
  };

  const handleClear = () => {
    setBaseDate(new Date());
    setAmount(1);
    setUnit('days');
    setResult("");
  }

  return (
    <ToolCard
      id={id}
      title="Thêm / Bớt Ngày"
      description="Tính toán một ngày trong tương lai hoặc quá khứ từ một mốc thời gian."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label>Chọn một ngày</Label>
          <DatePickerWithToday date={baseDate} setDate={setBaseDate} />
        </div>
        <div className="flex items-end space-x-2">
          <div className="grid flex-grow items-center gap-1.5">
            <Label htmlFor="amount">Số lượng</Label>
            <Input 
              id="amount" type="number" value={amount} 
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 1)}
              min="1"
            />
          </div>
          <div className="grid w-[120px] items-center gap-1.5">
             <Label>Đơn vị</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue placeholder="Đơn vị" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Ngày</SelectItem>
                <SelectItem value="weeks">Tuần</SelectItem>
                <SelectItem value="months">Tháng</SelectItem>
                <SelectItem value="years">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {result && (
          <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <div className="flex space-x-2">
            <Button onClick={() => handleCalculate('add')}>Thêm (+)</Button>
            <Button onClick={() => handleCalculate('subtract')}>Bớt (-)</Button>
        </div>
      </CardFooter>
    </ToolCard>
  );
}