import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { convertSolar2Lunar } from "@/lib/lunar-converter";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}: CalendarHeaderProps) {

  // Logic để tính toán và hiển thị tháng Âm lịch ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const [, lunarMonthStart, lunarYearStart, , , , , yearCanStart, yearChiStart] = 
    convertSolar2Lunar(monthStart.getDate(), monthStart.getMonth() + 1, monthStart.getFullYear());
  const [, lunarMonthEnd, lunarYearEnd, , , , , yearCanEnd, yearChiEnd] = 
    convertSolar2Lunar(monthEnd.getDate(), monthEnd.getMonth() + 1, monthEnd.getFullYear());
  
  let lunarMonthDisplay = "";

  if (lunarYearStart !== lunarYearEnd) {
      // Trường hợp hiếm gặp: tháng Dương lịch bắc cầu qua 2 năm Âm lịch (thường là tháng 1 hoặc 2 DL)
       lunarMonthDisplay = `Năm ${yearCanStart} ${yearChiStart} - ${yearCanEnd} ${yearChiEnd}`;
  } else if (lunarMonthStart !== lunarMonthEnd) {
      // Trường hợp phổ biến: tháng Dương lịch bắc cầu qua 2 tháng Âm lịch
       lunarMonthDisplay = `Tháng ${lunarMonthStart} & ${lunarMonthEnd} Âm lịch - Năm ${yearCanStart} ${yearChiStart}`;
  } else {
      // Trường hợp tháng Dương lịch nằm trọn trong 1 tháng Âm lịch
       lunarMonthDisplay = `Tháng ${lunarMonthStart} Âm lịch - Năm ${yearCanStart} ${yearChiStart}`;
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        {/* Bọc tiêu đề Dương và Âm lịch vào một div */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </h2>
          {/* Hiển thị tháng Âm lịch đã tính toán */}
          <p className="text-sm text-muted-foreground">{lunarMonthDisplay}</p>
        </div>
        <Button onClick={onGoToToday} variant="outline" size="sm">
          Hôm nay
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onPrevMonth} variant="outline" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNextMonth} variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}