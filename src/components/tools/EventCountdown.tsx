import { useState, useEffect } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHistory } from "@/contexts/HistoryContext";
import { format, startOfToday } from "date-fns";
import { getCountdownTargetDate } from "@/lib/date-logic";

interface EventCountdownProps { id: string; }

export function EventCountdown({ id }: EventCountdownProps) {
  const { addToHistory } = useHistory();
  const [eventName, setEventName] = useState<string>("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive || !targetDate) {
      setCountdown("");
      return;
    }

    const countdownTarget = getCountdownTargetDate(targetDate);

    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownTarget.getTime() - now;
      if (distance < 0) {
        clearInterval(intervalId);
        setCountdown(`Ngày "${eventName || 'Sự kiện'}" đã khép lại.`);
        setIsActive(false);
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(`${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isActive, targetDate, eventName]);

  const handleStart = () => {
    if (!targetDate) return;

    if (targetDate < startOfToday()) {
      setError("Vui lòng chọn hôm nay hoặc một ngày trong tương lai.");
      setIsActive(false);
      setCountdown("");
      return;
    }

    setError("");
    setIsActive(true);
    setShowSuccess(true);
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
    addToHistory(
      "Đếm Ngược Sự Kiện",
      `Sự kiện: ${eventName || 'Không tên'}\nĐếm đến cuối ngày: ${format(targetDate, 'dd/MM/yyyy')}`
    );
  };

  const handleClear = () => {
    setIsActive(false);
    setTargetDate(undefined);
    setEventName("");
    setCountdown("");
    setError("");
  };

  return (
    <ToolCard
      id={id}
      title="Đếm Ngược Sự Kiện"
      description="Chọn một ngày và xem thời gian còn lại đến cuối ngày đó."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="event-name">Tên sự kiện</Label>
            <Input id="event-name" placeholder="Ví dụ: Tết Nguyên Đán" value={eventName} onChange={(e) => setEventName(e.target.value)}/>
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label className="font-serif">Ngày diễn ra</Label>
          <DatePicker date={targetDate} setDate={setTargetDate} minDate={startOfToday()} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {showSuccess && (
          <div className="text-sm text-green-600 dark:text-green-400 font-serif animate-in fade-in duration-300 rounded-md bg-green-100/50 dark:bg-green-900/20 p-2 text-center">
            ✓ Bắt đầu đếm ngược thành công
          </div>
        )}
        {countdown && (
          <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm gold-glow text-center animate-in fade-in duration-300">
            <p className="font-semibold text-primary font-serif text-lg tracking-wider">{countdown}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between pt-6 px-0">
        <Button variant="outline" onClick={handleClear}>Xóa</Button>
        <Button onClick={handleStart} disabled={!targetDate || isActive}>Bắt đầu</Button>
      </CardFooter>
    </ToolCard>
  );
}