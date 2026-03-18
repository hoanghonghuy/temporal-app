import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/ToolCard";
import { CardFooter } from "@/components/ui/card";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";

interface LeapYearCheckerProps {
  id: string;
}

export function LeapYearChecker({ id }: LeapYearCheckerProps) {
  const { dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [yearInput, setYearInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const copy = dictionary.tools.leapYearChecker;
  const toolMeta = dictionary.toolMeta["leap-year"];

  const handleCheck = () => {
    setError("");
    setResult("");

    if (!/^\d{1,4}$/.test(yearInput) || +yearInput === 0) {
      setError(copy.errorInvalid);
      return;
    }

    const year = parseInt(yearInput, 10);
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    setResult(
      formatTemplate(copy.resultTemplate, {
        year,
        resultWord: isLeap ? copy.resultWordLeap : copy.resultWordNotLeap,
      })
    );
    addToHistory(
      copy.historyType,
      formatTemplate(copy.historyResultTemplate, {
        year,
        status: isLeap ? copy.historyStatusLeap : copy.historyStatusNotLeap,
      })
    );
  };

  const handleClear = () => {
    setYearInput("");
    setResult("");
    setError("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setYearInput(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-2">
        <Label htmlFor="year-input">{copy.year}</Label>
        <Input
          id="year-input"
          type="number"
          placeholder={copy.placeholder}
          value={yearInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="gold-glow mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <p className="text-center font-serif font-medium italic text-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="flex justify-end space-x-2 px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleCheck}>{copy.check}</Button>
      </CardFooter>
    </ToolCard>
  );
}
