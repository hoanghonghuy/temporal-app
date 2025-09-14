import { useState, useEffect } from "react";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHistory } from "@/contexts/HistoryContext";
import { format } from "date-fns";

interface EventCountdownProps { id: string; }

export function EventCountdown({ id }: EventCountdownProps) {
  const { addToHistory } = useHistory();
  const [eventName, setEventName] = useState<string>("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive || !targetDate) {
      setCountdown("");
      return;
    }
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) {
        clearInterval(intervalId);
        setCountdown(`Sự kiện "${eventName || 'Sự kiện'}" đã diễn ra!`);
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
    if (targetDate) {
      setIsActive(true);
      addToHistory(
        "Đếm Ngược Sự Kiện",
        `Sự kiện: ${eventName || 'Không tên'}\nĐến ngày: ${format(targetDate, 'dd/MM/yyyy')}`
      );
    }
  };

  const handleClear = () => {
    setIsActive(false);
    setTargetDate(undefined);
    setEventName("");
    setCountdown("");
  };

  return (
    <ToolCard
      id={id}
      title="Đếm Ngược Sự Kiện"
      description="Chọn một mốc thời gian trong tương lai và xem đồng hồ đếm ngược."
    >
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="event-name">Tên sự kiện</Label>
            <Input id="event-name" placeholder="Ví dụ: Tết Nguyên Đán" value={eventName} onChange={(e) => setEventName(e.target.value)}/>
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label>Ngày diễn ra sự kiện</Label>
          <DatePicker date={targetDate} setDate={setTargetDate} />
        </div>
        {countdown && (
          <div className="mt-2 rounded-lg border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-secondary-foreground">{countdown}</p>
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