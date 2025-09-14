import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/ToolCard";
import { CardFooter } from "@/components/ui/card";
import { useHistory } from "@/contexts/HistoryContext";

interface LeapYearCheckerProps {
  id: string;
}

export function LeapYearChecker({ id }: LeapYearCheckerProps) {
  const { addToHistory } = useHistory();
  const [yearInput, setYearInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCheck = () => {
    setError("");
    setResult("");
    if (!/^\d{1,4}$/.test(yearInput) || +yearInput === 0) {
      setError("Vui lòng nhập một năm hợp lệ (1-9999).");
      return;
    }
    const year = parseInt(yearInput, 10);
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const resultText = `Năm ${year} ${isLeap ? "là" : "không phải là"} năm nhuận.`;
    setResult(resultText);
    
    addToHistory("Kiểm Tra Năm Nhuận", `Năm: ${year}\nKết quả: ${isLeap ? "Là năm nhuận" : "Không phải năm nhuận"}`);
  };

  const handleClear = () => {
    setYearInput("");
    setResult("");
    setError("");
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYearInput(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <ToolCard
      id={id}
      title="Kiểm Tra Năm Nhuận"
      description="Nhập một năm để kiểm tra xem đó có phải là năm nhuận dương lịch hay không."
    >
      <div className="flex flex-col space-y-2">
        <Label htmlFor="year-input">Năm</Label>
        <Input
          id="year-input"
          type="number"
          placeholder="VD: 2024"
          value={yearInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
           <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="flex justify-end space-x-2 pt-6 px-0">
          <Button variant="outline" onClick={handleClear}>Xóa</Button>
          <Button onClick={handleCheck}>Kiểm tra</Button>
      </CardFooter>
    </ToolCard>
  );
}